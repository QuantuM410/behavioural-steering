# Steering Prediction UI

A modular PyQt5-based application for real-time steering angle prediction from video input using a pre-trained ResNet model.

## Setup
1. Clone the repository: `git clone <your-repo-url>`
2. Install dependencies: `pip install -r requirements.txt`
3. Place your trained `steering_model.pth` in the `data/` directory.
4. Run the application: `python main.py`

## Features
- Real-time video processing (webcam or file input).
- Steering angle visualization with an arrow and degree label.
- Threaded design for smooth UI performance.

## Usage
- Click "Use Webcam" or "Select Video File" to start.
- Click "Stop" to halt processing.
