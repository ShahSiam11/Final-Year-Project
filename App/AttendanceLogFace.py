# Developed and maintained by Shah Siam, 2025

import cv2
import torch
import os
import pandas as pd
import numpy as np
from facenet_pytorch import InceptionResnetV1, MTCNN
import time
import sys
import logging
from datetime import datetime, timedelta
import signal
import psutil
import requests

# Try to import GPUtil; if not available, set to None.
try:
    import GPUtil
except ImportError:
    GPUtil = None

# Set up logging with multiple levels
logging.basicConfig(
    filename='face_recognition.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

HEALTH_LEVEL = 25  # Custom level between WARNING (30) and INFO (20)
logging.addLevelName(HEALTH_LEVEL, "HEALTH")

def health(self, message, *args, **kwargs):
    if self.isEnabledFor(HEALTH_LEVEL):
        self._log(HEALTH_LEVEL, message, args, **kwargs)

logging.Logger.health = health

ESP32_IP = "192.168.43.199"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Append paths for Anti_Spoof and Attendance modules dynamically
ANTI_SPOOF_PATH = os.path.join(BASE_DIR, "Anti_Spoof")
ATTENDANCE_PATH = os.path.join(BASE_DIR, "Attendance")

sys.path.append(ANTI_SPOOF_PATH)
sys.path.append(ATTENDANCE_PATH)

from Anti_Spoof.test import test
from Attendance.attendance import log_attendance

# Global flag to track ESP32 availability
esp_available = True

def send_to_esp32(status):
    global esp_available
    # Skip ESP32 calls if already marked unavailable
    if not esp_available:
        print("ESP32 is not available. Skipping request.")
        return

    url = f"http://{ESP32_IP}/led?cmd={status}"
    max_attempts = 3

    for attempt in range(1, max_attempts + 1):
        try:
            response = requests.get(url, timeout=5)
            print("ESP32 response:", response.text)
            return
        except Exception as e:
            logging.debug(f"Attempt {attempt}: Unable to reach ESP32 Retrying...")
            print(f"Attempt {attempt}: Unable to reach ESP32 Retrying...")
            time.sleep(3)  # Optional: wait a bit before next attempt

    # If all attempts fail, disable further ESP32 communication
    print("ESP32 not available after 3 attempts. Future ESP32 communication are Disabled automatically.",flush=True)
    logging.debug("ESP32 not available after 3 attempts. Future ESP32 communication are Disabled automatically")
    esp_available = False


def parse_duration(duration_str):
    try:
        if duration_str.endswith('h'):
            return timedelta(hours=int(duration_str[:-1]))
        elif duration_str.endswith('m'):
            return timedelta(minutes=int(duration_str[:-1]))
        else:
            raise ValueError("Invalid duration format. Use '1h' for hours or '30m' for minutes.")
    except ValueError as e:
        logging.error(f"Error parsing duration: {e}")
        return timedelta(hours=1)  # Default to 1 hour


def read_config(config_file='config.txt'):
    config = {}
    try:
        with open(config_file, 'r') as file:
            for line in file:
                if '=' in line:
                    key, value = line.strip().split('=')
                    if key == "MIN_DURATION":
                        config[key] = parse_duration(value)
                    elif '.' in value:
                        config[key] = float(value)
                    else:
                        config[key] = int(value)
    except Exception as e:
        logging.error(f"Error reading config file: {e}")
    return config


# Read configuration parameters
config = read_config()

SPOOF_THRESHOLD = config.get('SPOOF_THRESHOLD', 1)
FRAME_SLEEP_TIME = config.get('FRAME_SLEEP_TIME', 3)
IDLE_SLEEP_TIME = config.get('IDLE_SLEEP_TIME', 5)
RECOGNITION_THRESHOLD = config.get('RECOGNITION_THRESHOLD', 0.8)

# Initialize models
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
mtcnn = MTCNN(image_size=160, margin=0, min_face_size=20, device=device)
resnet = InceptionResnetV1(pretrained='vggface2').eval()

DATABASE_FILE = 'Faces/Face_database.csv'
if not os.path.exists(DATABASE_FILE):
    pd.DataFrame(columns=['Name'] + [f'v{i}' for i in range(512)]).to_csv(DATABASE_FILE, index=False)
    logging.info(f"Created new database file: {DATABASE_FILE}")

IMAGE_SAVE_DIR = 'Faces/Temp_images'
os.makedirs(IMAGE_SAVE_DIR, exist_ok=True)

# Global flag for graceful exit
exit_flag = False

# Dictionary to store AI performance metrics
ai_metrics = {
    'faces_processed': 0,
    'total_face_inference_time': 0.0,
    'total_spoof_test_time': 0.0,
}


def signal_handler(sig, frame):
    global exit_flag
    logging.info("Gracefully stopping the face recognition process...")
    print("\nExiting...")
    exit_flag = True


signal.signal(signal.SIGINT, signal_handler)


def recognize_face(embedding):
    try:
        db = pd.read_csv(DATABASE_FILE)
        names = db['Name']
        embeddings = db.iloc[:, 1:].values
        distances = np.linalg.norm(embeddings - embedding, axis=1)
        min_dist = np.min(distances)
        min_index = np.argmin(distances)
        if min_dist < RECOGNITION_THRESHOLD:
            return names[min_index], min_dist
        else:
            return "Unknown", min_dist
    except Exception as e:
        logging.error(f"Error in recognize_face: {e}")
        return "Unknown", float("inf")


def log_system_health():
    """Log system resource usage."""
    try:
        cpu_usage = psutil.cpu_percent(interval=1)
        mem_usage = psutil.virtual_memory().percent
        disk_usage = psutil.disk_usage('/').percent
        logging.getLogger().health(f"System Health - CPU Usage: {cpu_usage}%, Memory Usage: {mem_usage}%, Disk Usage: {disk_usage}%")
    except Exception as e:
        logging.getLogger().health("Error fetching CPU/Memory/Disk usage: " + str(e))

    if GPUtil is not None:
        try:
            gpus = GPUtil.getGPUs()
            for gpu in gpus:
                logging.info(f"GPU {gpu.id} - Load: {gpu.load*100:.1f}%, Memory Usage: {gpu.memoryUtil*100:.1f}%")
        except Exception as e:
            logging.getLogger().health("Error fetching GPU usage: " + str(e))
    else:
        logging.getLogger().health("GPUtil not available; GPU usage not logged.")


def log_ai_metrics(metrics):
    """Log AI-specific performance metrics and reset the counters."""
    try:
        if metrics['faces_processed'] > 0:
            avg_face_time = metrics['total_face_inference_time'] / metrics['faces_processed']
            avg_spoof_time = metrics['total_spoof_test_time'] / metrics['faces_processed']
            logging.getLogger().health(
                f"AI Metrics - Faces Processed: {metrics['faces_processed']}, "
                f"Avg Face Embedding Inference Time: {avg_face_time:.3f}s, "
                f"Avg Anti-Spoofing Test Time: {avg_spoof_time:.3f}s"
            )
        else:
            logging.getLogger().health("AI Metrics - No faces processed in this interval.")
    except Exception as e:
        logging.getLogger().health("Error logging AI metrics: " + str(e))
    finally:
        # Reset counters
        metrics['faces_processed'] = 0
        metrics['total_face_inference_time'] = 0.0
        metrics['total_spoof_test_time'] = 0.0


def main():
    global exit_flag
    logging.info("Started face recognition process.")
    print("System Started, Auto Mode")
    cap = cv2.VideoCapture(0)
    # cap = cv2.VideoCapture('rtsp://admin:Attendease321@192.168.0.198:554/Streaming/Channels/101')

    if not cap.isOpened():
        logging.critical("Error: Could not open camera.")
        print("Error: Could not open camera.")
        return

    # Log health metrics every 60 seconds
    HEALTH_LOG_INTERVAL = 10  # seconds
    last_health_log_time = time.time()

    while not exit_flag:
        try:
            ret, frame = cap.read()
            if not ret:
                logging.error("Error: Could not read frame.")
                print("Error: Could not read frame.")
                time.sleep(IDLE_SLEEP_TIME)
                continue

            # Log system and AI health if the interval has passed
            current_time = time.time()
            if current_time - last_health_log_time >= HEALTH_LOG_INTERVAL:
                log_system_health()
                log_ai_metrics(ai_metrics)
                last_health_log_time = current_time

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Detect faces and probabilities. Wrap in try/except to handle errors gracefully.
            try:
                faces, probs = mtcnn.detect(rgb_frame)
            except Exception as e:
                logging.error("Error during face detection: " + str(e))
                faces, probs = None, None

            # Log average face detection confidence if probabilities are available
            if probs is not None:
                try:
                    # Filter out any None values in the probabilities list.
                    valid_probs = [p for p in probs if p is not None]
                    if valid_probs:
                        avg_confidence = np.mean(valid_probs)
                        logging.getLogger().health(f"Average Face Detection Confidence: {avg_confidence:.2f}")
                except Exception as e:
                    logging.getLogger().health("Error calculating average confidence: " + str(e))

            if faces is None:
                logging.info(f"😴 No faces detected. Sleeping for {IDLE_SLEEP_TIME} seconds...")
                send_to_esp32("yellow")
                time.sleep(IDLE_SLEEP_TIME)
                continue

            logging.info(f"Detected {len(faces)} faces.")
            print(f"Detected {len(faces)} faces.")

            for i, (left, top, right, bottom) in enumerate(faces):
                try:
                    processed_frame = frame.copy()
                    face_region = rgb_frame[int(top):int(bottom), int(left):int(right)]
                    # Measure face embedding inference time
                    start_face_inference = time.time()
                    # Convert face region to tensor, process with mtcnn and then resnet
                    face_tensor = mtcnn(torch.tensor(face_region).to(device))
                    face_embedding = resnet(face_tensor.unsqueeze(0)).detach().cpu().numpy()[0]
                    face_inference_time = time.time() - start_face_inference

                    name, distance = recognize_face(face_embedding)
                    logging.info(f"Recognition Result: {name} (Distance: {distance:.4f})")
                    print(f"Recognition Result: {name} (Distance: {distance:.4f})")

                    image_filename = os.path.join(IMAGE_SAVE_DIR, f"processed_face_{i + 1}.jpg")
                    cv2.imwrite(image_filename, processed_frame)

                    # Run anti-spoofing test and measure its performance
                    start_spoof = time.time()
                    spoof_result, score, test_speed = test(
                        image_filename,
                        "Anti_Spoof/resources/anti_spoof_models",
                        device
                    )
                    spoof_test_time = time.time() - start_spoof

                    if spoof_result <= SPOOF_THRESHOLD:
                        logging.info(f"Real Face Detected: {name} (Score: {score:.2f})")
                        print(f"Real Face Detected: {name} (Score: {score:.2f})")
                        log_attendance(name, "Real", score)
                        send_to_esp32("green")
                    else:
                        logging.warning(f"Fake Face Detected: {name} (Score: {score:.2f})")
                        logging.info(f"Fake Face Detected: {name} (Score: {score:.2f})")
                        print(f"Fake Face Detected: {name} (Score: {score:.2f})")
                        log_attendance(name, "Fake", score)
                        send_to_esp32("red")

                    # Update AI performance metrics
                    ai_metrics['faces_processed'] += 1
                    ai_metrics['total_face_inference_time'] += face_inference_time
                    ai_metrics['total_spoof_test_time'] += spoof_test_time

                except Exception as e:
                    logging.error(f"Error processing face {i + 1}: {e}")
                    print(f"Error processing face {i + 1}: {e}")

            time.sleep(FRAME_SLEEP_TIME)

        except Exception as e:
            logging.error(f"Unexpected error in main System: {e}")
            # Continue processing after logging the error
            time.sleep(IDLE_SLEEP_TIME)
    logging.info("Face recognition process ended.")
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
