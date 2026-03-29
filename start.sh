#!/bin/bash
# AI Video Generator - Startup Script
# Starts both backend and frontend servers

echo "🎬 Starting AI Video Generator..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Install backend dependencies if needed
if [ ! -d "$SCRIPT_DIR/backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd "$SCRIPT_DIR/backend" && npm install
fi

# Install frontend dependencies if needed
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd "$SCRIPT_DIR/frontend" && npm install
fi

# Start backend
echo "🔧 Starting backend server on port 4000..."
cd "$SCRIPT_DIR/backend" && node src/server.js &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3

# Start frontend
echo "🖥️  Starting frontend on port 3000..."
cd "$SCRIPT_DIR/frontend" && npx next dev --turbo -p 3000 &
FRONTEND_PID=$!

echo ""
echo "✅ AI Video Generator is starting up!"
echo ""
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:4000"
echo "   Mode:      Demo (simulated videos)"
echo ""
echo "   Press Ctrl+C to stop both servers."
echo ""

# Handle Ctrl+C
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# Wait for either process
wait
