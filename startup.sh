#!/bin/bash
# Azure App Service startup script
echo "Starting AI Video Generator..."

# Set production environment
export NODE_ENV=production
export PORT=${PORT:-8080}

# Build frontend if not already built
if [ ! -d "frontend/out" ]; then
  echo "Building frontend..."
  cd frontend && npm run build && cd ..
fi

# Start backend server (which serves frontend in production)
echo "Starting backend on port $PORT..."
cd backend && node src/server.js
