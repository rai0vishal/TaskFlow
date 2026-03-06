<h1 align="center">📋 TaskFlow</h1>
<p align="center">
  <strong>A Full-Stack Project Management System</strong><br/>
  Built to demonstrate production-grade backend engineering — authentication, RESTful API design, security best practices, and clean modular architecture.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?style=flat-square&logo=swagger&logoColor=black" />
</p>

---

## 📖 About

**TaskFlow** is a full-stack task management application developed as an internship backend engineering assignment. It features secure JWT-based authentication, role-based access control, full CRUD operations on tasks, and a clean React frontend — all following industry best practices for API design, input validation, error handling, and security.

---

## ✨ Key Features

| Category | Features |
|---|---|
| **Authentication** | User registration & login with bcrypt password hashing |
| **Authorization** | JWT-based authentication with role-based access control (`admin` / `user`) |
| **Task Management** | Complete CRUD — Create, Read, Update, Delete tasks with ownership enforcement |
| **API Design** | RESTful endpoints with API versioning (`/api/v1/`), pagination, and status filtering |
| **Validation** | Request body validation using Zod schemas on every endpoint |
| **Error Handling** | Global error handler covering Mongoose, JWT, Zod, CORS, and payload errors |
| **Security** | Helmet CSP, CORS, rate limiting, NoSQL injection prevention, XSS sanitization |
| **Documentation** | Interactive Swagger UI (OpenAPI 3.0) |
| **Audit Log** | Task activity history tracking all create, update, and delete operations |
| **Frontend** | Protected dashboard, JWT auto-injection, toast notifications, responsive UI |

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | ODM for MongoDB |
| **jsonwebtoken** | JWT authentication |
| **bcrypt** | Password hashing |
| **Zod** | Input validation |
| **Swagger (swagger-jsdoc)** | API documentation |
| **Winston** | Application logging |
| **Morgan** | HTTP request logging |
| **Helmet** | Security headers |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **Vite** | Build tool & dev server |
| **Tailwind CSS v4** | Utility-first styling |
| **Axios** | HTTP client |
| **React Router DOM** | Client-side routing |
| **React Hot Toast** | Toast notifications |
| **Lucide React** | Icon library |

---

## 🏗 System Architecture

```
┌──────────────┐       HTTP        ┌──────────────────┐       Mongoose      ┌──────────────┐
│              │  ──────────────▶  │                  │  ──────────────▶    │              │
│    React     │    /api/v1/*      │  Express.js API  │     Queries         │   MongoDB    │
│   Frontend   │  ◀──────────────  │    (Node.js)     │  ◀──────────────    │   Database   │
│              │    JSON + JWT     │                  │     Documents       │              │
└──────────────┘                   └──────────────────┘                     └──────────────┘
   Port 3000                          Port 5000
```

**Request Flow:**
1. User interacts with the React frontend
2. Axios sends API requests with JWT in the `Authorization` header
3. Express middleware validates the token, sanitizes input, and rate-limits requests
4. Controller delegates to the Service layer for business logic
5. Service layer interacts with MongoDB via Mongoose models
6. Consistent JSON response is returned to the frontend

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user account | ❌ |
| `POST` | `/api/v1/auth/login` | Login and receive JWT token | ❌ |

### Tasks (CRUD)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/tasks` | Create a new task | ✅ |
| `GET` | `/api/v1/tasks` | List tasks (paginated, filterable by status) | ✅ |
| `GET` | `/api/v1/tasks/:id` | Get a single task by ID | ✅ |
| `PUT` | `/api/v1/tasks/:id` | Update a task | ✅ |
| `DELETE` | `/api/v1/tasks/:id` | Delete a task | ✅ |
| `GET` | `/api/v1/tasks/:id/activity` | Get task activity/audit log | ✅ |

### Utility

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |

> All protected endpoints return `401 Unauthorized` without a valid token and `403 Forbidden` when accessing another user's resources (unless admin).

---

## 📂 Project Structure

