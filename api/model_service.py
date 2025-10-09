import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import io
import base64
import numpy as np

class SteeringModel(nn.Module):
    """Model architecture matching the Jupyter notebook"""
    def __init__(self):
        super(SteeringModel, self).__init__()
        self.resnet = models.resnet18(pretrained=False)
        num_ftrs = self.resnet.fc.in_features
        self.resnet.fc = nn.Identity()  # Remove the final layer
        self.fc1 = nn.Linear(num_ftrs + 2, 128)  # +2 for throttle and speed
        self.fc2 = nn.Linear(128, 1)  # Output steering angle

    def forward(self, x, extra_features):
        x = self.resnet(x)
        x = torch.cat((x, extra_features), dim=1)  # Concatenate image and numerical features
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

class ModelService:
    def __init__(self, model_path: str = "data/steering_model_v2.pth"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model_path = model_path
        self.model = None
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),  # ResNet input size
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
    def load_model(self):
        """Load the trained model"""
        try:
            self.model = SteeringModel().to(self.device)
            self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
            self.model.eval()
            print(f"Model loaded successfully on {self.device}")
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    
    def predict_from_base64(self, image_base64: str, throttle: float = 0.5, speed: float = 20.0):
        """Predict steering angle from base64 encoded image"""
        try:
            # Decode base64 image
            image_data = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_data))
            
            # Convert PIL to numpy array (RGB)
            image_np = np.array(image)
            
            # Apply transform
            image_tensor = self.transform(image_np).unsqueeze(0).to(self.device)
            
            # Create extra features tensor
            extra_features = torch.tensor([[throttle, speed]], dtype=torch.float32).to(self.device)
            
            # Make prediction
            with torch.no_grad():
                prediction = self.model(image_tensor, extra_features).item()
            
            return {
                "steering_angle": prediction,
                "steering_angle_degrees": prediction * 30,  # Convert to degrees for display
                "throttle": throttle,
                "speed": speed,
                "device": str(self.device)
            }
            
        except Exception as e:
            raise ValueError(f"Error processing image: {e}")
    
    def predict_from_numpy(self, image_np: np.ndarray, throttle: float = 0.5, speed: float = 20.0):
        """Predict steering angle from numpy array (BGR format from OpenCV)"""
        try:
            # Convert BGR to RGB
            image_rgb = np.array(image_np)[:, :, ::-1]  # BGR to RGB
            
            # Apply transform
            image_tensor = self.transform(image_rgb).unsqueeze(0).to(self.device)
            
            # Create extra features tensor
            extra_features = torch.tensor([[throttle, speed]], dtype=torch.float32).to(self.device)
            
            # Make prediction
            with torch.no_grad():
                prediction = self.model(image_tensor, extra_features).item()
            
            return {
                "steering_angle": prediction,
                "steering_angle_degrees": prediction * 30,
                "throttle": throttle,
                "speed": speed,
                "device": str(self.device)
            }
            
        except Exception as e:
            raise ValueError(f"Error processing numpy image: {e}")
    
    def get_model_info(self):
        """Get model and device information"""
        return {
            "device": str(self.device),
            "cuda_available": torch.cuda.is_available(),
            "model_loaded": self.model is not None,
            "model_path": self.model_path
        }
