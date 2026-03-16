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
ENV PORT=3000

# Create non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy all needed files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js

USER nextjs

EXPOSE 3000

# Start Next.js production server binding to all interfaces
CMD ["node", "server.js"]
