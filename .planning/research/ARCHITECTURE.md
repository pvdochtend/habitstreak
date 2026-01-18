# Architecture Research

**Domain:** Next.js Docker Deployment Architecture
**Researched:** 2026-01-18
**Confidence:** HIGH

## Summary

This research covers containerization patterns for Next.js 15 applications with Prisma ORM and PostgreSQL, targeting self-hosted deployment on Synology NAS with Container Manager.

**Primary recommendation:** Use a 4-stage multi-stage Dockerfile with `output: "standalone"` configuration, run Prisma migrations at container startup (not build time), and use named Docker volumes for PostgreSQL data persistence.

## Container Architecture

### System Overview

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|   habitstreak    |---->|    postgres      |     |  postgres_data   |
|   (Next.js App)  |     |   (PostgreSQL)   |<----|    (Volume)      |
|                  |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
        |                        ^
        |                        |
        v                        |
+------------------+             |
|                  |             |
|  Startup Script  |-------------+
|  (migrations)    |
|                  |
+------------------+

Network: habitstreak-network (bridge)

Data Flow:
1. postgres container starts, healthcheck passes
2. habitstreak container starts (depends_on: postgres healthy)
3. Startup script runs: prisma migrate deploy
4. Next.js server starts on port 3000
```

### Multi-stage Dockerfile Pattern

The recommended pattern uses **4 stages** to minimize final image size from ~1.2GB to ~300-450MB.

#### Stage 1: Base (shared Alpine image)

```dockerfile
# syntax=docker.io/docker/dockerfile:1

FROM node:22-alpine AS base
# Alpine is minimal (~5MB base), requires libc6-compat for some npm packages
```

**Why node:22-alpine:**
- Smallest official Node.js image (~50MB vs ~350MB for full)
- Node 22 is current LTS with best performance
- Alpine uses musl libc - add `libc6-compat` for compatibility

#### Stage 2: Dependencies (install node_modules)

```dockerfile
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy only package files first (better layer caching)
COPY package.json package-lock.json ./

# Use npm ci for reproducible builds (respects lockfile exactly)
RUN npm ci
```

**Why separate deps stage:**
- Dependencies change less often than source code
- Docker caches this layer, skipping reinstall on code changes
- `npm ci` is faster and more reliable than `npm install`

#### Stage 3: Builder (compile Next.js)

```dockerfile
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client (needed at build time)
RUN npx prisma generate

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js in standalone mode
RUN npm run build
```

**Critical:** `prisma generate` MUST run before `npm run build` because:
- Next.js imports Prisma Client during build
- Build fails if `@prisma/client` is not generated
- Generated client is architecture-specific (must match final image)

#### Stage 4: Runner (production image)

```dockerfile
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user (security best practice)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone build (includes server.js and minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

**Key decisions:**
- Non-root user prevents container escape attacks
- `--chown` sets ownership during copy (faster than separate chmod)
- Standalone output excludes dev dependencies (~75% smaller)
- CMD runs migrations before server start

### next.config.js Configuration

**Required change for Docker deployment:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config ...

  // REQUIRED: Enable standalone output for Docker
  output: 'standalone',
}

module.exports = nextConfig
```

**What standalone does:**
- Creates `.next/standalone` folder with minimal server
- Copies only required `node_modules` (~30-60% smaller)
- Includes `server.js` that can run without full `node_modules`

### docker-compose Service Architecture

```yaml
services:
  # ============================================
  # PostgreSQL Database
  # ============================================
  postgres:
    image: postgres:16-alpine
    container_name: habitstreak-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-habitstreak}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-habitstreak}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-habitstreak} -d ${POSTGRES_DB:-habitstreak}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - habitstreak-network

  # ============================================
  # Next.js Application
  # ============================================
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: habitstreak-app
    restart: unless-stopped
    ports:
      - "${APP_PORT:-3000}:3000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-habitstreak}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-habitstreak}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
    networks:
      - habitstreak-network

# ============================================
# Persistent Volumes
# ============================================
volumes:
  postgres_data:
    name: habitstreak-postgres-data

# ============================================
# Network
# ============================================
networks:
  habitstreak-network:
    name: habitstreak-network
    driver: bridge
```

**Key patterns:**
- `depends_on: condition: service_healthy` - App waits for DB healthcheck
- `postgres_data` named volume - Persists across container recreates
- Internal DNS: App connects to `postgres:5432` (service name)
- Health checks enable orchestrator awareness

## Data Flow

### Prisma Migration Strategy

**Recommended: Run migrations at container startup**

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

**Why NOT at build time:**
1. Build environment lacks DATABASE_URL (no DB connection)
2. Time gap between build and deploy leaves DB/app out of sync
3. CI/CD would need production DB access (security risk)

**Why at startup:**
1. Database is guaranteed available (depends_on healthy)
2. Migrations apply immediately before app serves requests
3. Single source of truth - migrations bundled in image

**Alternative for scaled deployments:**

For horizontally scaled apps (multiple replicas), migrations at startup can cause race conditions. Instead:

```yaml
services:
  # Run once before app containers start
  migrate:
    build:
      context: .
      dockerfile: Dockerfile
    command: ["npx", "prisma", "migrate", "deploy"]
    environment:
      DATABASE_URL: postgresql://...
    depends_on:
      postgres:
        condition: service_healthy
    restart: "no"  # Run once and exit

  app:
    # ... same as before ...
    depends_on:
      migrate:
        condition: service_completed_successfully
