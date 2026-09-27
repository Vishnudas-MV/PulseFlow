# PulseFlow - Enterprise API & Webhook Reliability SaaS Platform

[![PulseFlow Remote Repository](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/Vishnudas-MV/PulseFlow.git)
[![Node.js Version](https://img.shields.io/badge/node->=%2020.0.0-brightgreen.svg)](https://nodejs.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20%2F%20Hexagonal-orange.svg)](#-clean--hexagonal-architecture)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

PulseFlow is a mission-critical, enterprise-grade webhook and event reliability SaaS platform. It ingests, verifies, queues, retries with exponential backoff, and guarantees zero-loss delivery of webhooks to downstream endpoints, complete with real-time SSE live-tail observability, Dead-Letter Queue (DLQ) manual/bulk replay, and AI-assisted payload and failure triage.

---

## 🏛 Master Project Phase Tracking

PulseFlow is engineered across two decoupled squads: **Backend Squad** and **Frontend Squad**. Each phase delivers tested, self-contained, enterprise-grade functionality.

### ⚙️ Backend Squad Roadmap

| Phase | Title | Scope & Key Deliverables | Status |
|---|---|---|---|
| **Phase B0** | **Foundation & Architecture Scaffold** | Clean Architecture scaffold (`domain`, `application`, `infrastructure`, `shared`), Pino structured logger with AsyncLocalStorage trace correlation, strict ESLint/Prettier/Husky configs, and local Docker Compose stack (Postgres 16, Mongo 7, Redis 7). | ✅ Completed |
| **Phase B1** | **Multi-Tenant Schema & Auth Engine** | Multi-tenant PostgreSQL schema (Prisma/Drizzle), tenant isolation, JWT authentication with Redis token blocklist, RBAC middleware, and shared Zod request validation. | 📋 Planned |
| **Phase B2** | **High-Throughput Ingestion API** | High-throughput ingestion API (`POST /api/v1/events/ingest`), Redis idempotency guard (`SETNX`), cryptographic HMAC signature verification, and BullMQ producer queue. | 📋 Planned |
| **Phase B3** | **Reliable Delivery Worker & DLQ** | Standalone delivery worker, exponential backoff with jitter, circuit breaker pattern, Dead-Letter Queue (DLQ), and immutable MongoDB audit logging. | 📋 Planned |
| **Phase B4** | **Query, Analytics & Live-Tail SSE** | Query and analytics APIs, real-time Server-Sent Events (`/api/v1/events/live-tail`) via Redis Pub/Sub, and an LLM-assisted failure triage endpoint. | 📋 Planned |
| **Phase B5** | **Production Hardening & CI/CD** | Deep health checks (`/health/liveness`, `/health/readiness`), graceful shutdown handlers (`SIGTERM`/`SIGINT`), multi-stage Dockerfile, and GitHub Actions CI/CD workflows. | 📋 Planned |

### 🖥️ Frontend Squad Roadmap

| Phase | Title | Scope & Key Deliverables | Status |
|---|---|---|---|
| **Phase F0** | **Foundation & Design System Scaffold** | Next.js 15 App Router scaffold, shadcn/ui component integration, shared Zod contract setup, and TanStack Query provider with global API error envelope handling. | 📋 Planned |
| **Phase F1** | **Authentication & App Shell** | Auth views (Login/Register), tenant switcher, route guard middleware, responsive dashboard layout shell, and Suspense skeletons. | 📋 Planned |
| **Phase F2** | **Endpoint Management CRUD** | Endpoint registration and management CRUD, dynamic form validation (`react-hook-form` + Zod), and optimistic status toggling. | 📋 Planned |
| **Phase F3** | **Observability & Live-Tail Stream** | Paginated delivery logs table, real-time SSE live-tail stream (pause/resume), and virtualized payload viewer (`@tanstack/react-virtual`). | 📋 Planned |
| **Phase F4** | **DLQ Management & AI Diagnostics** | Dead-Letter Queue (DLQ) operations, single/bulk manual replay triggers, and an AI root-cause diagnostics slide-out drawer. | 📋 Planned |
| **Phase F5** | **Performance & Accessibility Audit** | Core Web Vitals optimization (LCP/CLS layout locks, INP input debouncing with `useTransition`), WCAG 2.1 AA accessibility audit, and production build. | 📋 Planned |

---

## 📂 Decoupled Monorepo Architecture

The repository enforces a decoupled layout where the backend (Node.js/Express/TypeScript) and frontend (Next.js 15 App Router) operate with independent dependency trees, isolated build scripts, and dedicated runtime environments.

```text
PULSEFLOW/
├── .git/
├── .gitignore                # Root gitignore ignoring node_modules, .env, dist, etc.
├── docker-compose.yml        # Local orchestration: PostgreSQL 16, MongoDB 7, Redis 7
├── README.md                 # Master project architecture, phase tracking, and setup guide
├── backend/                  # Dedicated backend directory (Phases B0 - B5)
│   ├── package.json          # Node.js backend dependencies only
│   ├── tsconfig.json         # Base TypeScript configuration
│   ├── tsconfig.build.json   # Build-specific TypeScript configuration
│   ├── .env.example          # Backend environment template
│   ├── .dockerignore         # Docker context exclusions
│   ├── Dockerfile            # Multi-stage production container build
│   ├── vitest.config.ts      # Unit & integration test configuration
│   ├── src/                  # Clean / Hexagonal Architecture layers
│   │   ├── domain/           # Entities, value objects, ports, domain exceptions
│   │   ├── application/      # Use cases, DTOs, orchestrators
│   │   ├── infrastructure/   # Database clients (Postgres, Mongo, Redis), HTTP server
│   │   ├── shared/           # API response envelopes, utilities, constants
│   │   └── index.ts          # Application entrypoint
│   └── tests/                # Test suites (envelope, domain, health, trace)
└── frontend/                 # Reserved for Next.js 15 App Router (Phases F0 - F5)
    └── README.md             # Phase F0 requirements, design system, and API contract specs
```

---

## 🏛 Clean / Hexagonal Architecture (Backend)

The backend strictly separates business rules from external adapters:

```
backend/src/
├── domain/               # Enterprise business rules (Entities, Value Objects, Domain Errors, Ports)
│   ├── entities/         # Core models: WebhookEvent, Endpoint, AuditLog
│   ├── errors/           # Domain exceptions: ValidationError, EntityNotFoundError, ConflictError
│   └── repositories/     # Inversion of Control interfaces: IEventRepository, IEndpointRepository, ICacheService
├── application/          # Application orchestration layer & use cases
│   ├── use-cases/        # Workflows: GetHealthUseCase, IngestEventUseCase
│   └── dtos/             # Input/Output DTOs with Zod validation schemas
├── infrastructure/       # Frameworks, drivers, database clients, HTTP server
│   ├── database/
│   │   ├── postgres/     # PostgreSQL 16 connection pool & health check
│   │   ├── mongo/        # MongoDB 7 MongoClient & health check
│   │   └── redis/        # Redis 7 (ioredis) client & health check
│   ├── logging/          # Centralized Pino logger & AsyncLocalStorage correlation context
│   └── http/             # Express app, security hardening, routes, and middleware
└── shared/               # Cross-cutting concerns
    ├── contracts/        # Standardized API response envelopes (Success/Error)
    ├── constants/        # HTTP header tokens and sensitive header redaction lists
    └── utils/            # Async handler, cryptographic helpers (HMAC SHA-256), env validator
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20+ or v22+
- **Docker & Docker Compose** (for PostgreSQL, MongoDB, Redis)
- **Git**

---

### 2. Start Local Infrastructure Stack
From the project root, launch the required databases and cache:

```bash
docker compose up -d
```

| Service | Container Name | Host Port | Credentials / Defaults | Health Check Probe |
|---|---|---|---|---|
| **PostgreSQL 16** | `pulseflow_postgres` | `5432` | `pulseflow_admin` / `pulseflow_secret` (`pulseflow_db`) | `pg_isready -U pulseflow_admin -d pulseflow_db` |
| **MongoDB 7** | `pulseflow_mongo` | `27017` | `pulseflow_admin` / `pulseflow_secret` (`pulseflow_audit`) | `mongosh --eval "db.adminCommand('ping')"` |
| **Redis 7** | `pulseflow_redis` | `6379` | Auth password: `pulseflow_redis_secret` | `redis-cli -a pulseflow_redis_secret ping` |

---

### 3. Backend Setup & Execution

Navigate to the `backend/` directory:

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Run development server (with tsx watch & pino-pretty logging)
npm run dev

# 4. Production build & start
npm run build
npm start
```

---

## 🔎 Observability & Trace Correlation

Every request traversing PulseFlow is stamped with a unique `traceId` (extracted from `x-trace-id`, `x-correlation-id`, or auto-generated as a UUID v4):
- **Trace Propagation**: Propagated across all asynchronous calls via Node.js `AsyncLocalStorage`.
- **Log Correlation**: Automatically injected into every Pino log record (`{ "traceId": "..." }`).
- **Response Headers**: Returned to callers in `x-trace-id` for end-to-end distributed tracing.
- **Sensitive Redaction**: Critical credentials (`authorization`, `x-api-key`, `cookie`, `proxy-authorization`) are automatically redacted from all log streams.

---

## 📦 Standardized API Envelopes

All API endpoints follow a unified response structure:

### Success Envelope (`2xx`)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "status": "alive"
  },
  "meta": {
    "traceId": "c4b8e219-5d46-4cb0-9e59-a56763a8a31a",
    "timestamp": "2026-09-27T11:53:45.000Z"
  }
}
```

### Error Envelope (`4xx`, `5xx`)
```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "targetUrl",
        "message": "Must be a valid URL (http or https)"
      }
    ]
  },
  "meta": {
    "traceId": "c4b8e219-5d46-4cb0-9e59-a56763a8a31a",
    "timestamp": "2026-09-27T11:53:45.000Z"
  }
}
```

---

## 🧪 Testing & Quality Gates

Run all quality checks directly from `backend/`:

```bash
# Run unit & integration test suites (Vitest)
npm test

# Type checking (TypeScript strict mode)
npm run typecheck

# Code style & linting (ESLint)
npm run lint
npm run lint:fix

# Formatting (Prettier)
npm run format
npm run format:check
```

---

## 📄 License & Contributing
Private & Proprietary. All rights reserved by PulseFlow Architecture Team.
