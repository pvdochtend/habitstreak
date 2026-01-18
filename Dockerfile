# ============================================
# Stage 1: Base image
# ============================================
FROM node:22-alpine AS base

WORKDIR /app

# ============================================
# Stage 2: Install production dependencies
# ============================================
FROM base AS deps

# Install libc6-compat and openssl for Alpine Linux compatibility with Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# ============================================
# Stage 3: Build application
# ============================================
FROM base AS builder

# Install libc6-compat and openssl for Prisma in builder stage
RUN apk add --no-cache libc6-compat openssl

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy all source files
COPY . .

# Set dummy DATABASE_URL for build (Prisma needs it to parse schema)
# Real DATABASE_URL will be provided at runtime
ENV DATABASE_URL="postgresql://localhost/temp"

# Build Next.js application
RUN npm run build

# ============================================
# Stage 4: Production runner
# ============================================
FROM base AS runner

# Install runtime dependencies for Prisma
RUN apk add --no-cache libc6-compat openssl

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone output (contains only necessary files including minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma directory for migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy Prisma client from deps stage (standalone doesn't include Prisma for migrations)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Set server configuration
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Run migrations and start server
# Note: Migrations run as nextjs user, ensure database permissions allow this
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