```

**For HabitStreak (single instance), startup migration is fine.**

### Volume Persistence

PostgreSQL data volume configuration:

```yaml
volumes:
  postgres_data:
    name: habitstreak-postgres-data
    # Default driver stores in /var/lib/docker/volumes/ on host
```

**Synology NAS specifics:**
- Use `/volume1/docker/habitstreak/postgres` for host bind mount if preferred
- Named volumes managed by Container Manager are safer
- Volume survives container stop/remove/recreate

**Backup strategy (optional future enhancement):**

```yaml
services:
  backup:
    image: prodrigestivill/postgres-backup-local
    restart: unless-stopped
    volumes:
      - /volume1/docker/backups/habitstreak:/backups
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_DB: habitstreak
      POSTGRES_USER: habitstreak
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      SCHEDULE: "@daily"
      BACKUP_KEEP_DAYS: 7
      BACKUP_KEEP_WEEKS: 4
    depends_on:
      - postgres
    networks:
      - habitstreak-network
```

### Environment Configuration

**Environment variable categories:**

| Variable | Build Time | Runtime | Notes |
|----------|------------|---------|-------|
| `DATABASE_URL` | No | Yes | Must be available at container start |
| `NEXTAUTH_URL` | No | Yes | Can differ per deployment |
| `NEXTAUTH_SECRET` | No | Yes | Secret, never bake in |
| `NEXT_PUBLIC_*` | Yes | No | Bundled into client JS at build |

**How to handle:**

1. **Runtime variables (server-side):** Pass via docker-compose environment or `.env` file
2. **Build-time variables (NEXT_PUBLIC_*):** Use ARG in Dockerfile if needed

```dockerfile
# If you have NEXT_PUBLIC_ vars that differ per environment:
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build with:
# docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com .
```

**HabitStreak has no NEXT_PUBLIC_ variables, so this is not needed.**

**.env file for docker-compose:**

```env
# .env.production (do not commit to git)
POSTGRES_USER=habitstreak
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=habitstreak

NEXTAUTH_URL=https://habitstreak.yourdomain.com
NEXTAUTH_SECRET=your-32-character-secret-here

APP_PORT=3000
```

### Health Check Patterns

**Application health endpoint (create this):**

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    )
  }
}
```

**Why include DB check:**
- Process running does not mean app is functional
- Health endpoint should verify critical dependencies
- Enables orchestrator to restart unhealthy containers

## Build Order

1. **Create next.config.js change** - Add `output: 'standalone'`
2. **Create health endpoint** - `/api/health` route for healthcheck
3. **Create .dockerignore** - Exclude unnecessary files from build context
4. **Create Dockerfile** - Multi-stage build as documented
5. **Create docker-compose.yml** - Service definitions with healthchecks
6. **Create .env.production.example** - Template for required env vars
7. **Test locally** - `docker-compose up --build`
8. **Deploy to Synology** - Upload compose files, configure Container Manager

**.dockerignore (essential for fast builds):**

```
.git
.gitignore
.next
node_modules
*.md
.env*
.planning
tests
playwright-report
playwright.config.ts
vitest.config.ts
docker-compose*.yml
Dockerfile*
```

## Anti-Patterns

### Anti-Pattern 1: Running migrations at build time

**What people do:**
```dockerfile
RUN npx prisma migrate deploy  # In builder stage
```

**Why it fails:**
- No DATABASE_URL at build time (or requires exposing prod DB to CI)
- Migration happens before container starts, creating version mismatch window
- Build artifacts contain migration state assumptions

**Do this instead:**
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

### Anti-Pattern 2: Using full node image instead of Alpine

**What people do:**
```dockerfile
FROM node:22  # ~350MB base image
```

**Why it's bad:**
- Final image 3-4x larger than necessary
- Slower to pull, more storage on NAS
- Larger attack surface

**Do this instead:**
```dockerfile
FROM node:22-alpine  # ~50MB base image
RUN apk add --no-cache libc6-compat  # Add compatibility if needed
```

### Anti-Pattern 3: Not using standalone output

**What people do:**
```dockerfile
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules  # ALL of them
```

**Why it's bad:**
- Copies all dependencies including devDependencies
- Image 500MB+ instead of 150-200MB
- Slower cold starts

