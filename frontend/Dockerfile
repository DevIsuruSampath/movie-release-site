# Multi-stage build for optimized production image
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json ./

# Copy package-lock.json if it exists
COPY package-lock.json* ./

# Install dependencies with legacy peer deps to avoid peer dependency errors
RUN if [ -f package-lock.json ]; then \
    npm ci --legacy-peer-deps; \
    else \
    npm install --legacy-peer-deps; \
    fi

# ---------- Builder ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------- Runner ----------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create non-root user
RUN addgroup -S nextjs && adduser -S -G nextjs -u 1001 nextjs

# Copy only needed production files
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# These require 'standalone' output in next.config.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node --eval "require('http').get('http://localhost:3000', (res) => { if (res.statusCode !== 200) throw new Error('Health check failed') }).then(() => process.exit(0)).catch(() => process.exit(1))" || exit 1

# Start Next.js production server
CMD ["node", "server.js"]
