# EMR Application Dockerfile
# Multi-stage build for production optimization

# Build Stage - Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

# Copy frontend package files
COPY client/package*.json ./
RUN npm ci --only=production

# Copy frontend source
COPY client/ ./

# Build frontend
RUN npm run build

# Production Stage - Backend
FROM node:20-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production

# Copy Prisma files
COPY prisma/ ./prisma/
COPY server/lib/prisma.js ./server/lib/

# Generate Prisma client
RUN npx prisma generate

# Copy backend source
COPY server/ ./server/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/client/dist ./client/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S emr -u 1001

# Change ownership
RUN chown -R emr:nodejs /app
USER emr

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

# Expose port
EXPOSE 4000

# Start application
CMD ["npm", "start"]
