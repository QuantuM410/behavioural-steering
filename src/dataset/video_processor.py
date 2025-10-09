import cv2
import torch
import torchvision.transforms as transforms
import numpy as np

class VideoProcessor:
    def __init__(self, device):
        self.device = device
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def process_frame(self, frame, throttle=0.5, speed=20.0):
        input_img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        input_tensor = self.transform(input_img).unsqueeze(0).to(self.device)
        extra_features = torch.tensor([[throttle, speed]], dtype=torch.float32).to(self.device)
        return input_tensor, extra_features

    def visualize_steering(self, frame, steering_angle):
        height, width = frame.shape[:2]
        center_x, center_y = width // 2, height
        angle_deg = steering_angle * 30  # Scale -1 to 1 -> -30° to 30°
        length = 100
        end_x = int(center_x + length * np.sin(np.radians(angle_deg)))
        end_y = int(center_y - length * np.cos(np.radians(angle_deg)))
        cv2.arrowedLine(frame, (center_x, center_y), (end_x, end_y), (0, 255, 0), 3, tipLength=0.3)
        cv2.putText(frame, f"Steering: {angle_deg:.2f}°", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        return frame
