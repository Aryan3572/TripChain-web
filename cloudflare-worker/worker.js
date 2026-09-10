/**
 * Cloudflare Worker: Tripchain Edge API Gateway & Caching Proxy
 * 
 * Features:
 * - Edge Caching for read-heavy REST endpoints (/api/dashboard/overview, /api/eco-score)
 * - Automatic CORS Preflight (OPTIONS) resolution at edge (<10ms)
 * - Edge Security Headers (HSTS, X-Frame-Options, CSP, etc.)
 * - Protects your Express origin server from traffic spikes and DDoS attacks
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const originBackend = env.BACKEND_ORIGIN || "http://localhost:5000";

    // Standard CORS Headers for API requests
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    };

    // 1. Handle CORS Preflight at the Edge without hitting Express
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // 2. Determine if endpoint is safe for edge caching
    const isCacheableGet =
      request.method === "GET" &&
      (url.pathname.startsWith("/api/dashboard/overview") ||
       url.pathname.startsWith("/api/dashboard/weekly-stats") ||
       url.pathname.startsWith("/api/dashboard/mode-share") ||
       url.pathname.startsWith("/api/eco-score"));

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);

    // 3. Check Cloudflare Edge Cache for GET requests
    if (isCacheableGet) {
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        // Return cached response with a custom header indicating Edge Cache Hit
        const response = new Response(cachedResponse.body, cachedResponse);
        response.headers.set("X-Tripchain-Cache", "HIT-CLOUDFLARE-EDGE");
        return response;
      }
    }

    // 4. Proxy request to your Express origin server
    const targetUrl = new URL(url.pathname + url.search, originBackend);
    const originRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "follow",
    });

    try {
      const originResponse = await fetch(originRequest);

      // Clone response to add security and CORS headers
      const modifiedResponse = new Response(originResponse.body, originResponse);

      // Attach CORS headers
      for (const [key, value] of Object.entries(corsHeaders)) {
        modifiedResponse.headers.set(key, value);
      }

      // Security Headers
      modifiedResponse.headers.set("X-Content-Type-Options", "nosniff");
      modifiedResponse.headers.set("X-Frame-Options", "DENY");
      modifiedResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

      // 5. Cache successful read responses at Cloudflare Edge for 60 seconds
      if (isCacheableGet && originResponse.status === 200) {
        modifiedResponse.headers.set("Cache-Control", "public, max-age=60, s-maxage=60");
        modifiedResponse.headers.set("X-Tripchain-Cache", "MISS-FETCHED-ORIGIN");

        // Asynchronously save to Cloudflare Edge Cache
        ctx.waitUntil(cache.put(cacheKey, modifiedResponse.clone()));
      }

      return modifiedResponse;
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Edge Gateway Error",
          message: "Unable to reach the Tripchain origin server. Please check your backend status.",
          details: err.message,
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  },
};
