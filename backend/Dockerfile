# ==============================================================================
# PulseFlow Backend - Production Multi-Stage Dockerfile
# ==============================================================================

# --- Stage 1: Build & Compile TypeScript ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install build essentials if native dependencies require them
RUN apk add --no-cache libc6-compat

# Copy dependency manifests
COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.build.json ./

# Clean install all dependencies (including devDependencies required for tsc)
RUN npm ci

# Copy source code and build configs
COPY src/ ./src/

# Compile TypeScript into production JavaScript in dist/
RUN npm run build

# Remove development dependencies to minimize runtime container footprint
RUN npm prune --omit=dev

# --- Stage 2: Minimal Production Runtime ---
FROM node:22-alpine AS runner

WORKDIR /app

# Add curl for container health check probes
RUN apk add --no-cache curl

ENV NODE_ENV=production \
    PORT=4000 \
    HOST=0.0.0.0

# Create dedicated non-root application user and group
RUN addgroup -S -g 1001 pulseflow && \
    adduser -S -u 1001 -G pulseflow pulseflow

# Copy production runtime dependencies and compiled output from builder
COPY --from=builder --chown=pulseflow:pulseflow /app/node_modules ./node_modules
COPY --from=builder --chown=pulseflow:pulseflow /app/dist ./dist
COPY --from=builder --chown=pulseflow:pulseflow /app/package.json ./package.json

USER pulseflow

EXPOSE 4000

# Container liveness health check
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health/liveness || exit 1

# Execute production server
CMD ["node", "dist/index.js"]
