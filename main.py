import sys
import os
import torch
from PyQt5.QtWidgets import QApplication
from src.model.steering_model import load_model
from src.dataset.video_processor import VideoProcessor
from src.ui.main_window import MainWindow
from src.workers.video_worker import VideoWorker

def main():
    app = QApplication(sys.argv)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = load_model(os.path.join("data", "steering_model.pth"), device)
    processor = VideoProcessor(device)
    window = MainWindow(model, processor, device)
    window.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()