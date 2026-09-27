# PulseFlow Frontend - Webhook Reliability & Observability Portal

Welcome to the frontend application for **PulseFlow** — an enterprise-grade API & Webhook Reliability SaaS platform.

This directory is dedicated exclusively to the Next.js 15 client dashboard and management portal. It is decoupled from the backend service to allow independent dependency management, CI/CD pipelines, and zero build-script collisions.

---

## 🧭 Master Project Phases: Frontend Squad Roadmap

| Phase | Title | Scope & Deliverables | Status |
|---|---|---|---|
| **Phase F0** | **Foundation & Design System Scaffold** | Next.js 15 App Router scaffold, shadcn/ui integration, shared Zod contracts, TanStack Query provider with global API error envelopes. | 📋 Planned |
| **Phase F1** | **Authentication & App Shell** | Auth views (Login/Register), multi-tenant switcher, edge middleware route guards, responsive layout shell, and Suspense skeletons. | 📋 Planned |
| **Phase F2** | **Endpoint Management CRUD** | Webhook endpoint registration, secret generation/rotation, dynamic form validation (react-hook-form + Zod), and optimistic status toggling. | 📋 Planned |
| **Phase F3** | **Observability & Live-Tail Stream** | Paginated delivery logs table, real-time Server-Sent Events (SSE) live-tail stream with pause/resume, and virtualized payload viewer (`@tanstack/react-virtual`). | 📋 Planned |
| **Phase F4** | **DLQ Management & AI Diagnostics** | Dead-Letter Queue (DLQ) operations, single/bulk manual replay triggers, and an AI-assisted root-cause diagnostic slide-out drawer. | 📋 Planned |
| **Phase F5** | **Performance & Production Hardening** | Core Web Vitals optimization (LCP/CLS layout locks, INP input debouncing with `useTransition`), WCAG 2.1 AA accessibility audit, and production Docker build. | 📋 Planned |

---

## 🎯 Phase F0: Foundation & Scaffold Requirements

Phase F0 establishes the baseline architecture for the frontend squad before feature implementation begins.

### 1. Technology Stack Specification
- **Framework**: Next.js 15 (App Router, Server Components + Client Components)
- **Language / Runtime**: TypeScript 5+ (Strict Mode)
- **Styling**: Tailwind CSS with CSS Variables for theming (light/dark mode)
- **Component Primitives**: [shadcn/ui](https://ui.shadcn.com/) (built on Radix UI)
- **Client Cache & Data Fetching**: TanStack Query v5 (`@tanstack/react-query`)
- **Schema & Contract Validation**: Zod (`zod`)
- **Forms**: `react-hook-form` + `@hookform/resolvers/zod`
- **Icons**: `lucide-react`
- **HTTP Client**: Native `fetch` with a typed API client interceptor

---

### 2. Standardized API Envelope Contract Alignment

All communication with the backend (`pulseflow-backend`) must honor the backend's strict API envelope contracts:

#### Success Envelope (`2xx`)
```typescript
export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  meta: {
    traceId: string;
    timestamp: string;
  };
}
```

#### Error Envelope (`4xx`, `5xx`)
```typescript
export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  meta: {
    traceId: string;
    timestamp: string;
  };
}
```

---

### 3. TanStack Query & Global Error Handling Architecture

The frontend client must wrap requests in a unified fetch client that:
1. Automatically includes correlation headers (`x-correlation-id`, `x-tenant-id`).
2. Extracts and logs `x-trace-id` on responses.
3. Automatically unwraps `data` from `ApiSuccessResponse<T>`.
4. Transforms non-2xx responses into typed `PulseFlowApiError` instances containing the error code and trace ID.
5. Emits global toast notifications via shadcn/ui toast when critical 5xx errors occur.

---

### 4. Target Directory Structure for Phase F0 Scaffold

```text
frontend/
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json              # shadcn/ui configuration
├── .env.example
├── public/                      # Static assets & brand graphics
└── src/
    ├── app/                     # Next.js 15 App Router
    │   ├── (auth)/              # Route group: /login, /register
    │   │   ├── login/
    │   │   └── register/
    │   ├── (dashboard)/         # Route group: /endpoints, /deliveries, /dlq
    │   │   ├── endpoints/
    │   │   ├── deliveries/
    │   │   ├── dlq/
    │   │   └── layout.tsx       # Sidebar, Topbar, Tenant Selector
    │   ├── api/                 # Next.js BFF routes (if needed)
    │   ├── layout.tsx           # Root HTML layout & providers
    │   └── page.tsx             # Landing / redirect
    ├── components/
    │   ├── ui/                  # Raw shadcn/ui atomic components
    │   ├── forms/               # Reusable form components
    │   ├── layout/              # Header, Sidebar, Navigation
    │   └── common/              # TraceBadge, StatusIndicator, JsonViewer
    ├── contracts/               # Shared Zod schemas matching backend DTOs
    ├── hooks/                   # Custom React hooks (useSSE, useDebounce, etc.)
    ├── lib/
    │   ├── api-client.ts        # Typed fetch client with trace correlation
    │   ├── query-client.ts      # TanStack Query configuration & retry defaults
    │   └── utils.ts             # Tailwind cn() helper & string formatters
    └── types/                   # Global TypeScript definitions
```

---

### 5. Environment Variables (`.env.example`)

When scaffolding Phase F0, create a `.env.example` file with the following variables:

```bash
# PulseFlow Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Real-time SSE Live-Tail Stream Endpoint
NEXT_PUBLIC_SSE_URL=http://localhost:4000/api/v1/events/live-tail

# Application Environment
NEXT_PUBLIC_ENV=development
```

---

## ⚡ Execution Instructions for Phase F0
When executing Phase F0:
1. Initialize Next.js 15:
   ```bash
   npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   ```
2. Initialize shadcn/ui:
   ```bash
   npx shadcn@latest init
   ```
3. Install core dependencies:
   ```bash
   npm install @tanstack/react-query @tanstack/react-virtual zod react-hook-form @hookform/resolvers lucide-react clsx tailwind-merge
   ```
