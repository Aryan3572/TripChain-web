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

### Infrastructure & Orchestration
- **Docker & Docker Compose**: Used to containerize both the frontend and backend. This completely eliminates the "it works on my machine" problem by ensuring the application runs identically in any environment.
- **Kubernetes (K8s)**: Integrated to prepare the application for production-grade scaling. Kubernetes allows for automated deployment, self-healing, and load balancing of our containerized services.

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
```
*(Reach out to the repository owner to get the secure Mapbox token if you don't have one).*

**Create the Backend Environment File:**
1. Create a file named `.env` inside the `backend/` directory.
2. Add the database and server configuration:
```env
DATABASE_URL="postgresql://neondb_owner:[PASSWORD]@ep-autumn-violet-axsuxlkn-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://neondb_owner:[PASSWORD]@ep-autumn-violet-axsuxlkn.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
PORT=5000
JWT_SECRET=tripchain_super_secret
```
*(Reach out to the repository owner to get the actual database passwords).*

---

## 🐳 Running with Docker Compose (Recommended for Local Dev)

The easiest way to spin up the entire stack locally is by using Docker Compose. This will automatically build the images, link the frontend and backend, and expose the correct ports.

1. Ensure Docker Desktop is running.
2. Open a terminal in the root directory of the project.
3. Run the following command:
```bash
docker-compose up --build -d
```
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
