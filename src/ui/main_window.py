from PyQt5.QtWidgets import QWidget, QPushButton, QLabel, QVBoxLayout, QFileDialog, QHBoxLayout, QFrame, QDial, QSizePolicy
from PyQt5.QtGui import QImage, QPixmap
from PyQt5.QtCore import Qt
import cv2
import sys
import torch
from src.workers.video_worker import VideoWorker

class MainWindow(QWidget):
    def __init__(self, model, processor, device):
        super().__init__()
        self.setWindowTitle("Steering Prediction UI")
        self.setMinimumSize(980, 640)
        self.setStyleSheet("""
            QWidget { background-color: #0f1115; color: #e5e7eb; font-family: 'Segoe UI', 'Inter', sans-serif; }
            QLabel#Title { font-size: 20px; font-weight: 600; color: #e5e7eb; }
            QLabel#Subtitle { font-size: 12px; color: #94a3b8; }
            QLabel#Metric { font-size: 28px; font-weight: 700; color: #10b981; }
            QLabel#Pill {
                background-color: #111827; color: #e5e7eb; padding: 6px 10px; border-radius: 999px;
                border: 1px solid #374151;
            }
            QFrame#Card { background-color: #151923; border: 1px solid #1f2937; border-radius: 12px; }
            QPushButton {
                background-color: #2563eb; color: white; border: none; border-radius: 8px;
                padding: 10px 14px; font-weight: 600;
            }
            QPushButton:hover:!disabled { background-color: #1e50be; }
            QPushButton:disabled { background-color: #334155; color: #9ca3af; }
            QPushButton#Secondary { background-color: #111827; border: 1px solid #374151; color: #e5e7eb; }
            QPushButton#Secondary:hover:!disabled { background-color: #0b1220; }
            QPushButton#Danger { background-color: #ef4444; color: #111827; }
            QPushButton#Danger:hover:!disabled { background-color: #dc2626; }
            QDial { background: transparent; }
        """)
        self.setGeometry(100, 100, 800, 600)
        self.setCursor(Qt.ArrowCursor)

        self.model = model
        self.processor = processor
        self.device = device
        self.worker = None

        header = QVBoxLayout()
        title = QLabel("Behavioural Steering")
        title.setObjectName("Title")
        subtitle = QLabel("Real-time steering inference with video preview")
        subtitle.setObjectName("Subtitle")
        header.addWidget(title)
        header.addWidget(subtitle)

        self.video_label = QLabel(self)
        self.video_label.setAlignment(Qt.AlignCenter)
        self.video_label.setText("Select a video source to start")
        self.video_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.video_label.setCursor(Qt.ArrowCursor)
        video_card = QFrame()
        video_card.setObjectName("Card")
        video_card_layout = QVBoxLayout()
        video_card_layout.setContentsMargins(12, 12, 12, 12)
        video_card_layout.addWidget(self.video_label)
        video_card.setLayout(video_card_layout)

        self.pred_label = QLabel("Steering: --.-°")
        self.pred_label.setObjectName("Metric")
        self.pred_label.setAlignment(Qt.AlignLeft)
        self.device_label = QLabel(f"Device: {'CUDA' if torch.cuda.is_available() else 'CPU'}")
        self.device_label.setObjectName("Pill")
        self.device_label.setAlignment(Qt.AlignLeft)

        self.gauge = QDial()
        self.gauge.setRange(-30, 30)  # degrees
        self.gauge.setNotchesVisible(True)
        self.gauge.setWrapping(False)
        self.gauge.setEnabled(False)  # display-only gauge
        self.gauge.setCursor(Qt.ArrowCursor)

        right_card = QFrame()
        right_card.setObjectName("Card")
        right_layout = QVBoxLayout()
        right_layout.setContentsMargins(12, 12, 12, 12)
        right_layout.addWidget(QLabel("Prediction"))
        right_layout.addWidget(self.pred_label)
        right_layout.addSpacing(8)
        right_layout.addWidget(QLabel("Steering Angle"))
        right_layout.addWidget(self.gauge)
        right_layout.addSpacing(8)
        right_layout.addWidget(self.device_label)
        right_layout.addStretch(1)
        right_card.setLayout(right_layout)

        content_row = QHBoxLayout()
        content_row.addWidget(video_card, 3)
        content_row.addSpacing(12)
        content_row.addWidget(right_card, 1)

        controls = QHBoxLayout()
        self.webcam_btn = QPushButton("Use Webcam")
        self.webcam_btn.setToolTip("Stream frames from your default camera")
        self.webcam_btn.setCursor(Qt.ArrowCursor)
        self.webcam_btn.clicked.connect(lambda: self.start_video(0))

        self.file_btn = QPushButton("Select Video File")
        self.file_btn.setObjectName("Secondary")
        self.file_btn.setCursor(Qt.ArrowCursor)
        self.file_btn.setToolTip("Choose a local video file (*.mp4, *.avi, *.mov)")
        self.file_btn.clicked.connect(self.select_file)

        self.stop_btn = QPushButton("Stop")
        self.stop_btn.setObjectName("Danger")
        self.stop_btn.setCursor(Qt.ArrowCursor)
        self.stop_btn.setToolTip("Stop processing the current source")
        self.stop_btn.clicked.connect(self.stop_video)
        self.stop_btn.setEnabled(False)

        controls.addWidget(self.webcam_btn)
        controls.addWidget(self.file_btn)
        controls.addStretch(1)
        controls.addWidget(self.stop_btn)

        layout = QVBoxLayout()
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)
        layout.addLayout(header)
        layout.addLayout(content_row)
        layout.addLayout(controls)
        self.setLayout(layout)

    def start_video(self, source):
        self.stop_video()  # ensure any existing worker is stopped
        self.worker = VideoWorker(self.model, self.processor, self.device, source)
        self.worker.frame_signal.connect(self.update_frame)
        self.worker.prediction_signal.connect(self.update_prediction)
        self.worker.finished.connect(self.on_worker_finished)
        self.worker.start()
        self.stop_btn.setEnabled(True)
        self.webcam_btn.setEnabled(False)
        self.file_btn.setEnabled(False)

    def select_file(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Video File", "", "Video Files (*.mp4 *.avi *.mov)")
        if file_path:
            self.start_video(file_path)

    def update_frame(self, frame):
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        height, width, _ = frame.shape
        bytes_per_line = 3 * width
        q_img = QImage(frame.data, width, height, bytes_per_line, QImage.Format_RGB888)
        pix = QPixmap.fromImage(q_img).scaled(self.video_label.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation)
        self.video_label.setPixmap(pix)

    def update_prediction(self, pred_value: float):
        angle_deg = float(pred_value) * 30.0
        self.pred_label.setText(f"Steering: {angle_deg:.1f}°")
        try:
            self.gauge.setValue(int(round(angle_deg)))
        except Exception:
            pass

    def on_worker_finished(self):
        self.stop_btn.setEnabled(False)
        self.webcam_btn.setEnabled(True)
        self.file_btn.setEnabled(True)
        if self.video_label.pixmap() is None:
            self.video_label.setText("Video stopped")

    def stop_video(self):
        if self.worker is not None:
            try:
                self.worker.stop()
                self.worker.wait()
            finally:
                self.worker = None
        self.video_label.setText("Video stopped")
        self.stop_btn.setEnabled(False)
        self.webcam_btn.setEnabled(True)
        self.file_btn.setEnabled(True)

    def closeEvent(self, event):
        self.stop_video()
        super().closeEvent(event)
