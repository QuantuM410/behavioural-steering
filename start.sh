#!/bin/bash

# Start script for the Behavioural Steering application

echo "Starting Behavioural Steering Application..."

# Check if Python dependencies are installed
echo "Checking Python dependencies..."
python3 -c "import fastapi, uvicorn, torch, torchvision" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt
fi

# Check if Node dependencies are installed
echo "Checking Node dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
fi

# Start the backend API server
echo "Starting FastAPI backend server..."
python3 api/main.py &
BACKEND_PID=$!

# Wait a moment for the backend to start
sleep 3

# Start the Next.js frontend
echo "Starting Next.js frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Application started successfully!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
