# Redis Setup Guide for Tripchain

Tripchain includes an intelligent caching engine:
- **During local development**: It automatically uses a built-in in-memory fallback cache. You don't need to install anything.
- **In production (or when you want distributed caching)**: You can connect to a free cloud Redis database in under 2 minutes.

---

## Option 1: Free Serverless Redis (Upstash) — Recommended ⭐

[Upstash](https://upstash.com) provides a generous **10,000 commands/day free tier** with zero servers to manage.

### Step 1: Create your database
1. Go to [https://upstash.com](https://upstash.com) and log in with GitHub or Google.
2. Click **Create Database**.
3. Name it `tripchain-cache` and pick the region closest to you (e.g. `ap-south-1` Mumbai or `us-east-1`).
4. Click **Create**.

### Step 2: Copy your Redis URL
1. On your database overview page, scroll down to the **Connect your database** section.
2. Select the **Node.js** or **ioredis** tab.
3. Copy the standard connection string starting with `rediss://default:...`.

### Step 3: Add to `backend/.env`
Open `backend/.env` and paste your URL:
```env
REDIS_URL=rediss://default:your_password@your_endpoint.upstash.io:6379
```

### Step 4: Restart Backend
Restart your backend (`npm run dev`). You will see in the terminal:
```
[Redis] 🚀 Successfully connected to Redis database!
```

---

## Option 2: Redis Cloud (Redis.com)
1. Go to [https://redis.io/try-free](https://redis.io/try-free).
2. Create a free 30 MB database.
3. Copy the Public endpoint and password, and format as:
   ```env
   REDIS_URL=redis://default:password@host:port
   ```

---

## What is Cached in Tripchain?
1. **Dashboard Overview** (`/api/dashboard/overview`): Total trips, distance, CO2 saved, points, and eco-score aggregations. Cached for 5 minutes.
2. **Weekly Stats & Mode Shares** (`/api/dashboard/weekly-stats`, `/api/dashboard/mode-share`).
3. **Eco Score** (`/api/eco-score`): Cached for 5 minutes.
4. **Automatic Cache Invalidation**: As soon as a user adds a trip (`POST /api/trips`) or deletes trips, Tripchain automatically invalidates all cached keys for that user, keeping the UI completely up to date.
