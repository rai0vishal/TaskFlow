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

**TaskFlow** is a multi-workspace, collaborative task management SaaS application engineered for speed and real-time productivity. By leveraging a highly decoupled MERN architecture alongside **Socket.IO synchronization**, TaskFlow seamlessly bridges the gap between secure, scalable backend processing and a hyper-fluid, modern client experience. It features a robust workspace-based architecture, real-time collaboration, and strict role-based access control (RBAC). 

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
| **Workspace System** | Multi-workspace support, seamless switching with persistence, and complete workspace-based data isolation. |
| **Task Management** | Kanban board with drag-and-drop, task assignment/ownership, role-based permissions, and isolated activity history. |
| **Collaboration** | Workspace-based real-time chat, online/offline presence tracking, typing indicators, and unread badges. |
| **Invite System** | Admin-only workspace invites with a clean, dashboard-based acceptance/rejection flow. |
| **Analytics & Profile** | User productivity analytics, performance vs. contribution metrics, date-based filtering, and a 90-day activity heatmap. |
| **Security & RBAC** | Strict Role-Based Access Control (Admin vs Member), backend API validation, and workspace-level data isolation. |


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
| **Context API** | Global state management across workspaces |
| **Tailwind CSS v4** | Granular design-token application and glassmorphism styling |
| **Recharts** | Granular SVG data visualization |
| **@dnd-kit** | Sensor-based kinematic drag-and-drop systems |
| **Socket.IO-client** | Real-time bi-directional events |

---

## 🏗 Key Architectural Highlights

```text
┌──────────────┐    HTTPS / WebSockets    ┌──────────────────┐       Mongoose      ┌──────────────┐
│              │  ────────────────────▶   │                  │  ──────────────▶    │              │
│    React     │    /api/v1/*   [WS]      │   Node.js API    │     Queries         │   MongoDB    │
│    Client    │  ◀────────────────────   │   (Socket.IO)    │  ◀──────────────    │   Database   │
│              │      JSON + JWT          │                  │     Documents       │              │
└──────────────┘                          └──────────────────┘                     └──────────────┘
```

**System Flow & Architecture:**
- **Multi-Tenant Workspace Architecture**: Complete data isolation and strict RBAC enforcement per workspace.
- **Global State Management**: React Context API heavily utilized for seamless, persistent workspace switching and global loading states.
- **Real-Time Communication**: Socket.IO integrated for live chat, task updates, and presence tracking without page reloads.
- **Optimized Data Layer**: MongoDB queries optimized with indexing and clean separation of concerns between controllers and services.
- **Optimistic UI Updates**: The UI intercepts local interaction vectors, initiating zero-latency visual feedback before backend confirmation.


---

## 🚀 Performance & Optimization

- **Compound Indexing**: Complex queries for analytics and dashboard metrics are optimized using Mongoose compound indices.
- **Workspace-Scoped Queries**: All API queries strictly bind to `workspaceId` to prevent data leakage across organizations.
- **Optimized Rendering**: Heavy use of React memoization (`useMemo`, `useCallback`) to prevent unnecessary component re-renders during websocket events.
- **Component Lazy Loading**: Code-splitting and lazy loading applied to heavy dashboard and charting components.

## 🔐 Security & RBAC

- **Role-Based Access Control**: Granular permissions distinguishing between `Admin` and `Member` capabilities.
- **Restricted Actions**: Only Admins/Creators can delete tasks or invite users; members are strictly limited to participation.
- **API Validation**: Backend enforces strict Zod schema validation and authorization headers on every request.

## 🎨 UX Improvements

- **Dashboard-Based Invite System**: Cleanly surfaced actionable invites rather than burying them in basic notifications.
- **Clean Separation of Concerns**: Task editing and activity history are separated into dedicated, distraction-free panels.
- **Polished Aesthetics**: Dynamic glassmorphism elements, human-readable timestamps, and carefully orchestrated loading/empty states.
- **Workspace Management Safety**: Critical actions (like workspace deletion) include confirmation states and "Undo" toast capabilities for safe recovery (Soft Delete/Archiving).

---

## 📡 API Reference

The TaskFlow API is versioned (`/api/v1`) and documented via Swagger. Below is a comprehensive list of all **23 endpoints**.

### System & Docs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health and environment check |
| `GET` | `/api-docs` | Interactive Swagger UI |
| `GET` | `/api-docs.json` | Raw OpenAPI specification |

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Create a new user account |
| `POST` | `/api/v1/auth/login` | Authenticate and receive access/refresh tokens |
| `POST` | `/api/v1/auth/refresh-token` | Rotate tokens using a valid refresh token |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/tasks` | Initialize a new task |
| `GET` | `/api/v1/tasks` | Retrieve paginated/filtered task list |
| `GET` | `/api/v1/tasks/:id` | Fetch full details for a single task |
| `PUT` | `/api/v1/tasks/:id` | Update task fields (status, priority, etc.) |
| `DELETE` | `/api/v1/tasks/:id` | Permanent task deletion |
| `GET` | `/api/v1/tasks/:id/activity` | Retrieve task-specific audit log |

### Workspaces & Boards
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/workspaces` | Create a new project workspace |
| `GET` | `/api/v1/workspaces` | List all accessible workspaces |
| `POST` | `/api/v1/boards` | Create a board within a workspace |
| `GET` | `/api/v1/boards/:workspaceId` | Fetch boards for a specific workspace |

### Lists & Columns
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/lists` | Create a new task list/column |
| `GET` | `/api/v1/lists/:boardId` | Fetch lists for a specific board |

### Analytics & Reporting
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/analytics/dashboard` | Aggregated velocity and productivity metrics |

### Chat & Collaboration
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/chat/users/search` | Dynamic user lookup for messaging |
| `GET` | `/api/v1/chat/conversations` | List user's active chat conversations |
| `POST` | `/api/v1/chat/conversations` | Access or create a conversation |
| `GET` | `/api/v1/chat/messages/:conversationId` | Retrieve message history |


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
- [x] Implement refresh token rotation for enhanced security
- [x] Add WebSocket support for real-time task updates
- [x] Implement Chat & Collaborative messaging
- [x] Advanced Analytics Dashboard
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
