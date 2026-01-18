# Stack Research

**Domain:** Next.js Docker Deployment (Self-hosting on Synology NAS)
**Researched:** 2026-01-18
**Confidence:** HIGH

## Summary

Docker deployment for Next.js 15 + Prisma + PostgreSQL follows a well-established pattern in 2025/2026: multi-stage builds with standalone output mode, Alpine-based images for small footprint, and docker-compose for service orchestration. The key considerations for Synology NAS are: x86_64 architecture requirement (Intel/AMD CPUs only), Container Manager as the deployment interface, and proper volume mounting for data persistence.

**Primary recommendation:** Use `node:22-alpine` for Next.js with standalone output mode, `postgres:16-alpine` for the database (staying with current version for stability), multi-stage Dockerfile, and docker-compose.yml with health checks.

## Recommended Stack

### Docker Base Images

| Image | Version | Purpose | Why Recommended |
|-------|---------|---------|-----------------|
| `node:22-alpine` | 22.x LTS | Next.js application | Node 22 is Active LTS (Oct 2024+), Alpine ~153MB, 0 CVEs, optimal for Next.js 15 |
| `postgres:16-alpine` | 16.x | PostgreSQL database | Matches existing dev setup, proven stable, ~82MB, full ICU locale support |

**Node.js version rationale:**
- Node 22 entered Active LTS in October 2024, recommended for production
- Prisma 5.x (current) supports Node 18+; Prisma 6/7 requires Node 20+
- Alpine variant is ~82% smaller than full Debian image
- `libc6-compat` package needed for some native modules

**PostgreSQL version rationale:**
- PostgreSQL 16 matches existing docker-compose.yml (consistency)
- PostgreSQL 17 available but 16 is more battle-tested
- Alpine variant significantly smaller than Debian (~90MB vs ~400MB)
- Full ICU locale support since PostgreSQL 15

### docker-compose Configuration

**Production docker-compose.yml pattern:**

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: habitstreak-app
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=postgresql://habitstreak:${POSTGRES_PASSWORD}@db:5432/habitstreak
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - TZ=Europe/Amsterdam
    depends_on:
      db:
        condition: service_healthy
    networks:
      - habitstreak-network

  db:
    image: postgres:16-alpine
    container_name: habitstreak-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: habitstreak
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: habitstreak
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U habitstreak -d habitstreak']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - habitstreak-network

volumes:
  postgres_data:

networks:
  habitstreak-network:
    driver: bridge
```

**Key configuration points:**
1. **Health checks:** PostgreSQL must be healthy before app starts (prevents migration failures)
2. **Named network:** Enables container-to-container communication via service names
3. **Named volume:** `postgres_data` persists database across container recreations
4. **Restart policy:** `unless-stopped` ensures service recovery after NAS reboot
5. **Environment variables:** Passed at runtime (not baked into image)

### Dockerfile (Multi-Stage Build)

**Production Dockerfile pattern:**

```dockerfile
# syntax=docker.io/docker/dockerfile:1

FROM node:22-alpine AS base

# ══════════════════════════════════════════════════════════════
# Dependencies stage - install only production dependencies
# ══════════════════════════════════════════════════════════════
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ══════════════════════════════════════════════════════════════
# Builder stage - build the application
# ══════════════════════════════════════════════════════════════
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ══════════════════════════════════════════════════════════════
# Runner stage - production image
# ══════════════════════════════════════════════════════════════
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for migrations
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

**Critical requirements:**
1. **`output: 'standalone'`** must be added to `next.config.js`
2. **Prisma generate** runs during build (generates client for target platform)
3. **Prisma migrate deploy** runs at container start (not during build)
4. **Non-root user** for security (UID 1001 is conventional)
5. **Static files copied separately** (standalone mode doesn't include them)

### next.config.js Modification

Add standalone output to existing config:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // <-- ADD THIS
  reactStrictMode: true,
  // ... rest of existing config
}
```

### Environment Variables

**Server-side variables (runtime, via docker-compose):**

| Variable | Purpose | Generation |
|----------|---------|------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@db:5432/dbname` |
| `NEXTAUTH_SECRET` | JWT encryption key | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical app URL | `http://nas-ip:3000` or custom domain |
| `TZ` | Timezone | `Europe/Amsterdam` (hardcoded) |

