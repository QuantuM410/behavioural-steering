# Behavioural Steering - Model Integration

This document describes the integration of the ResNet-based steering model from the Jupyter notebook with the Next.js web application via a FastAPI backend.

## Architecture Overview

The integration consists of:

1. **FastAPI Backend** (`api/`) - Serves the trained steering model via REST API
2. **Next.js Frontend** (`app/`, `components/`) - Web UI with real-time video processing
3. **API Client** (`lib/api-client.ts`) - Frontend utilities for backend communication

## Backend API

### Endpoints

- `GET /api/health` - Health check and model status
- `POST /api/predict` - Predict steering angle from base64 image
- `POST /api/predict-video` - Process entire video file
- `GET /docs` - Interactive API documentation

### Model Details

- **Architecture**: ResNet18 + custom layers (128 hidden units + 1 output)
- **Input**: 224x224 RGB images + throttle/speed parameters
- **Output**: Steering angle in radians (-1 to 1, scaled to -30° to +30°)
- **Device**: CUDA GPU acceleration (fallback to CPU)

## Quick Start

### 1. Install Dependencies

```bash
# Python dependencies (backend)
pip install -r requirements-api.txt

# Node.js dependencies (frontend)
npm install --legacy-peer-deps
```

### 2. Start Backend Server

```bash
python api/main.py
```

The API will be available at `http://localhost:8000`

### 3. Start Frontend

```bash
npm run dev
```

The web app will be available at `http://localhost:3000`

### 4. Test Integration

```bash
python test_integration.py
```

## Usage

### Web Interface

1. Open `http://localhost:3000` in your browser
2. Upload a driving video using the file input
3. Toggle between "Simulation" and "Live Inference" modes
4. Watch real-time steering angle predictions

### API Usage

```python
import requests
import base64
from PIL import Image
import io

# Create test image
img = Image.new('RGB', (224, 224), color='red')
buffer = io.BytesIO()
img.save(buffer, format='JPEG')
img_str = base64.b64encode(buffer.getvalue()).decode()

# Get prediction
response = requests.post('http://localhost:8000/api/predict', json={
    'image': img_str,
    'throttle': 0.5,
    'speed': 20.0
})

result = response.json()
print(f"Steering angle: {result['steering_angle_degrees']:.2f}°")
```

## File Structure

```
├── api/
│   ├── main.py              # FastAPI application
│   └── model_service.py     # Model loading and inference
├── lib/
│   └── api-client.ts        # Frontend API utilities
├── components/
│   └── video-player.tsx     # Enhanced video player with prediction
├── app/
│   └── page.tsx             # Main page with backend status
├── data/
│   └── steering_model_v2.pth # Trained model weights
├── test_integration.py      # Integration tests
└── requirements-api.txt     # Backend dependencies
```

## Features

### Backend
- ✅ Model loading with CUDA support
- ✅ Real-time prediction endpoint
- ✅ Video processing endpoint
- ✅ Health monitoring
- ✅ CORS enabled for frontend
- ✅ Error handling and validation

### Frontend
- ✅ Real-time video frame extraction
- ✅ Backend connection status
- ✅ Live inference mode
- ✅ Fallback simulation mode
- ✅ Steering gauge visualization
- ✅ Processing status indicators

## Testing

Run the integration test to verify everything works:

```bash
python test_integration.py
```

Expected output:
```
Behavioural Steering Backend Integration Test
==================================================
Testing health endpoint...
Health check passed - Device: cuda

Testing prediction endpoint...
Prediction successful - Angle: 0.0292 rad (0.87 deg)

Testing multiple predictions...
  red: 0.0292 rad (0.87 deg)
  blue: -0.0493 rad (-1.48 deg)
  green: 0.2515 rad (7.55 deg)
  yellow: 0.2403 rad (7.21 deg)
Multiple predictions successful - Range: [-0.0493, 0.2515]

All integration tests passed!
Backend API is ready for frontend integration
```

## Troubleshooting

### Backend Issues
- Ensure model file exists: `data/steering_model_v2.pth`
- Check CUDA availability: `python -c "import torch; print(torch.cuda.is_available())"`
- Verify dependencies: `pip list | grep torch`

### Frontend Issues
- Check backend connection: Visit `http://localhost:8000/api/health`
- Clear browser cache and reload
- Check browser console for errors

### Performance
- Backend runs on CUDA for faster inference
- Frontend processes at 10 FPS for smooth experience
- Reduce video resolution if experiencing lag

## Next Steps

The integration is complete and functional. You can now:

1. **Upload real driving videos** and see live predictions
2. **Fine-tune the model** using the notebook and retrain
3. **Add webcam support** for real-time driving scenarios
4. **Implement steering visualization** overlays on video frames
5. **Add data logging** for collecting new training data
