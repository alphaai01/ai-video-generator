#!/bin/bash
cd "/Users/kishlaykumar/Downloads/Ai Video generator/Ai video generator/ai-video-gen"

echo "🎬 Starting AI Video Generator..."
echo ""

# Start backend
echo "🔧 Starting backend on port 4000..."
cd backend && node src/server.js &
BACKEND_PID=$!
sleep 3

# Start frontend
echo "🖥️  Starting frontend on port 3000..."
cd ../frontend && npx next dev --turbo -p 3000 &
FRONTEND_PID=$!

echo ""
echo "✅ Servers starting! Open http://localhost:3000 in Chrome"
echo "   Press Ctrl+C to stop."
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
