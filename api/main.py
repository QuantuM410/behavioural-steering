from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import numpy as np
from typing import Optional, List
import base64
import io
from PIL import Image
import asyncio
import logging

from model_service import ModelService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Steering Prediction API",
    description="API for real-time steering angle prediction using ResNet-based model",
    version="1.0.0"
)

# Add CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model service
model_service = None

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    global model_service
    try:
        model_service = ModelService()
        success = model_service.load_model()
        if not success:
            logger.error("Failed to load model on startup")
        else:
            logger.info("Model loaded successfully on startup")
    except Exception as e:
        logger.error(f"Error during startup: {e}")

# Request/Response models
class PredictionRequest(BaseModel):
    image: str  # base64 encoded image
    throttle: Optional[float] = 0.5
    speed: Optional[float] = 20.0

class PredictionResponse(BaseModel):
    steering_angle: float
    steering_angle_degrees: float
    throttle: float
    speed: float
    device: str

class VideoPredictionRequest(BaseModel):
    throttle: Optional[float] = 0.5
    speed: Optional[float] = 20.0

class VideoPredictionResponse(BaseModel):
    predictions: List[dict]
    total_frames: int
    fps: float

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    cuda_available: bool

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    if model_service is None:
        raise HTTPException(status_code=503, detail="Model service not initialized")
    
    info = model_service.get_model_info()
    return HealthResponse(
        status="healthy" if info["model_loaded"] else "unhealthy",
        model_loaded=info["model_loaded"],
        device=info["device"],
        cuda_available=info["cuda_available"]
    )

@app.post("/api/predict", response_model=PredictionResponse)
async def predict_steering(request: PredictionRequest):
    """Predict steering angle from base64 encoded image"""
    if model_service is None or model_service.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        result = model_service.predict_from_base64(
            image_base64=request.image,
            throttle=request.throttle,
            speed=request.speed
        )
        return PredictionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in prediction: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/predict-video", response_model=VideoPredictionResponse)
async def predict_video(
    file: UploadFile = File(...),
    throttle: float = 0.5,
    speed: float = 20.0
):
    """Process video file and return predictions for each frame"""
    if model_service is None or model_service.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Read video file
        video_content = await file.read()
        
        # Create temporary file for OpenCV
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(video_content)
        
        # Open video with OpenCV
        cap = cv2.VideoCapture(temp_path)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not open video file")
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        predictions = []
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process frame
            try:
                result = model_service.predict_from_numpy(frame, throttle, speed)
                predictions.append({
                    "frame": frame_count,
                    "timestamp": frame_count / fps,
                    "steering_angle": result["steering_angle"],
                    "steering_angle_degrees": result["steering_angle_degrees"],
                    "throttle": throttle,
                    "speed": speed
                })
            except Exception as e:
                logger.warning(f"Error processing frame {frame_count}: {e}")
                predictions.append({
                    "frame": frame_count,
                    "timestamp": frame_count / fps,
                    "error": str(e)
                })
            
            frame_count += 1
            
            # Limit processing to prevent timeouts (process every 10th frame for long videos)
            if frame_count % 10 != 0 and frame_count > 100:
                continue
        
        cap.release()
        
        # Clean up temp file
        import os
        try:
            os.remove(temp_path)
        except:
            pass
        
        return VideoPredictionResponse(
            predictions=predictions,
            total_frames=frame_count,
            fps=fps
        )
        
    except Exception as e:
        logger.error(f"Error processing video: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Steering Prediction API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