**Production .env file pattern:**

```bash
# .env.production (on NAS, not in repo)
POSTGRES_PASSWORD=<generated-strong-password>
NEXTAUTH_SECRET=<generated-32-byte-secret>
NEXTAUTH_URL=http://192.168.1.x:3000
```

**Security notes:**
- `NEXTAUTH_SECRET` and `POSTGRES_PASSWORD` are server-side only (safe at runtime)
- No `NEXT_PUBLIC_` prefixed variables in this app (no client-side secrets)
- Never commit production secrets to git
- Synology supports Docker environment files via Container Manager UI

### Synology NAS Compatibility

**Architecture Requirements:**
- **Required:** x86_64 (Intel/AMD) CPU
- **Compatible models:** DS918+, DS920+, DS923+, DS1520+, DS1621+, etc. (Plus series)
- **NOT compatible:** ARM-based models (DS220j, DS218, DS118) without workarounds

**Container Manager Setup:**
1. Install "Container Manager" package from Synology Package Center
2. Upload `docker-compose.yml` as a "Project"
3. Configure environment variables in Container Manager UI
4. Mount persistent volume for PostgreSQL data

**Volume Mounting on Synology:**
```yaml
volumes:
  - /volume1/docker/habitstreak/postgres:/var/lib/postgresql/data
```

Or use Docker named volumes (recommended for portability):
```yaml
volumes:
  postgres_data:
```

