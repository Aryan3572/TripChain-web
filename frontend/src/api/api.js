const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export async function apiRequest(path, method = "GET", body) {
  const token = localStorage.getItem("tripchain_token");

  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) {
      // If unauthorized and NOT trying to login/register, force logout
      if ((res.status === 401 || res.status === 403) && !path.includes("/auth/")) {
        localStorage.removeItem("tripchain_token");
        localStorage.removeItem("tripchain_userEmail");
        window.location.href = "/login";
      }
      
      const msg = data?.message || `Request failed with status ${res.status}`;
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error("Unable to connect to the backend server. Is it running?");
    }
    throw err;
  }
}
