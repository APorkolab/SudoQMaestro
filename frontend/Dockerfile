# Multi-stage build for Angular application
FROM node:24-alpine AS builder

# Install security updates
RUN apk update && apk upgrade

# Set working directory
WORKDIR /app

# Copy package files for better caching
COPY package*.json ./

# Install all dependencies
RUN npm ci --include=dev

# Copy source code
COPY . .

# Run linting and tests
RUN npm run lint && npm run test:ci

# Build the application for production
RUN npm run build:prod

# Verify build output
RUN ls -la dist/frontend/browser/

# Production stage with Nginx
FROM nginx:1.25-alpine AS production

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache tzdata && \
    rm -rf /var/cache/apk/*

# Create nginx user with proper permissions
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-app -u 1001 -G nginx-app

# Copy built application from builder stage
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Set proper permissions
RUN chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    chown -R nginx-app:nginx-app /etc/nginx/conf.d

# Create PID directory for nginx
RUN mkdir -p /var/run/nginx && \
    chown -R nginx-app:nginx-app /var/run/nginx

# Switch to non-root user
USER nginx-app

# Health check for the web server
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Set environment variables
ENV TZ=UTC
ENV NGINX_PORT=8080

# Expose port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Labels for better maintainability
LABEL version="1.0.0" \
      description="SudoQMaestro Frontend - Angular Application" \
      maintainer="SudoQMaestro Team" \
      org.opencontainers.image.title="sudoqmaestro-frontend" \
      org.opencontainers.image.description="Frontend Angular application for SudoQMaestro" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.source="https://github.com/APorkolab/SudoQMaestro"
