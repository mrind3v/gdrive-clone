# Multi-stage build for Frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy application code
COPY . .

# Build argument for backend URL
ARG REACT_APP_BACKEND_URL=http://localhost:8001

# Set environment variable for build
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}

# Build the application
RUN yarn build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN yarn global add serve

# Copy built assets from builder
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Serve the built application
CMD ["serve", "-s", "build", "-l", "3000"]
