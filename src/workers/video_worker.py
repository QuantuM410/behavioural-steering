from PyQt5.QtCore import QThread, pyqtSignal
import cv2
import numpy as np
import torch  # added torch import for inference context

class VideoWorker(QThread):
    frame_signal = pyqtSignal(np.ndarray)  # existing: frame with overlay
    prediction_signal = pyqtSignal(float)  # new: emit raw steering prediction

    def __init__(self, model, processor, device, source):
        super().__init__()
        self.model = model
        self.processor = processor
        self.device = device
        self.source = source
        self.running = False

    def run(self):
        self.running = True
        cap = cv2.VideoCapture(self.source)
        while self.running and cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            input_tensor, extra_features = self.processor.process_frame(frame)
            with torch.no_grad():
                pred = self.model(input_tensor, extra_features).item()
            processed_frame = self.processor.visualize_steering(frame.copy(), pred)  # overlay the steering
            self.prediction_signal.emit(float(pred))  # emit raw prediction separately
            self.frame_signal.emit(processed_frame)   # emit frame last to keep UI smooth

        cap.release()

    def stop(self):
        self.running = False
