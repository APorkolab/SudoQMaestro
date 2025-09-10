# Multi-stage build for production
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S sudoq -u 1001

# Set working directory
WORKDIR /app

# Copy application files
COPY --chown=sudoq:nodejs . .

# Copy production dependencies from builder stage
COPY --from=builder --chown=sudoq:nodejs /app/node_modules ./node_modules

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Switch to non-root user
USER sudoq

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
