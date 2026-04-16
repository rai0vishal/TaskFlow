<h1 align="center">📋 TaskFlow - Enterprise Task Management</h1>
<p align="center">
  <strong>A Production-Ready Full-Stack MERN Application</strong><br/>
  Featuring real-time WebSockets, robust drag-and-drop mechanics, advanced analytics, and a premium glassmorphism UI.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-000000?style=flat-square&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" />
</p>

---

## 📖 About

**TaskFlow** is an advanced, full-stack project management platform engineered for speed and real-time collaboration. By leveraging a highly decoupled MERN architecture alongside **Socket.IO payload synchronization**, TaskFlow seamlessly bridges the gap between secure, scalable backend processing and a hyper-fluid, modern client experience. 

---

## 🌐 Live Demo

| | Link |
|---|---|
| 🖥 **Frontend App** | [task-flow-omega-khaki.vercel.app](https://task-flow-omega-khaki.vercel.app) |
| 🔗 **Backend API** | [taskflow-2o2c.onrender.com](https://taskflow-2o2c.onrender.com/api/health) |
| 📑 **API Documentation (Swagger)** | **[taskflow-2o2c.onrender.com/api-docs](https://taskflow-2o2c.onrender.com/api-docs)** |

> ⚡ **Note:** The backend is hosted on Render's free tier and may take ~30 seconds to wake up on the first request.

---

## ✨ Key Features

| Category | Features |
|---|---|
| **Real-Time Engine** | Socket.IO bi-directional communication ensures instant UI state syncs across client instances |
| **Task Board Architecture** | High-performance drag-and-drop functionality built on `@dnd-kit/core` |
| **Analytics Dashboard** | Live telemetry, completion velocity graphs via `recharts`, and comprehensive audit timelines |
| **Authentication** | Hardened JWT flows with bcrypt permutation mapping and isolated user constraints |
| **API Design** | RESTful endpoints with strict API versioning (`/api/v1/`), pagination, and deterministic status filtering |
| **Validation Layer** | Comprehensive payload sanitization utilizing Zod schemas across every incoming vector |
| **Error Handling** | Global exception interception mapping Mongoose, JWT, Zod, and CORS errors gracefully |
| **Security Mesh** | Helmet CSP, rigid CORS matrices, rate limiting, NoSQL obfuscation, and rapid XSS sanitization |

---

## 🛠 Tech Stack

### Backend Infrastructure
| Technology | Purpose |
|---|---|
| **Node.js + Express** | High-throughput asynchronous routing |
| **MongoDB + Mongoose** | NoSQL clustering and ODM schematics |
| **Socket.IO** | TCP-mimicked real-time event broadcasting |
| **JWT & bcrypt** | Cryptographic identity verification |
| **Zod** | Rigid deterministic payload validation |
| **Swagger** | Interactive API abstraction |
| **Helmet & Morgan** | Header hardening & HTTP traffic instrumentation |

### Frontend Client
| Technology | Purpose |
|---|---|
| **React 19** | Concurrent UI rendering |
| **Vite** | Highly optimized HMR and build compilation |
| **Tailwind CSS v4** | Granular design-token application and glassmorphism styling |
| **Recharts** | Granular SVG data visualization |
| **@dnd-kit** | Sensor-based kinematic drag-and-drop systems |
| **Lucide React** | Scale-invariant iconography |

---

## 🏗 Modular Architecture

```
┌──────────────┐    HTTPS / WebSockets    ┌──────────────────┐       Mongoose      ┌──────────────┐
│              │  ────────────────────▶   │                  │  ──────────────▶    │              │
│    React     │    /api/v1/*   [WS]      │   Node.js API    │     Queries         │   MongoDB    │
│    Client    │  ◀────────────────────   │   (Socket.IO)    │  ◀──────────────    │   Database   │
│              │      JSON + JWT          │                  │     Documents       │              │
└──────────────┘                          └──────────────────┘                     └──────────────┘
```

**System Flow:**
1. Clients establish secure JWT identity upon boot.
2. The UI intercepts local interaction vectors, initiating zero-latency Optimistic Updates.
3. Axios commits mutations through Zod validation boundaries into the Express controllers.
4. Mongoose ODM handles database transactional consistency.
5. Socket.io emitters simultaneously broadcast the state change to connected peer clusters.

---

## 📡 Core Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Identity bootstrapping |
| `POST` | `/api/v1/auth/login` | Session token generation |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/tasks` | Initialize new task object |
| `GET` | `/api/v1/tasks` | Pull filtered/paginated task lists |
| `PUT` | `/api/v1/tasks/:id` | Execute task state mutation |
| `DELETE` | `/api/v1/tasks/:id` | Purge task entity |

---

## 🚀 Deployment & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- Active MongoDB instance

### Environment Bootup

1. **Clone the matrix:**
```bash
git clone https://github.com/your-username/taskflow.git
cd taskflow
```

2. **Initialize Backend API:**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

3. **Initialize Frontend Client:**
```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

*The application will boot successfully at `http://localhost:3000` connected to `http://localhost:5000`.*

---

## 📈 Scalability Notes

- **Service Layer Pattern** — Business logic is separated from controllers, making it easy to swap data sources, add caching, or extract into microservices
- **Modular Middleware** — Auth, validation, and rate limiting can be independently configured per route
- **Pagination Built-In** — Task listing supports pagination to handle large datasets efficiently
- **Indexed Queries** — Compound index on `createdBy + status` optimizes the most common query pattern
- **Structured Logging** — Winston + Morgan output structured JSON logs, ready for integration with ELK Stack, Datadog, or CloudWatch
- **Environment-Based Config** — Centralized config module allows seamless transition between dev, staging, and production
- **Stateless Auth** — JWT-based authentication enables horizontal scaling without session affinity

---


- [ ] Add unit and integration tests (Jest + Supertest)
- [ ] Implement task assignment to other users
- [ ] Add project grouping for tasks
- [ ] Email notifications for task deadlines
- [ ] Implement refresh token rotation for enhanced security
- [ ] Add WebSocket support for real-time task updates
- [ ] CI/CD pipeline with GitHub Actions

---

## 👤 Author

**Vishal Rai**
B.Tech — Computer Science & Engineering
Full Stack / Backend Developer

---

<p align="center">
  Built with ❤️ to push the limits of modern web development and scalable real-time systems.
</p>
