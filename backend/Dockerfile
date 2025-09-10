# Multi-stage build for production optimization
FROM node:20-alpine AS builder

# Install security updates
RUN apk update && apk upgrade

# Set working directory
WORKDIR /app

# Copy package files for better Docker layer caching
COPY package*.json ./

# Install all dependencies (including dev) for building
RUN npm ci --include=dev

# Copy source code
COPY . .

# Run production build steps (linting, testing)
RUN npm run lint && npm run test:ci

# Production stage
FROM node:20-alpine AS production

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init tini && \
    rm -rf /var/cache/apk/*

# Create non-root user with proper groups
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sudoq -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application files from builder
COPY --from=builder --chown=sudoq:nodejs /app .

# Remove development files and create necessary directories
RUN rm -rf tests/ coverage/ .nyc_output/ && \
    mkdir -p logs uploads temp && \
    chown -R sudoq:nodejs /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV NPM_CONFIG_LOGLEVEL=warn

# Expose port
EXPOSE 5000

# Switch to non-root user
USER sudoq

# Health check with improved error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "const http = require('http'); const req = http.request({ host: 'localhost', port: process.env.PORT || 5000, path: '/health', timeout: 8000 }, (res) => { let data = ''; res.on('data', (chunk) => data += chunk); res.on('end', () => { try { const health = JSON.parse(data); process.exit(health.status === 'healthy' || health.status === 'warning' ? 0 : 1); } catch (e) { process.exit(res.statusCode === 200 ? 0 : 1); } }); }); req.on('error', () => process.exit(1)); req.on('timeout', () => { req.destroy(); process.exit(1); }); req.end();"

# Start the application with proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# Labels for better maintainability and governance
LABEL version="1.0.0" \
      description="SudoQMaestro Backend API - AI-Powered Sudoku Solver" \
      maintainer="SudoQMaestro Team" \
      org.opencontainers.image.title="sudoqmaestro-backend" \
      org.opencontainers.image.description="Backend API for SudoQMaestro application" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.created="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
      org.opencontainers.image.source="https://github.com/APorkolab/SudoQMaestro"
