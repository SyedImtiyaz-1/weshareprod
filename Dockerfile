# Use Node.js 18 Alpine as base image for smaller size
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 5008
CMD ["npm", "start"]

# Production stage
FROM base AS production

# Copy application code
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p /app/public && \
    chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose port
EXPOSE 5008

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5008', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "server.js"] 