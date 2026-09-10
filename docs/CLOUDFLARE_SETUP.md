# Cloudflare Partial Integration Guide for Tripchain

Cloudflare provides a global edge network spanning 300+ cities worldwide. You can use Cloudflare in two simple ways without rewriting your Express backend:

---

## Method 1: The 5-Minute CDN Proxy (Zero Code) ⭐

This is the standard and most powerful way to use Cloudflare for any web project. It sits in front of your domain and gives you:
- **Free Automatic SSL/TLS (HTTPS)**
- **Global CDN Caching** for frontend HTML, CSS, JS, and images
- **DDoS Mitigation & Web Application Firewall (WAF)**
- **HTTP/3 & Brotli Compression** for lightning-fast mobile loads

### Step-by-Step Setup:
1. **Sign Up**: Create a free account at [https://cloudflare.com](https://cloudflare.com).
2. **Add Your Domain**: Click **Add a Domain** and enter your custom domain (e.g. `tripchain.com` or whatever domain you own from Namecheap, GoDaddy, Hostinger, etc.).
3. **Select Free Plan**: Select the **Free Plan** ($0/month).
4. **Update Nameservers**: Cloudflare will give you two nameservers (e.g. `amy.ns.cloudflare.com` and `bob.ns.cloudflare.com`). Go to your domain registrar where you purchased the domain, replace your nameservers with Cloudflare's, and save.
5. **Enable the Orange Cloud (Proxy)**:
   - In Cloudflare's **DNS** tab, add your DNS records pointing to where your frontend and backend are hosted (e.g., Vercel, Netlify, Render, Railway).
   - Ensure the **Proxy status** toggle is set to **Proxied (Orange Cloud)**.
6. **Configure SSL**:
   - Go to **SSL/TLS** in Cloudflare and set the encryption mode to **Full** or **Full (strict)**.

---

## Method 2: Cloudflare Worker Edge Gateway (Included in Repository)

We have provided a ready-to-deploy Cloudflare Worker in the `cloudflare-worker/` folder of this repository.

### What it Does:
- Sits at Cloudflare's edge data centers globally.
- Instantly handles CORS preflight (`OPTIONS`) requests at the edge without hitting your Express server.
- Caches read-heavy REST endpoints (`/api/dashboard/overview`, `/api/eco-score`) for 60 seconds at edge locations close to your users.
- Automatically injects security headers (`X-Frame-Options`, `X-Content-Type-Options`).

### How to Deploy the Worker:
1. Open a terminal and navigate to the `cloudflare-worker` directory:
   ```bash
   cd cloudflare-worker
   ```
2. Open `wrangler.toml` and update `BACKEND_ORIGIN` with your deployed backend URL:
   ```toml
   [vars]
   BACKEND_ORIGIN = "https://your-backend-domain.com"
   ```
3. Deploy to your Cloudflare account with 1 command:
   ```bash
   npx wrangler deploy
   ```
   *(If it's your first time, it will prompt you to log into your Cloudflare account in the browser once).*
4. Cloudflare will give you a public worker URL (e.g. `https://tripchain-edge-gateway.your-subdomain.workers.dev`).
5. Update your frontend's `REACT_APP_API_URL` to point to this Worker URL so all requests pass through Cloudflare's edge cache!