```
taskflow/
│
├── backend/
│   ├── config/              # Environment config, DB connection, Swagger spec
│   │   ├── index.js         # Centralized config from .env
│   │   ├── db.js            # MongoDB connection
│   │   └── swagger.js       # OpenAPI 3.0 specification
│   │
│   ├── controllers/         # Request handlers (thin layer)
│   │   ├── auth.controller.js
│   │   └── task.controller.js
│   │
│   ├── middleware/           # Express middleware
│   │   ├── auth.js          # JWT verification + role-based authorization
│   │   ├── errorHandler.js  # Global error handler
│   │   ├── notFoundHandler.js
│   │   ├── rateLimiter.js   # API + Auth rate limiters
│   │   ├── validate.js      # Zod validation middleware
│   │   └── xssSanitizer.js  # XSS prevention
│   │
│   ├── models/              # Mongoose schemas
│   │   ├── User.js          # User model with bcrypt hooks
│   │   ├── Task.js          # Task model with compound indexes
│   │   └── TaskActivity.js  # Audit log model
│   │
│   ├── routes/              # Route definitions
│   │   ├── auth.routes.js
│   │   └── task.routes.js
│   │
│   ├── services/            # Business logic layer
│   │   ├── auth.service.js  # Register, login, token generation
│   │   └── task.service.js  # CRUD + ownership checks + activity logging
│   │
│   ├── utils/               # Shared utilities
│   │   ├── ApiError.js      # Custom error class with static factory methods
│   │   ├── asyncHandler.js  # Async error wrapper
│   │   ├── logger.js        # Winston logger configuration
│   │   └── sendResponse.js  # Consistent response formatter
│   │
│   ├── validations/         # Zod validation schemas
│   │   ├── auth.validation.js
│   │   └── task.validation.js
│   │
│   ├── app.js               # Express app setup (middleware, routes)
│   └── server.js            # Entry point (DB connect, listen, graceful shutdown)
│
├── frontend/
│   └── src/
│       ├── api/             # Axios instance + API functions
│       ├── components/      # Navbar, TaskCard, TaskModal, ProtectedRoute
│       ├── context/         # AuthContext (global auth state)
│       ├── pages/           # Login, Register, Dashboard, TaskManagement
│       ├── App.jsx          # Root component with routing
│       └── main.jsx         # DOM entry point
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/) (local install or MongoDB Atlas)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/taskflow.git
cd taskflow
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Update `.env` with your MongoDB URI and a strong JWT secret (see [Environment Variables](#-environment-variables)).

Start the backend server:

```bash
npm run dev
```

> Backend runs on **http://localhost:5000**

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

> Frontend runs on **http://localhost:3000** and automatically proxies `/api` requests to the backend.

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/project_management

# Authentication
JWT_SECRET=your_strong_random_secret_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

| Variable | Description | Required |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | Secret key for signing JWT tokens | ✅ |
| `PORT` | Backend server port (default: 5000) | Optional |
| `JWT_EXPIRES_IN` | Token expiration duration (default: 7d) | Optional |
| `CORS_ORIGIN` | Allowed frontend origin | Optional |

---

## 📑 API Documentation

Interactive **Swagger UI** is available when the backend is running:

```
http://localhost:5000/api-docs
```

The raw OpenAPI 3.0 JSON spec can be accessed at:

```
http://localhost:5000/api-docs.json
```

The documentation includes all endpoints, request/response schemas, authentication requirements, and example payloads.

---

## 🔒 Security Practices

| Practice | Implementation |
|---|---|
| **Password Hashing** | bcrypt with 12 salt rounds — passwords never stored in plain text |
| **JWT Authentication** | Stateless token-based auth with configurable expiration |
| **Protected Routes** | `authenticate` middleware verifies JWT on every protected endpoint |
| **Role-Based Access** | `authorize` middleware restricts endpoints by user role |
| **Input Validation** | Zod schemas validate all request payloads before processing |
| **NoSQL Injection Prevention** | `express-mongo-sanitize` strips `$` and `.` operators |
| **XSS Prevention** | Custom sanitizer escapes HTML entities in all user input |
| **HTTP Parameter Pollution** | `hpp` middleware prevents duplicate query parameter attacks |
| **Security Headers** | Helmet sets CSP, HSTS, X-Frame-Options, and other headers |
| **Rate Limiting** | Global API limiter (100 req/15min) + stricter auth limiter (20 req/15min) |
| **Error Sanitization** | Stack traces only exposed in development mode |

---

## 📈 Scalability Notes

The system is designed with scalability in mind:

- **Service Layer Pattern** — Business logic is separated from controllers, making it easy to swap data sources, add caching, or extract into microservices
- **Modular Middleware** — Auth, validation, and rate limiting can be independently configured per route
- **Pagination Built-In** — Task listing supports pagination to handle large datasets efficiently
- **Indexed Queries** — Compound index on `createdBy + status` optimizes the most common query pattern
- **Structured Logging** — Winston + Morgan output structured JSON logs, ready for integration with ELK Stack, Datadog, or CloudWatch
- **Environment-Based Config** — Centralized config module allows seamless transition between dev, staging, and production
- **Stateless Auth** — JWT-based authentication enables horizontal scaling without session affinity

---

## 🔮 Future Improvements

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
  Built with ❤️ as part of an internship assignment to demonstrate backend engineering fundamentals.
</p>
