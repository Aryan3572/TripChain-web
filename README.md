# TripChain Web

TripChain is a user-centric travel tracker application with a modern, glassmorphic UI. This project is built using a React frontend and a Node.js/Express backend, connected to a PostgreSQL database via Prisma ORM. The entire application is containerized using Docker and can be orchestrated via Kubernetes.

## 🛠️ Technology Stack & Architecture Decisions

### Frontend
- **React.js**: Chosen for its component-based architecture, which allows us to build a highly interactive and dynamic Single Page Application (SPA). It makes state management across complex UI elements (like the route planner and dashboards) seamless.
- **Custom CSS (Glassmorphic Design)**: Instead of a heavy framework, we used custom CSS to implement a premium, high-performance "glassmorphism" aesthetic with deep custom theming.
- **Framer Motion**: Integrated to provide fluid, high-fidelity micro-animations and transitions, enhancing the overall user experience and making the interface feel "alive".
- **Mapbox GL JS**: Selected for the interactive Route Planner map. It offers stunning, highly customizable map tiles and incredibly fast WebGL rendering compared to traditional map libraries.

### Backend & Database
- **Node.js & Express.js**: Chosen for the backend server because its asynchronous, event-driven architecture is highly performant for handling concurrent I/O requests. It also allows us to use JavaScript across the entire stack.
- **PostgreSQL (NeonDB)**: A powerful relational database chosen for its strict data integrity and support for complex queries. We specifically host it on NeonDB to take advantage of its serverless scaling and connection pooling.
- **Prisma ORM**: Used to interact with PostgreSQL. Prisma was selected because it provides auto-generated, type-safe queries and an incredibly intuitive schema configuration, which drastically speeds up development and prevents SQL injection vulnerabilities.

### Infrastructure, Caching & Edge
- **Redis & In-Memory Fallback Cache**: Integrated via `ioredis` for sub-millisecond response times. Caches user dashboard KPIs, weekly stats, and eco-score aggregations with automatic cache invalidation on trip modifications. Supports cloud Redis (like Upstash) with zero-config in-memory fallback for local development.
- **Cloudflare Edge Gateway & CDN**: Supports edge caching of read-heavy REST endpoints, automatic CORS preflight handling, and edge security headers via a dedicated Cloudflare Worker (`cloudflare-worker/`).
- **Docker & Docker Compose**: Used to containerize both the frontend and backend, ensuring consistent behavior across all environments.
- **Kubernetes (K8s)**: Manifests provided for production-grade orchestrations, automated deployments, and load balancing.

---

## 🚀 Getting Started for Collaborators

If you are cloning this repository to work on it locally, follow these steps to get your environment configured correctly.

### 1. Prerequisites
Before you begin, ensure you have the following installed on your machine:
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 2. Clone the Repository
```bash
git clone https://github.com/Aryan3572/TripChain-web.git
cd TripChain-web
```

### 3. Setup Environment Variables (Critical Step)
For security reasons, `.env` files containing API keys and database credentials are intentionally excluded from version control. You must create these files locally before the application will run.

**Create the Frontend Environment File:**
1. Create a file named `.env` inside the `frontend/` directory.
2. Add your Mapbox token:
```env
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
REACT_APP_GOOGLE_CLIENT_ID=your_google_web_client_id
```
*(Reach out to the repository owner to get the secure Mapbox token if you don't have one).*

**Create the Backend Environment File:**
1. Create a file named `.env` inside the `backend/` directory.
2. Add the database and server configuration:
```env
DATABASE_URL="postgresql://neondb_owner:[PASSWORD]@ep-autumn-violet-axsuxlkn-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://neondb_owner:[PASSWORD]@ep-autumn-violet-axsuxlkn.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
PORT=5000
JWT_SECRET=replace_with_a_long_random_secret
GOOGLE_CLIENT_ID=your_google_web_client_id

# Login Security Alert Notifications
ADMIN_NOTIFICATION_EMAIL=beingaryan5555@gmail.com
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_16_digit_app_password

# Redis Distributed Caching (Optional — automatically falls back to in-memory cache if omitted)
REDIS_URL=rediss://default:your_password@your_endpoint.upstash.io:6379
```
*(Reach out to the repository owner to get the actual database passwords).*

---

## ⚡ Caching, Edge Gateway & Setup Guides

For detailed instructions on configuring performance and edge infrastructure, consult the setup guides in the `docs/` folder:

- 📖 [**Redis Caching Setup Guide**](docs/REDIS_SETUP.md): Step-by-step instructions on setting up free serverless Redis with Upstash, caching dashboard aggregations, and automatic invalidation.
- 🌐 [**Cloudflare Partial Integration Guide**](docs/CLOUDFLARE_SETUP.md): Instructions on enabling Cloudflare's free CDN proxy (Orange Cloud) for SSL/DDoS protection and deploying the Edge Gateway Worker (`cloudflare-worker/`).

### Google Sign-In setup

TripChain uses Google Identity Services with an OpenID Connect ID token. In Google
Cloud Console, configure the OAuth consent screen, create an OAuth 2.0 **Web
application** client, and add these authorized JavaScript origins:

- `http://localhost:3000` for `npm start`
- `http://localhost:8080` for Docker Compose
- `https://tripchain-dusky.vercel.app` for the current deployed frontend

Copy the same Web client ID to `frontend/.env` as `REACT_APP_GOOGLE_CLIENT_ID`
and to `backend/.env` as `GOOGLE_CLIENT_ID`. No Google client secret is used by
this ID-token flow. It does not require an authorized redirect URI because the
credential is returned to the browser callback and verified by the backend.

---

## 🐳 Running with Docker Compose (Recommended for Local Dev)

The easiest way to spin up the entire stack locally is by using Docker Compose. This will automatically build the images, link the frontend and backend, and expose the correct ports.

1. Ensure Docker Desktop is running.
2. Open a terminal in the root directory of the project.
3. Run the following command:
```bash
docker-compose up --build -d
```

For Docker Compose, CRA variables must be available during image build. Put
`REACT_APP_API_BASE` and `REACT_APP_GOOGLE_CLIENT_ID` in the repository-root
`.env` (which is ignored), or invoke Compose with an appropriate `--env-file`.
*(The `-d` flag runs the containers in the background).*

**Accessing the Application:**
- **Frontend**: `http://localhost:8080`
- **Backend API**: `http://localhost:5000`

To stop the containers when you are done working:
```bash
docker-compose down
```

---

## ☸️ Running with Kubernetes

If you want to test the Kubernetes deployment configuration, you can use the manifests provided in the `kubernetes/` folder.

1. Enable Kubernetes inside your Docker Desktop settings.
2. Open a terminal in the project root and apply the configurations:
```bash
kubectl apply -f kubernetes/secret.yaml
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/backend-service.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl apply -f kubernetes/frontend-service.yaml
```

To view the status of your pods and services:
```bash
kubectl get pods
kubectl get services
```

To tear down the Kubernetes environment:
```bash
kubectl delete -f kubernetes/
```