**Do this instead:**
```javascript
// next.config.js
module.exports = { output: 'standalone' }
```
```dockerfile
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
```

### Anti-Pattern 4: Running as root

**What people do:**
```dockerfile
# No USER directive = runs as root
CMD ["node", "server.js"]
```

**Why it's bad:**
- Container escape vulnerability gives attacker root
- Violates principle of least privilege

**Do this instead:**
```dockerfile
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
```

### Anti-Pattern 5: Missing healthcheck

**What people do:**
```yaml
services:
  app:
    # No healthcheck defined
    depends_on:
      - postgres  # Just waits for container to exist, not be ready
```

**Why it's bad:**
- App starts before DB is accepting connections
- Orchestrator cannot detect app failures
- No automatic recovery

**Do this instead:**
```yaml
services:
  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U habitstreak"]
      interval: 10s
      timeout: 5s
      retries: 5
  app:
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

### Anti-Pattern 6: Forgetting Prisma files in final image

**What people do:**
```dockerfile
# Only copy standalone output
COPY --from=builder /app/.next/standalone ./
# Forgot prisma directory!
```

**Why it fails:**
- `prisma migrate deploy` cannot find migration files
- Container crashes at startup

**Do this instead:**
```dockerfile
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
```

## Synology NAS Specifics

### Container Manager (DSM 7.2+)

**Deployment via GUI:**
1. Open Container Manager > Project
2. Create new project: "habitstreak"
3. Set path: `/volume1/docker/habitstreak`
4. Upload `docker-compose.yml`
5. Create `.env` file in same directory with secrets
6. Build and start

**Deployment via SSH:**
```bash
cd /volume1/docker/habitstreak
sudo docker compose up -d --build
```

**Important Synology paths:**
- Use `/volume1/...` not relative paths in compose files
- Named volumes go to `/volume1/@docker/volumes/`

### Port Configuration

If running multiple services, configure unique ports:

```yaml
ports:
  - "3001:3000"  # Map to different external port
```

Or use Synology reverse proxy for subdomain routing.

## Sources

### Primary (HIGH confidence)
- [Next.js Official Deployment Docs](https://nextjs.org/docs/app/getting-started/deploying) - Docker support confirmation
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/docker) - Migration strategy, compose examples
- [Next.js Docker Example (GitHub)](https://github.com/vercel/next.js/tree/canary/examples/with-docker) - Official standalone Dockerfile
- [Prisma Development and Production Workflows](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production) - migrate deploy vs migrate dev

### Secondary (MEDIUM confidence)
- [DEV.to: Multi-Stage Approach](https://dev.to/simplr_sh/hosting-your-nextjs-app-with-docker-a-multi-stage-approach-52ne) - Complete 4-stage Dockerfile
- [DEV.to: Dockerize Next.js 2025](https://dev.to/codeparrot/nextjs-deployment-with-docker-complete-guide-for-2025-3oe8) - Current best practices
- [notiz.dev: Prisma Migrate Deploy](https://notiz.dev/blog/prisma-migrate-deploy-with-docker/) - Startup migration pattern
- [Medium: Docker Healthchecks](https://patrickleet.medium.com/effective-docker-healthchecks-for-node-js-b11577c3e595) - Health endpoint patterns
- [Synology Knowledge Center: Container Manager](https://kb.synology.com/en-sg/DSM/help/ContainerManager/docker_project?version=7) - Project deployment

### Tertiary (LOW confidence - cross-verified)
- [TheLinuxCode: Next.js Docker Images 2026](https://thelinuxcode.com/nextjs-docker-images-how-i-build-predictable-fast-deployments-in-2026/) - Image size benchmarks
- [WunderTech: Container Manager Guide](https://www.wundertech.net/container-manager-on-a-synology-nas/) - Synology-specific workflows

## Metadata

**Confidence breakdown:**
- Multi-stage Dockerfile: HIGH - Official Next.js example + multiple verified sources
- Prisma migration: HIGH - Official Prisma docs explicit about deploy vs dev
- Volume persistence: HIGH - Standard Docker pattern, widely documented
- Health checks: MEDIUM - Patterns vary, synthesized from multiple sources
- Synology specifics: MEDIUM - Community guides, not official Synology docs

**Research date:** 2026-01-18
**Valid until:** 2026-04-18 (3 months - Docker patterns stable)

## Implementation Checklist

- [ ] Add `output: 'standalone'` to next.config.js
- [ ] Create `/api/health` endpoint
- [ ] Create `.dockerignore` file
- [ ] Create multi-stage `Dockerfile`
- [ ] Create `docker-compose.yml` with services
- [ ] Create `.env.production.example` template
- [ ] Test build: `docker-compose build`
- [ ] Test run: `docker-compose up`
- [ ] Verify health endpoints work
- [ ] Deploy to Synology NAS
