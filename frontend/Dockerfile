# Multi-stage build for Frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json yarn.lock ./

# Install ALL dependencies (including devDependencies needed for build)
# Don't set NODE_ENV=production yet, as we need devDependencies for craco
RUN yarn install --frozen-lockfile --network-timeout 300000 || \
    yarn install --frozen-lockfile --network-timeout 300000

# Copy application code
COPY . .

# Build argument for backend URL
ARG REACT_APP_BACKEND_URL=http://localhost:8001

# Set environment variable for build
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}

# Build the application with increased memory
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN yarn build

# Production stage - smaller image
FROM node:20-alpine

WORKDIR /app

# Install serve with retry logic
RUN yarn global add serve || yarn global add serve

# Copy only built assets from builder (smaller image)
COPY --from=builder /app/build ./build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reactuser -u 1001 && \
    chown -R reactuser:nodejs /app

USER reactuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Serve the built application
CMD ["serve", "-s", "build", "-l", "3000"]