**Port Considerations:**
- Default port 3000 works on most Synology setups
- If using reverse proxy (Synology's built-in or Traefik), configure accordingly
- Port 5432 for PostgreSQL should NOT be exposed externally (internal network only)

**Memory/Resource Limits:**
For NAS with limited RAM (4-8GB), consider adding resource limits:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
  db:
    deploy:
      resources:
        limits:
          memory: 256M
```

## bcrypt Native Module Handling

The project uses `bcrypt` (native module). Alpine requires build tools for native compilation.

**Option A: Rebuild in deps stage (recommended)**
```dockerfile
FROM base AS deps
RUN apk add --no-cache libc6-compat make gcc g++ python3
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
RUN npm rebuild bcrypt --build-from-source
RUN apk del make gcc g++ python3
```

**Option B: Use pre-built binaries (bcrypt 4.0.1+)**
bcrypt 4.0.1+ includes pre-built musl binaries for Alpine. The current project uses `bcrypt: ^5.1.1`, which should work out of the box, but rebuilding is safer.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `node:22-alpine` | `node:22-slim` (Debian) | If Alpine causes compatibility issues with native modules |
| `postgres:16-alpine` | `postgres:17-alpine` | When 17 becomes more battle-tested (mid-2026) |
| Multi-stage Dockerfile | Single-stage | Only for simpler apps without build step |
| Prisma migrate deploy | Prisma db push | Never in production (no migration history) |
| Named Docker volumes | Bind mounts | If you need direct NAS folder access for backups |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `node:22` (full Debian) | 1GB+ image size, unnecessary packages | `node:22-alpine` (~153MB) |
| `node:20-alpine` | Not Active LTS, Prisma 6/7 requires Node 20.19.0+ | `node:22-alpine` |
| `npm start` / `yarn start` in CMD | Doesn't handle SIGTERM properly, prevents graceful shutdown | `node server.js` |
| `prisma migrate dev` in production | Creates migrations, not for production | `prisma migrate deploy` |
| Baked-in secrets in Dockerfile | Security risk, secrets in image layers | Runtime environment variables |
| Running as root | Security vulnerability | Non-root user (nextjs:nodejs) |
| ARM-based Synology NAS | No official Container Manager support | x86_64 Synology (Plus series) |
| Exposing PostgreSQL port (5432) externally | Security risk | Internal Docker network only |
| `POSTGRES_HOST_AUTH_METHOD=trust` | No password authentication | Always use strong passwords |

## Prisma Migration Strategy

**Development vs Production:**

| Environment | Command | When |
|-------------|---------|------|
| Development | `npx prisma migrate dev` | Creating new migrations locally |
| Production | `npx prisma migrate deploy` | Applying migrations at container start |

**Container startup flow:**
1. Container starts
2. `prisma migrate deploy` applies pending migrations
3. `node server.js` starts Next.js

**Rollback strategy:**
- Prisma doesn't support automatic rollback
- Create a "down" migration manually if needed
- Always backup database before migrations

## Startup Script Alternative

For more control, use a startup script instead of inline CMD:

**docker-entrypoint.sh:**
```bash
#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec node server.js
```

**Dockerfile CMD:**
```dockerfile
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
CMD ["./docker-entrypoint.sh"]
```

## Image Size Expectations

| Stage | Approximate Size |
|-------|------------------|
| Base (node:22-alpine) | ~153MB |
| Final Next.js image | ~200-250MB |
| PostgreSQL (16-alpine) | ~82MB |
| **Total deployment** | ~300-350MB |

Compare to non-optimized: 1GB+ with full Debian images.

## Sources

### Primary (HIGH confidence)
- [Next.js Official Deployment Documentation](https://nextjs.org/docs/app/getting-started/deploying) - Docker support, standalone mode
- [Next.js Official Docker Example](https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile) - Multi-stage Dockerfile pattern
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/docker) - Migration strategy, base image selection
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres/) - Official image tags, health checks

### Secondary (MEDIUM confidence)
- [Marius Hosting - Synology Docker Guides](https://mariushosting.com/synology-best-nas-for-docker/) - Synology NAS compatibility, PUID/PGID
- [Next.js Standalone Mode Medium Article](https://ketan-chavan.medium.com/next-js-15-self-hosting-with-docker-complete-guide-0826e15236da) - Optimization patterns
- [Snyk - Node.js Docker Image Guide](https://snyk.io/blog/choosing-the-best-node-js-docker-image/) - Alpine vs Slim comparison

### Tertiary (LOW confidence - needs validation)
- Community discussions on bcrypt Alpine compatibility
- Synology Container Manager ARM workarounds (not recommended for production)

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Docker base images | HIGH | Official documentation, well-established patterns |
| Multi-stage build pattern | HIGH | Official Next.js example, widely adopted |
| Prisma migration strategy | HIGH | Official Prisma documentation |
| Synology compatibility | MEDIUM | Community sources, not official Synology docs |
| bcrypt on Alpine | MEDIUM | Known issue, multiple workarounds documented |
| Resource limits for NAS | LOW | Depends on specific model and other services |

## Open Questions

1. **Synology reverse proxy integration:** How to configure HTTPS with Synology's built-in reverse proxy or Traefik needs testing on actual hardware.

2. **Backup automation:** Best approach for automated PostgreSQL backups on Synology (pg_dump schedule, Hyper Backup integration) requires hands-on validation.

3. **Update strategy:** How to handle Next.js/Node.js version updates with minimal downtime needs operational procedures.

## Research Date & Validity

**Researched:** 2026-01-18
**Valid until:** ~2026-04-18 (3 months for stable Docker/Node ecosystem)

Node.js and PostgreSQL LTS cycles are predictable. Next.js standalone mode is stable. Re-research needed only if:
- Next.js 16 introduces breaking Docker changes
- Node.js 24 becomes LTS (expected Q4 2026)
- PostgreSQL 18 releases and you want to upgrade
