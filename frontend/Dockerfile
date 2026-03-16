# Multi-stage build for optimized production image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build Next.js application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install addgroup (needed for later commands)
RUN apk add --no-cache shadow

# Create non-root user for security
RUN addgroup --gid 1001 nodejs && \
    adduser -D -h /app -s /bin/sh -G nodejs -u 1001 nodejs && \
    chown -R nodejs:nodejs /app

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/.next /app/.next

# Copy public static files
COPY --from=builder --chown=nodejs:nodejs /app/public /app/public

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node --eval "require('http').get('http://localhost:3000', (res) => { if (res.statusCode !== 200) throw new Error('Health check failed') }).then(() => process.exit(0)).catch(() => process.exit(1))" || exit 1

# Start Next.js production server
CMD ["npm", "start"]
