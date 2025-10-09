from PyQt5.QtWidgets import QWidget, QPushButton, QLabel, QVBoxLayout, QFileDialog
from PyQt5.QtGui import QImage, QPixmap
from PyQt5.QtCore import Qt
import cv2
import sys
import torch

class MainWindow(QWidget):
    def __init__(self, model, processor, device):
        super().__init__()
        self.setWindowTitle("Steering Prediction UI")
        self.setGeometry(100, 100, 800, 600)

        self.model = model
        self.processor = processor
        self.device = device
        self.cap = None

        self.video_label = QLabel(self)
        self.video_label.setAlignment(Qt.AlignCenter)
        self.video_label.setText("Select a video source to start")
        layout = QVBoxLayout()
        layout.addWidget(self.video_label)

        self.webcam_btn = QPushButton("Use Webcam")
        self.webcam_btn.clicked.connect(lambda: self.start_video(0))
        layout.addWidget(self.webcam_btn)

        self.file_btn = QPushButton("Select Video File")
        self.file_btn.clicked.connect(self.select_file)
        layout.addWidget(self.file_btn)

        self.stop_btn = QPushButton("Stop")
        self.stop_btn.clicked.connect(self.stop_video)
        self.stop_btn.setEnabled(False)
        layout.addWidget(self.stop_btn)

        self.setLayout(layout)

    def start_video(self, source):
        if self.cap and self.cap.isOpened():
            self.stop_video()
        self.cap = cv2.VideoCapture(source)
        self.stop_btn.setEnabled(True)
        self.webcam_btn.setEnabled(False)
        self.file_btn.setEnabled(False)
        self.process_single_frame()

    def select_file(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Video File", "", "Video Files (*.mp4 *.avi *.mov)")
        if file_path:
            self.start_video(file_path)

    def process_single_frame(self):
        if not self.cap or not self.cap.isOpened():
            self.video_label.setText("No video source")
            return

        ret, frame = self.cap.read()
        if ret:
            input_tensor, extra_features = self.processor.process_frame(frame)
            with torch.no_grad():
                pred = self.model(input_tensor, extra_features).item()
            processed_frame = self.processor.visualize_steering(frame, pred)
            self.update_frame(processed_frame)
        else:
            self.stop_video()

    def update_frame(self, frame):
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        height, width, _ = frame.shape
        bytes_per_line = 3 * width
        q_img = QImage(frame.data, width, height, bytes_per_line, QImage.Format_RGB888)
        self.video_label.setPixmap(QPixmap.fromImage(q_img))

    def stop_video(self):
        if self.cap:
            self.cap.release()
            self.cap = None
        self.video_label.setText("Video stopped")
        self.stop_btn.setEnabled(False)
        self.webcam_btn.setEnabled(True)
        self.file_btn.setEnabled(True)
