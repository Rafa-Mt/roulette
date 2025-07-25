# Multi-stage build for production optimization

# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS production

# Install PM2 globally and serve
RUN npm install -g pm2 serve

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy PM2 ecosystem configuration
COPY ecosystem.config.cjs ./

# Expose port 3210 (as defined in ecosystem.config.cjs)
EXPOSE 3210

# Start the application with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
