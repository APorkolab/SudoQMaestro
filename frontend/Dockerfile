# Build stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:prod

# Production stage (static site)
FROM nginx:stable-alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Add basic security headers
RUN sed -i 's/sendfile\s\son;/sendfile off;\n    add_header X-Content-Type-Options "nosniff";\n    add_header X-Frame-Options "DENY";\n    add_header X-XSS-Protection "1; mode=block";\n    add_header Referrer-Policy "no-referrer-when-downgrade";\n    add_header Content-Security-Policy "default-src \'self\'; img-src \'self\' data:; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'";/' /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
