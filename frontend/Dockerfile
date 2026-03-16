# Multi-stage build for optimized production image
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (use legacy peer deps to avoid strict errors)
RUN npm install --legacy-peer-deps

# ---------- Builder ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Clean build cache to ensure fresh TypeScript compilation
RUN rm -rf .next

RUN npm run build

# ---------- Runner ----------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy only needed production files
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy standalone Next.js build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node --eval "require('http').get('http://localhost:3000', (res) => { if (res.statusCode !== 200) throw new Error('Health check failed') }).then(() => process.exit(0)).catch(() => process.exit(1))" || exit 1

# Start Next.js production server
CMD ["node", "server.js"]
