# Start script for the Behavioural Steering application

Write-Host "Starting Behavioural Steering Application..." -ForegroundColor Green

# Check if Python dependencies are installed
Write-Host "Checking Python dependencies..." -ForegroundColor Yellow
try {
    python3 -c "import fastapi, uvicorn, torch, torchvision" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
        pip3 install -r requirements.txt
    }
} catch {
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    pip3 install -r requirements.txt
}

# Check if Node dependencies are installed
Write-Host "Checking Node dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing Node dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the backend API server
Write-Host "Starting FastAPI backend server..." -ForegroundColor Cyan
Start-Process python3 -ArgumentList "api/main.py" -WindowStyle Hidden

# Wait a moment for the backend to start
Start-Sleep -Seconds 3

# Start the Next.js frontend
Write-Host "Starting Next.js frontend..." -ForegroundColor Cyan
Start-Process npm -ArgumentList "run", "dev" -WindowStyle Hidden

Write-Host ""
Write-Host "Application started successfully!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "Stopping servers..." -ForegroundColor Red
    Get-Process python3, node -ErrorAction SilentlyContinue | Stop-Process -Force
}
