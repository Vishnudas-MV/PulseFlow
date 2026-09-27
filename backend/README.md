# PulseFlow - Enterprise API & Webhook Reliability SaaS Platform

PulseFlow is a mission-critical, event-driven platform designed to ingest, verify, queue, retry, and deliver external webhooks/events to downstream endpoints with an observability portal, synthetic canary pings, and AI-assisted payload transformation.

---

## 🏛 Clean / Hexagonal Architecture

PulseFlow strictly enforces Clean / Hexagonal Architecture principles to decouple core domain logic from external frameworks, databases, and network adapters:

```
src/
├── domain/               # Enterprise business rules (Entities, Value Objects, Domain Errors, Ports)
│   ├── entities/         # Core models (WebhookEvent, Endpoint, AuditLog)
│   ├── errors/           # Typed domain exceptions (ValidationError, EntityNotFoundError, ConflictError, etc.)
│   └── repositories/     # Inversion of Control interfaces (IEventRepository, IEndpointRepository, ICacheService)
├── application/          # Orchestration layer, use cases, and DTOs
│   ├── use-cases/        # Business workflows (GetHealthUseCase, IngestEventUseCase)
│   └── dtos/             # Input/Output DTOs with Zod validation schemas
├── infrastructure/       # Frameworks, drivers, database clients, HTTP server
│   ├── database/
│   │   ├── postgres/     # PostgreSQL 16 connection pool client & health check
│   │   ├── mongo/        # MongoDB 7 MongoClient connection manager & health check
│   │   └── redis/        # Redis 7 (ioredis) client implementing ICacheService
│   ├── logging/          # Centralized Pino logger & AsyncLocalStorage correlation context
│   └── http/             # Express app, routes, security hardening, and middleware
└── shared/               # Cross-cutting concerns
    ├── contracts/        # Standardized API response envelopes (Success/Error) and Http/Error codes
    ├── constants/        # HTTP header tokens and sensitive header redaction lists
    └── utils/            # Async handler, cryptographic helpers (HMAC SHA-256), env validator
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20+ or v24+
- **Docker & Docker Compose** (for PostgreSQL, MongoDB, Redis)
- **Git**

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create `.env` based on `.env.example`:
```bash
cp .env.example .env
```

### 4. Start Infrastructure Containers (Docker Compose)
Spins up PostgreSQL 16, MongoDB 7, and Redis 7 with healthchecks and persistent volumes:
```bash
docker compose up -d
```

| Service | Container Name | Port | Health Check |
|---|---|---|---|
| PostgreSQL 16 | `pulseflow_postgres` | `5432` | `pg_isready -U pulseflow_admin -d pulseflow_db` |
| MongoDB 7 | `pulseflow_mongo` | `27017` | `mongosh --eval "db.adminCommand('ping')"` |
| Redis 7 | `pulseflow_redis` | `6379` | `redis-cli -a pulseflow_redis_secret ping` |

### 5. Run the Server
```bash
# Development (with hot reloading & pino-pretty)
npm run dev

# Production Build
npm run build
npm start
```

---

## 🔎 Observability & Correlation Tracing

Every incoming HTTP request is assigned a `traceId` (extracted from `x-trace-id`, `x-correlation-id`, or auto-generated as a UUID v4):
- Propagated to downstream async operations via Node.js `AsyncLocalStorage`.
- Bound to every log entry produced by Pino via an automated mixin (`{ traceId: "..." }`).
- Returned in the response header: `x-trace-id: <uuid>`.
- Sensitive headers (`authorization`, `x-api-key`, `cookie`, `proxy-authorization`) are automatically redacted from logs.

---

## 📦 Standardized API Envelopes

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

```bash
# Run unit & integration test suites
npm test

# Type checking (TypeScript strict mode)
npm run typecheck

# Linting with ESLint
npm run lint
npm run lint:fix

# Formatting with Prettier
npm run format
npm run format:check
```

Git commits are guarded by **Husky** and **lint-staged**, verifying code formatting and TypeScript types before commits are accepted.
