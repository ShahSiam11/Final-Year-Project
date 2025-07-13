# Developed and maintained by Shah Siam, 2025

import cv2
import torch
import os
import pandas as pd
import numpy as np
import xml.etree.ElementTree as ET
from facenet_pytorch import InceptionResnetV1, MTCNN
import time
import sys
import logging
import socket
import uuid
import json
from getpass import getpass
from queue import Queue
import threading
from PIL import Image, ImageEnhance
from datetime import datetime
import cv2
import requests
import xmltodict
from xml.sax.saxutils import escape
import time
import base64
from datetime import timedelta


# Create the 'ip_camera' directory if it doesn't exist
log_directory = 'IP_Camera'
os.makedirs(log_directory, exist_ok=True)

# Set the log file path inside the 'ip_camera' folder
log_filename = os.path.join(log_directory, f'face_recognition_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')

# Setup logger
logger = logging.getLogger('face_recognition')
logger.setLevel(logging.DEBUG)

# File handler for logging to a file
file_handler = logging.FileHandler(log_filename)
file_handler.setLevel(logging.DEBUG)
file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(file_formatter)

# Console handler for logging to the console
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter('%(levelname)s - %(message)s')
console_handler.setFormatter(console_formatter)

# Add handlers to the logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "Anti_Spoof")))
from Anti_Spoof.test import test

# Logging for initial setup
logger.info("Successfull Logging started for face recognition.")


def read_config(file_path):
    """
    Read configuration parameters from a text file.
    
    Args:
        file_path (str): Path to the configuration file.
        
    Returns:
        dict: Dictionary containing configuration parameters.
    """
    config = {}
    try:
        with open(file_path, 'r') as file:
            for line in file:
                line = line.strip()
                if line and not line.startswith('#'):  # Skip comments and empty lines
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    # Convert value to appropriate type
                    if value.isdigit():
                        value = int(value)
                    elif value.replace('.', '', 1).isdigit():  # Check for float
                        value = float(value)
                    elif value.lower() in ('true', 'false'):  # Check for boolean
                        value = value.lower() == 'true'
                    
                    config[key] = value
    except FileNotFoundError:
        logger.error(f"Configuration file {file_path} not found. Using default values.")
    except Exception as e:
        logger.error(f"Error reading configuration file: {str(e)}")
    
    return config

thresholds_config = read_config('IP_Camera/thresholds.txt')

# Constants
DATABASE_FILE = 'Faces/Face_database.csv'
TRAINING_DIR = 'Faces/Training_images'
IMAGE_SAVE_DIR = 'Faces/Temp_images'
SPOOF_THRESHOLD = thresholds_config.get('SPOOF_THRESHOLD', 2)
FRAME_SLEEP_TIME = thresholds_config.get('FRAME_SLEEP_TIME', 0.005)
IDLE_SLEEP_TIME = thresholds_config.get('IDLE_SLEEP_TIME', 5)
RECOGNITION_THRESHOLD = thresholds_config.get('RECOGNITION_THRESHOLD', 0.9)
CONFIG_FILE = "IP_Camera/camera_config.txt"
MAX_RETRIES = 5
RETRY_DELAY = 5
QUEUE_SIZE = thresholds_config.get('QUEUE_SIZE', 5)
DISPLAY_WIDTH = thresholds_config.get('DISPLAY_WIDTH', 2688)
DISPLAY_HEIGHT = thresholds_config.get('DISPLAY_HEIGHT', 1520)
PROCESS_EVERY_N_FRAMES = thresholds_config.get('PROCESS_EVERY_N_FRAMES', 1)
MIN_FACE_SIZE = thresholds_config.get('MIN_FACE_SIZE', 30)
CONFIDENCE_THRESHOLD = thresholds_config.get('CONFIDENCE_THRESHOLD', 0.80)
exit_flag = False
USE_FACE_ENHANCEMENT = thresholds_config.get('USE_FACE_ENHANCEMENT', True)
FACE_SCALING_FACTOR = thresholds_config.get('FACE_SCALING_FACTOR', 1.5)
SPOOF_CONSECUTIVE_CHECKS = 1  # Number of consecutive checks required for liveness decision
SPOOF_SCORE_BUFFER_SIZE = 3  # Store last 5 spoof scores for averaging

# Global dictionary to track entry and exit times for each person
person_time_tracker = {}
TIME_THRESHOLD_FOR_GROUPING = 10  # Adjust this value as needed

# Create necessary directories
os.makedirs('Faces', exist_ok=True)
os.makedirs(TRAINING_DIR, exist_ok=True)
os.makedirs(IMAGE_SAVE_DIR, exist_ok=True)
os.makedirs('logs', exist_ok=True)

CAMERA_CONFIG_FILE = "IP_Camera/camera_settings.json"

DEFAULT_THRESHOLDS = {
    'SPOOF_THRESHOLD': 2,
    'FRAME_SLEEP_TIME': 0.005,
    'IDLE_SLEEP_TIME': 5,
    'RECOGNITION_THRESHOLD': 0.9,
    'QUEUE_SIZE': 5,
    'DISPLAY_WIDTH': 2688,
    'DISPLAY_HEIGHT': 1520,
    'PROCESS_EVERY_N_FRAMES': 1,
    'MIN_FACE_SIZE': 30,
    'CONFIDENCE_THRESHOLD': 0.80,
    'USE_FACE_ENHANCEMENT': False,
    'FACE_SCALING_FACTOR': 0
}






# Global queues for thread communication (separate queues for each camera)
frame_queues = {
    'entry': Queue(maxsize=QUEUE_SIZE),
    'exit': Queue(maxsize=QUEUE_SIZE)
}
result_queues = {
    'entry': Queue(maxsize=QUEUE_SIZE),
    'exit': Queue(maxsize=QUEUE_SIZE)
}

# Initialize Face Detection & Recognition
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
mtcnn = MTCNN(
    image_size=160,
    margin=20,
    min_face_size=MIN_FACE_SIZE,
    thresholds=[0.5, 0.6, 0.8],  # Stricter MTCNN thresholds
    factor=0.709,
    post_process=True,
    device=device
)
resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

def get_camera_ips():
    """Discover ONVIF-compatible cameras using WS-Discovery."""
    print("🔍 Searching for ONVIF-compatible IP cameras...")
    discovered_ips = []
    probe_template = '''<?xml version="1.0" encoding="UTF-8"?>
    <e:Envelope xmlns:e="http://www.w3.org/2003/05/soap-envelope"
                xmlns:w="http://schemas.xmlsoap.org/ws/2004/08/addressing"
                xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery">
        <e:Header>
            <w:MessageID>uuid:{}</w:MessageID>
            <w:To e:mustUnderstand="true">urn:schemas-xmlsoap-org:ws:2005/04/discovery</w:To>
            <w:Action e:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</w:Action>
        </e:Header>
        <e:Body>
            <d:Probe>
                <d:Types>dn:NetworkVideoTransmitter</d:Types>
            </d:Probe>
        </e:Body>
    </e:Envelope>'''

    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)
        message_id = uuid.uuid4()
        probe_msg = probe_template.format(message_id).encode()
        sock.sendto(probe_msg, ('239.255.255.250', 3702))
        sock.settimeout(5.0)

        while True:
            try:
                data, addr = sock.recvfrom(65535)
                root = ET.fromstring(data)
                ns = {'d': 'http://schemas.xmlsoap.org/ws/2005/04/discovery',
                      'dn': 'http://www.onvif.org/ver10/network/wsdl'}

                for probe_match in root.findall('.//d:ProbeMatch', ns):
                    xaddrs = probe_match.findtext('d:XAddrs', namespaces=ns)
                    scopes = probe_match.findtext('d:Scopes', namespaces=ns)

                    if scopes:  # Accept any ONVIF camera, not just Hikvision
                        for xaddr in xaddrs.split():
                            if xaddr.startswith('http://'):
                                ip = xaddr.split('/')[2].split(':')[0]
                                if ip.count('.') == 3 and not ip.startswith('fe80'):  # Valid IPv4 check
                                    if ip not in discovered_ips:
                                        discovered_ips.append(ip)
                                        print(f"✅ Found ONVIF camera at {ip}")
            except socket.timeout:
                break
    except Exception as e:
        print(f"⚠️ Discovery error: {str(e)}")
    finally:
        sock.close()

    if not discovered_ips:
        print("⚠️ No ONVIF cameras found via auto-discovery.")
    
    return discovered_ips


def get_camera_capabilities(ip, username, password):
    """
    Get camera capabilities using ONVIF
    
    Args:
        ip (str): Camera IP address
        username (str): Camera username
        password (str): Camera password
        
    Returns:
        dict: Camera capabilities or None if failed
    """
    logger.info(f"Checking capabilities for camera at {ip}")
    
    try:
        # ONVIF GetCapabilities request
        xml_request = f"""<?xml version="1.0" encoding="UTF-8"?>
        <s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
            <s:Header>
                <Security xmlns="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
                    <UsernameToken>
                        <Username>{escape(username)}</Username>
                        <Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">{escape(password)}</Password>
                    </UsernameToken>
                </Security>
            </s:Header>
            <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
                <GetCapabilities xmlns="http://www.onvif.org/ver10/device/wsdl">
                    <Category>All</Category>
                </GetCapabilities>
            </s:Body>
        </s:Envelope>"""
        
        auth = base64.b64encode(f"{username}:{password}".encode()).decode()
        
        # Send request to ONVIF endpoint
        headers = {
            'Content-Type': 'application/soap+xml; charset=utf-8',
            'Authorization': f'Basic {auth}'
        }
        
        response = requests.post(
            f"http://{ip}:80/onvif/device_service",
            data=xml_request,
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            # Parse XML response
            response_dict = xmltodict.parse(response.content)
            return response_dict
        else:
            logger.warning(f"Failed to get capabilities via ONVIF: {response.status_code}")
            return None
            
    except Exception as e:
        logger.error(f"Error getting camera capabilities: {str(e)}")
        return None

def get_video_analytics_capabilities(ip, username, password):
    """
    Try to check if the camera supports video analytics
    
    Args:
        ip (str): Camera IP address
        username (str): Camera username
        password (str): Camera password
        
    Returns:
        bool: True if analytics are supported
    """
    capabilities = get_camera_capabilities(ip, username, password)
    
    if capabilities:
        try:
            # Navigate through the nested dictionary to find analytics capabilities
            envelope = capabilities.get('SOAP-ENV:Envelope', {})
            body = envelope.get('SOAP-ENV:Body', {})
            response = body.get('tds:GetCapabilitiesResponse', {})
            caps = response.get('tds:Capabilities', {})
            
            # Check for analytics capability
            analytics = caps.get('tt:Analytics', {})
            if analytics and analytics.get('tt:XAddr'):
                logger.debug(f"Camera at {ip} supports video analytics")
                return True
        except Exception as e:
            logger.error(f"Error parsing capabilities: {str(e)}")
    
    # Fallback method - test camera performance
    return test_camera_performance(ip, username, password)

def test_camera_performance(ip, username, password):
    """
    Test camera performance to determine optimal settings
    
    Args:
        ip (str): Camera IP address
        username (str): Camera username
        password (str): Camera password
        
    Returns:
        bool: True if high performance camera
    """
    rtsp_url = f"rtsp://{username}:{password}@{ip}:554/Streaming/Channels/101"
    cap = cv2.VideoCapture(rtsp_url)
    
    if not cap.isOpened():
        logger.error(f"Could not open camera at {ip} for testing")
        return False
    
    try:
        # Get camera properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        
        logger.debug(f"Camera at {ip}: FPS={fps}, Resolution={width}x{height}")
        
        # Test frame processing speed
        start_time = time.time()
        frames_processed = 0
        processing_times = []
        
        # Process 30 frames to measure performance
        while frames_processed < 30:
            frame_start = time.time()
            ret, frame = cap.read()
            if not ret:
                break
                
            # Perform a basic operation to simulate processing load
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml').detectMultiScale(gray)
            
            frame_time = time.time() - frame_start
            processing_times.append(frame_time)
            frames_processed += 1
        
        avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
        logger.debug(f"Camera at {ip}: Average processing time per frame: {avg_processing_time:.4f} seconds")
        
        # Determine if this is a high-performance camera
        # High FPS, high resolution, and fast processing time indicate better hardware
        is_high_performance = (fps >= 25 and width >= 1280 and height >= 720 and avg_processing_time < 0.1)
        
        return is_high_performance
        
    except Exception as e:
        logger.error(f"Error during camera performance test: {str(e)}")
        return False
    finally:
        cap.release()

def get_recommended_thresholds(camera_configs):
    """
    Generate recommended threshold settings based on camera capabilities
    
    Args:
        camera_configs (dict): Camera configuration dictionary
        
    Returns:
        dict: Recommended threshold settings
    """
    # Start with default values
    recommended = DEFAULT_THRESHOLDS.copy()
    
    # Track if we have high-performance cameras
    high_performance_cameras = 0
    total_cameras = len(camera_configs)
    
    for camera_type, config in camera_configs.items():
        # Skip if no IP or credentials
        if 'ip' not in config or 'username' not in config:
            continue
            
        ip = config['ip']
        username = config['username']
        password = config['password']
        
        # Check if this camera is high performance
        is_high_performance = get_video_analytics_capabilities(ip, username, password)
        
        if is_high_performance:
            high_performance_cameras += 1
    
    # Calculate the percentage of high-performance cameras
    performance_ratio = high_performance_cameras / total_cameras if total_cameras > 0 else 0
    
    # Adjust settings based on camera capabilities
    if performance_ratio > 0.5:  # If more than half are high performance
        logger.debug("Detected high-performance cameras, optimizing settings")
        recommended.update({
            'PROCESS_EVERY_N_FRAMES': 1,  # Process every frame
            'MIN_FACE_SIZE': 30,  # Detect smaller faces
            'CONFIDENCE_THRESHOLD': 0.90,  # Slightly lower confidence threshold for more detections
            'FRAME_SLEEP_TIME': 0.005,  # Reduced sleep time for faster processing
            'USE_FACE_ENHANCEMENT': True,  # Still enable face enhancement for distance
            'FACE_SCALING_FACTOR': 2.0  # Slightly lower scaling to balance performance
        })
    else:
        logger.debug("Detected standard-performance cameras, using conservative settings")
        recommended.update({
            'PROCESS_EVERY_N_FRAMES': 2,  # Process every third frame
            'CONFIDENCE_THRESHOLD': 0.9,  # Higher confidence threshold for more reliable detections
            'FRAME_SLEEP_TIME': 0.01,  # Increased sleep time to reduce load
            'USE_FACE_ENHANCEMENT': True,  # Still enable face enhancement for distance
            'FACE_SCALING_FACTOR': 1.5  # Slightly lower scaling to balance performance

        })
    
    return recommended

def load_camera_settings():
    """Load camera settings from configuration file"""
    if os.path.exists(CAMERA_CONFIG_FILE):
        try:
            with open(CAMERA_CONFIG_FILE, "r") as file:
                return json.load(file)
        except Exception as e:
            logger.error(f"Error loading camera settings: {str(e)}")
    return None

def save_camera_settings(settings):
    """Save camera settings to configuration file"""
    try:
        with open(CAMERA_CONFIG_FILE, "w") as file:
            json.dump(settings, file, indent=4)
    except Exception as e:
        logger.error(f"Error saving camera settings: {str(e)}")

def apply_thresholds(thresholds):
    """
    Apply threshold settings to global variables
    
    Args:
        thresholds (dict): Threshold settings to apply
    """
    # This function will modify global variables without changing the code
    global SPOOF_THRESHOLD, FRAME_SLEEP_TIME, IDLE_SLEEP_TIME
    global RECOGNITION_THRESHOLD, QUEUE_SIZE, DISPLAY_WIDTH, DISPLAY_HEIGHT
    global PROCESS_EVERY_N_FRAMES, MIN_FACE_SIZE, CONFIDENCE_THRESHOLD
    global USE_FACE_ENHANCEMENT, FACE_SCALING_FACTOR
    
    # Apply each threshold setting to the corresponding global variable
    for key, value in thresholds.items():
        if key in globals():
            globals()[key] = value
            logger.debug(f"Applied setting: {key} = {value}")

def synchronize_thresholds():
    """
    Synchronize thresholds from thresholds.txt to camera_settings.json.
    """
    try:
        # Load thresholds from thresholds.txt
        thresholds_config = read_config('IP_Camera/thresholds.txt')
        
        # Load existing camera settings from camera_settings.json
        if os.path.exists(CAMERA_CONFIG_FILE):
            with open(CAMERA_CONFIG_FILE, "r") as file:
                camera_settings = json.load(file)
        else:
            camera_settings = {}
        
        # Update the thresholds in camera_settings.json
        camera_settings['thresholds'] = thresholds_config
        
        # Save the updated camera settings
        with open(CAMERA_CONFIG_FILE, "w") as file:
            json.dump(camera_settings, file, indent=4)
        
        logger.debug("Thresholds synchronized with camera_settings.json")
    except Exception as e:
        logger.error(f"Error synchronizing thresholds: {str(e)}")

def load_config():
    """Load saved configuration with extended camera type information"""
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as file:
            config = json.load(file)
            # Convert legacy config format if needed
            if config and isinstance(config, dict):
                if 'entry' in config or 'exit' in config:
                    return config
                # Convert old format to new format
                return {'cameras': config}
    return None

def save_config(camera_configs):
    """Save configuration with camera type assignments"""
    with open(CONFIG_FILE, "w") as file:
        json.dump(camera_configs, file, indent=4)

def verify_camera_connection(rtsp_url):
    """Check if the camera feed is accessible"""
    cap = cv2.VideoCapture(rtsp_url)
    if cap.isOpened():
        cap.release()
        return True
    return False

def get_camera_urls():
    """Get RTSP URLs for cameras with automatic configuration reuse and single-camera handling"""
    config = load_config()
    detected_ips = []

    for attempt in range(MAX_RETRIES):
        detected_ips = get_camera_ips()
        if detected_ips:
            break
        print(f"Retrying camera discovery... Attempt {attempt + 1}/{MAX_RETRIES}")
        time.sleep(RETRY_DELAY)

    if not detected_ips:
        print("⚠️ No ONVIF cameras found. Running in single camera mode.")
        detected_ips = [input("Please enter the IP address of the camera: ")]

    camera_configs = {}
    
    # Check if we have existing configurations that match current IPs
    if config and len(detected_ips) > 1:
        # Get all IPs from existing config
        existing_ips = [camera_info['ip'] for camera_info in config.values()]
        
        # If all detected IPs are in existing config, reuse the configuration
        if all(ip in existing_ips for ip in detected_ips):
            logger.debug("Reusing existing camera configuration - IPs match")
            return config

    # Configure new cameras if no matching config exists
    print("\n🎥 Configure cameras:")
    available_types = ['entry', 'exit']
    configured_types = []
    
    # If only one camera is detected, automatically configure it as "Entry"
    if len(detected_ips) == 1:
        print("\n⚠️ Single camera mode - automatically configured as ENTRY camera")
        ip = detected_ips[0]
        
        # Check if we have existing credentials for this IP
        if config and any(cam['ip'] == ip for cam in config.values()):
            existing_config = next(cam for cam in config.values() if cam['ip'] == ip)
            username = existing_config['username']
            password = existing_config['password']
            print(f"Using existing credentials for {ip}")
        else:
            username = input(f"Enter Camera Username (default: admin): ").strip() or "admin"
            password = getpass(f"Enter Camera Password: ").strip()
        
        rtsp_url = f"rtsp://{username}:{password}@{ip}:554/Streaming/Channels/101"
        
        camera_configs['entry'] = {
            "username": username,
            "password": password,
            "rtsp_url": rtsp_url,
            "ip": ip
        }
        
        # Return the temporary configuration without saving
        return camera_configs
    
    # If multiple cameras are detected, proceed with normal configuration
    for ip in detected_ips:
        print(f"\nConfiguring camera at {ip}")
        
        # Show available camera types
        print("Available types:", ", ".join(t.upper() for t in available_types if t not in configured_types))
        
        while True:
            camera_type = input("Select camera type (entry/exit): ").lower()
            if camera_type in available_types and camera_type not in configured_types:
                break
            print("Invalid selection. Please choose from available types.")
        
        configured_types.append(camera_type)
        
        # Check if we have existing credentials for this IP
        if config and any(cam['ip'] == ip for cam in config.values()):
            existing_config = next(cam for cam in config.values() if cam['ip'] == ip)
            username = existing_config['username']
            password = existing_config['password']
            print(f"Using existing credentials for {ip}")
        else:
            username = input(f"Enter Camera Username (default: admin): ").strip() or "admin"
            password = getpass(f"Enter Camera Password: ").strip()
        
        rtsp_url = f"rtsp://{username}:{password}@{ip}:554/Streaming/Channels/101"
        
        camera_configs[camera_type] = {
            "username": username,
            "password": password,
            "rtsp_url": rtsp_url,
            "ip": ip
        }

    # Save configuration only if multiple cameras are detected
    if len(detected_ips) > 1:
        save_config(camera_configs)
    
    return camera_configs

def capture_frames(cap, camera_type):
    """Optimized frame capture function with exit handling"""
    global exit_flag
    frame_count = 0
    while not exit_flag:
        ret, frame = cap.read()
        if not ret:
            logger.error(f"Error: Could not read frame from {camera_type} camera")
            time.sleep(1)  # Wait before retrying
            continue
            
        # Resize for display while maintaining aspect ratio
        frame = cv2.resize(frame, (DISPLAY_WIDTH, DISPLAY_HEIGHT))
        
        # Only process every Nth frame
        if frame_count % PROCESS_EVERY_N_FRAMES == 0:
            if not frame_queues[camera_type].full():
                frame_queues[camera_type].put(frame)
        
        frame_count += 1
        time.sleep(FRAME_SLEEP_TIME)

def process_frames(camera_type):
    """Optimized frame processing function with exit handling and spoof detection"""
    global exit_flag
    while not exit_flag:
        if not frame_queues[camera_type].empty():
            frame = frame_queues[camera_type].get()
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            try:
                # Detect faces with confidence scores
                boxes, probs = mtcnn.detect(rgb_frame)
                
                if boxes is not None and len(boxes) > 0:
                    # Filter faces by detection confidence
                    confident_faces = [(box, prob) for box, prob in zip(boxes, probs) if prob > CONFIDENCE_THRESHOLD]
                    
                    if confident_faces:
                        logger.info(f"[{camera_type.upper()}] Detected {len(confident_faces)} confident face(s)")
                        
                        for i, (box, prob) in enumerate(confident_faces):
                            if exit_flag:  # Check exit flag in long loops
                                break
                                
                            try:
                                left, top, right, bottom = map(int, box)
                                
                                # Ensure coordinates are within bounds
                                height, width = rgb_frame.shape[:2]
                                left = max(0, left)
                                top = max(0, top)
                                right = min(width, right)
                                bottom = min(height, bottom)
                                
                                if right - left <= 0 or bottom - top <= 0:
                                    continue

                                face_img = rgb_frame[top:bottom, left:right]
                                enhanced_face = enhance_face_image(face_img)
                                face_tensor = mtcnn(Image.fromarray(enhanced_face))

                                if face_tensor is None:
                                    continue
                                
                                # Move tensors to GPU if available
                                face_tensor = face_tensor.unsqueeze(0).to(device)
                                with torch.no_grad():  # Disable gradient computation for inference
                                    face_embedding = resnet(face_tensor).cpu().numpy()[0]
                                
                                name, distance, student_id = recognize_face(face_embedding)
                                
                                # Save image for spoof detection
                                image_filename = os.path.join(IMAGE_SAVE_DIR, f"processed_face_{i + 1}.jpg")
                                cv2.imwrite(image_filename, cv2.cvtColor(face_img, cv2.COLOR_RGB2BGR))
                                
                                # Perform spoof detection
                                spoof_result, score, _ = test(image_filename, "Anti_Spoof/resources/anti_spoof_models", device)
                                
                                if student_id is not None:
                                    person_identifier = student_id
                                else:
                                    person_identifier = name

                                liveness_status, smoothed_score = update_liveness_status(person_identifier, spoof_result, score)
                                
                                # Log the recognition result (original format)
                                logger.info(
                                    f"[{camera_type.upper()}] Recognized {name} "
                                    f"(ID: {student_id}, Confidence: {(1-distance):.3f}, "
                                    f"Detection Score: {prob:.3f}, Liveness: {liveness_status}, Spoof Score: {smoothed_score:.3f})"
                                )
                                
                                # Track entry/exit times ONLY for "Live" recognitions and known persons
                                if liveness_status == "Live" and name != "Unknown":
                                    current_time = datetime.now()
                                    if camera_type == 'entry':
                                        if person_identifier not in person_time_tracker:
                                            person_time_tracker[person_identifier] = {'entries': [], 'exits': []}
                                        
                                        # Check if the last entry was within the time threshold
                                        if person_time_tracker[person_identifier]['entries']:
                                            last_entry_time = person_time_tracker[person_identifier]['entries'][-1]['end_time']
                                            if (current_time - last_entry_time).total_seconds() <= TIME_THRESHOLD_FOR_GROUPING:
                                                # Update the end time of the last entry
                                                person_time_tracker[person_identifier]['entries'][-1]['end_time'] = current_time
                                            else:
                                                # Add a new entry
                                                person_time_tracker[person_identifier]['entries'].append({
                                                    'start_time': current_time,
                                                    'end_time': current_time
                                                })
                                        else:
                                            # Add the first entry
                                            person_time_tracker[person_identifier]['entries'].append({
                                                'start_time': current_time,
                                                'end_time': current_time
                                            })
                                    
                                    elif camera_type == 'exit':
                                        if person_identifier not in person_time_tracker:
                                            person_time_tracker[person_identifier] = {'entries': [], 'exits': []}
                                        
                                        # Check if the last exit was within the time threshold
                                        if person_time_tracker[person_identifier]['exits']:
                                            last_exit_time = person_time_tracker[person_identifier]['exits'][-1]['end_time']
                                            if (current_time - last_exit_time).total_seconds() <= TIME_THRESHOLD_FOR_GROUPING:
                                                # Update the end time of the last exit
                                                person_time_tracker[person_identifier]['exits'][-1]['end_time'] = current_time
                                            else:
                                                # Add a new exit
                                                person_time_tracker[person_identifier]['exits'].append({
                                                    'start_time': current_time,
                                                    'end_time': current_time
                                                })
                                        else:
                                            # Add the first exit
                                            person_time_tracker[person_identifier]['exits'].append({
                                                'start_time': current_time,
                                                'end_time': current_time
                                            })
                                
                                # Only process high-confidence recognitions
                                if distance < RECOGNITION_THRESHOLD:
                                    result = {
                                        'frame': frame.copy(),
                                        'bbox': (left, top, right, bottom),
                                        'name': name,
                                        'student_id': student_id,
                                        'distance': distance,
                                        'detection_confidence': prob,
                                        'spoof_status': liveness_status,
                                        'spoof_score': smoothed_score
                                    }
                                    
                                    if not result_queues[camera_type].full():
                                        result_queues[camera_type].put(result)
                                        
                            except Exception as e:
                                logger.error(f"[{camera_type.upper()}] Face processing error: {str(e)}")
                                continue
                            
            except Exception as e:
                logger.error(f"[{camera_type.upper()}] Frame processing error: {str(e)}")
                continue
            
            time.sleep(FRAME_SLEEP_TIME)

def display_results(camera_type):
    """Optimized display function with exit handling and spoof status"""
    global exit_flag
    window_name = f"Face Recognition - {camera_type.upper()}"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, DISPLAY_WIDTH, DISPLAY_HEIGHT)
    
    while not exit_flag:
        try:
            if not result_queues[camera_type].empty():
                result = result_queues[camera_type].get()
                frame = result['frame']
                left, top, right, bottom = result['bbox']
                name = result['name']
                student_id = result['student_id']
                distance = result['distance']
                detection_confidence = result.get('detection_confidence', 1.0)
                spoof_status = result.get('spoof_status', 'Unknown')
                spoof_score = result.get('spoof_score', 0.0)
                
                # Draw face box
                color = (0, 255, 0) if spoof_status == "Real" else (0, 0, 255)  # Green for real, red for fake
                cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
                
                # Display text with confidence scores and spoof status
                confidence_text = f"Match: {(1-distance):.2f} Det: {detection_confidence:.2f} Spoof: {spoof_status} ({spoof_score:.2f})"
                display_text = f"{name} ({student_id})" if student_id else name
                
                # Add background to text for better visibility
                cv2.rectangle(frame, (left, top - 80), (left + 400, top), (0, 0, 0), -1)
                cv2.putText(frame, display_text, (left, top - 50),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
                cv2.putText(frame, confidence_text, (left, top - 20),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                
                cv2.imshow(window_name, frame)
            
            # Check for quit in this window and set global exit flag if needed
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                logger.debug(f"Quit signal received from {camera_type} window")
                exit_flag = True
                break
                
        except Exception as e:
            logger.error(f"[{camera_type.upper()}] Display error: {str(e)}")
            continue
            
        time.sleep(FRAME_SLEEP_TIME)

def recognize_face(embedding):
    """
    Recognizes a face using stored embeddings with Student ID support.
    
    Args:
        embedding (numpy.ndarray): Face embedding vector to compare against database
        
    Returns:
        tuple: (name, distance, student_id) where:
            - name (str): Recognized person's name or "Unknown"
            - distance (float): Euclidean distance to closest match
            - student_id (str): Student ID if available, None otherwise
    """
    try:
        db = pd.read_csv(DATABASE_FILE)
        if db.empty:
            logger.warning("Face database is empty")
            return ("Unknown", 1.0, None)
            
        # Get name and student ID columns
        names = db['Name'].values
        student_ids = db['Student_ID'].values if 'Student_ID' in db.columns else [None] * len(names)
        
        # Get embedding columns (exclude Name, Student_ID columns)
        embedding_cols = [col for col in db.columns if col.startswith('v')]
        embeddings = db[embedding_cols].values
        
        # Calculate Euclidean distances
        distances = np.linalg.norm(embeddings - embedding, axis=1)
        min_dist = np.min(distances)
        min_index = np.argmin(distances)
        
        if min_dist < RECOGNITION_THRESHOLD:
            return (names[min_index], min_dist, student_ids[min_index])
        return ("Unknown", min_dist, None)
        
    except Exception as e:
        logger.error(f"Error in face recognition: {str(e)}")
        return ("Error", 1.0, None)
    
def enhance_face_image(face_img):
    """
    Enhance a face image to improve recognition at distance
    
    Args:
        face_img: RGB face image (numpy array)
        
    Returns:
        Enhanced face image
    """
    if not USE_FACE_ENHANCEMENT:
        return face_img
        
    try:
        # Convert numpy array to PIL Image
        pil_img = Image.fromarray(face_img)
        
        # Resize the image to make the face larger (helps with distant faces)
        original_size = pil_img.size
        new_size = (int(original_size[0] * FACE_SCALING_FACTOR), 
                   int(original_size[1] * FACE_SCALING_FACTOR))
        pil_img = pil_img.resize(new_size, Image.LANCZOS)
        
        # Enhance contrast slightly
        enhancer = ImageEnhance.Contrast(pil_img)
        pil_img = enhancer.enhance(1.2)
        
        # Enhance sharpness
        enhancer = ImageEnhance.Sharpness(pil_img)
        pil_img = enhancer.enhance(1.5)
        
        # Convert back to numpy array
        return np.array(pil_img)
    except Exception as e:
        logger.error(f"Error enhancing face: {str(e)}")
        return face_img

spoof_detection_history = {}
def update_liveness_status(person_id, spoof_result, spoof_score):
    """
    Track liveness detection results for a person to improve consistency
    
    Args:
        person_id (str): ID of the recognized person
        spoof_result (int): Current spoof detection result (0=live, 1=spoof)
        spoof_score (float): Confidence score of the spoof detection
        
    Returns:
        tuple: (liveness_status, smoothed_score) containing consistent liveness result
    """
    global spoof_detection_history
    
    # Initialize history for this person if not exists
    if person_id not in spoof_detection_history:
        spoof_detection_history[person_id] = {
            'results': [],
            'scores': [],
            'last_status': None,
            'consecutive_count': 0
        }
    
    history = spoof_detection_history[person_id]
    
    # Add current result to history
    is_live = spoof_result <= 1  # Convert to boolean
    history['results'].append(is_live)
    history['scores'].append(spoof_score)
    
    # Keep only the most recent results
    if len(history['results']) > SPOOF_CONSECUTIVE_CHECKS:
        history['results'].pop(0)
    
    # Keep only the most recent scores
    if len(history['scores']) > SPOOF_SCORE_BUFFER_SIZE:
        history['scores'].pop(0)
    
    # Calculate the average spoof score
    recent_weight = 2  # Give recent frames more weight
    weights = [recent_weight if i == len(history['scores']) - 1 else 1 for i in range(len(history['scores']))]
    avg_score = sum(s * w for s, w in zip(history['scores'], weights)) / sum(weights)

    
    # Determine liveness status based on consistent results
    if all(history['results']):
        # All results indicate "live"
        current_status = "Live"
        history['consecutive_count'] = history['consecutive_count'] + 1 if history['last_status'] == "Live" else 1
    elif not any(history['results']):
        # All results indicate "spoof"
        current_status = "Spoof"
        history['consecutive_count'] = history['consecutive_count'] + 1 if history['last_status'] == "Spoof" else 1
    else:
        # Mixed results, maintain previous status if we have one
        if history['last_status'] is not None:
            current_status = history['last_status']
            history['consecutive_count'] += 1
        else:
            # Default to live if majority of results are live (benefit of doubt)
            live_count = sum(1 for r in history['results'] if r)
            current_status = "Live" if live_count > len(history['results']) / 2 else "Spoof"
            history['consecutive_count'] = 1
    
    # Store the current status
    history['last_status'] = current_status
    
    return current_status, avg_score

def calculate_time_differences():
    """Calculate the total time spent in the class for each person"""
    try:
        # Load the face database to map IDs to names
        db = pd.read_csv(DATABASE_FILE)
    except Exception as e:
        logger.error(f"Error loading face database: {str(e)}")
        return

    for person_identifier, logs in person_time_tracker.items():
        entries = logs['entries']
        exits = logs['exits']
        
        # Ensure that the number of entries and exits are balanced
        min_length = min(len(entries), len(exits))
        if min_length == 0:
            continue
        
        total_time_spent = timedelta()  # Initialize total time spent to zero
        
        # Calculate time differences for each entry-exit pair and sum them up
        for i in range(min_length):
            entry_time = entries[i]['start_time']  # Use the start time of the entry group
            exit_time = exits[i]['end_time']      # Use the end time of the exit group
            time_diff = exit_time - entry_time
            total_time_spent += time_diff
        
        # Get the person's name from the database
        person_name = "Unknown"
        if person_identifier in db['Student_ID'].values:
            person_name = db.loc[db['Student_ID'] == person_identifier, 'Name'].values[0]
        elif person_identifier in db['Name'].values:
            person_name = person_identifier
        
        # Log the total time spent for the person
        logger.info(f"[TOTAL TIME] {person_name} (ID: {person_identifier}) spent {total_time_spent} in the class")


def main():
    """Main function with single-camera handling and proper exit handling"""
    global exit_flag
    exit_flag = False
    
    logging.info("Started face recognition process")
    print("\nIP-Camera Face Recognition!")

    # Synchronize thresholds from thresholds.txt to camera_settings.json
    synchronize_thresholds()

    if not os.path.exists(DATABASE_FILE):
        pd.DataFrame(columns=['Name', 'Student_ID'] + [f'v{i}' for i in range(512)]).to_csv(DATABASE_FILE, index=False)

    # Get camera configurations with single-camera handling
    camera_configs = get_camera_urls()
    
    # Handle camera optimization settings
    camera_settings = load_camera_settings()
    camera_ips = [config['ip'] for config in camera_configs.values()]
    
    # Determine if we should use saved settings, detect new settings, or use defaults
    use_saved_settings = False
    use_optimized_settings = False
    
    if camera_settings and 'ips' in camera_settings and 'thresholds' in camera_settings:
        # Check if all current IPs match the saved configuration
        if all(ip in camera_settings['ips'] for ip in camera_ips):
            logger.debug("Found matching camera settings from previous run")
            use_saved_settings = True
    
    if use_saved_settings:
        # Apply saved settings without prompting
        logger.debug("Using previously saved camera optimization settings")
        apply_thresholds(camera_settings['thresholds'])
    else:
        # Generate recommendations and ask user
        print("\n🔍 Analyzing camera capabilities...")
        recommended_thresholds = get_recommended_thresholds(camera_configs)
        
        print("\nCamera analysis complete.")
        print("Recommended optimization settings available based on your camera capabilities.")
        use_optimized = input("Would you like to use the optimized settings? (y/n): ").lower().strip() == 'y'
        
        if use_optimized:
            logger.debug("Using recommended optimization settings")
            apply_thresholds(recommended_thresholds)
            
            # Save settings for future use (only if multiple cameras are detected)
            if len(camera_ips) > 1:
                camera_settings = {
                    'ips': camera_ips,
                    'thresholds': recommended_thresholds
                }
                save_camera_settings(camera_settings)
        else:
            logger.debug("Using default hardcoded settings")
            # No need to apply defaults as they're already in the code
    
    # Initialize cameras
    cameras = {}
    for camera_type, config in camera_configs.items():
        rtsp_url = config['rtsp_url']
        if not verify_camera_connection(rtsp_url):
            logger.error(f"Could not connect to {camera_type.upper()} camera at {config['ip']}")
            continue
            
        logger.debug(f"Connecting to {camera_type.upper()} camera at {config['ip']}")
        cap = cv2.VideoCapture(rtsp_url)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, DISPLAY_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, DISPLAY_HEIGHT)
        
        if cap.isOpened():
            cameras[camera_type] = cap
            logger.debug(f"Successfully connected to {camera_type.upper()} camera")
        else:
            logger.error(f"Failed to open {camera_type.upper()} camera feed")

    if not cameras:
        logger.error("No cameras could be initialized. Exiting.")
        sys.exit(1)

    print(f"\n✅ Successfully initialized {len(cameras)} camera(s)")
    
    # Display the current settings
    print("\nActive Settings:")
    print(f"- Processing every {PROCESS_EVERY_N_FRAMES} frames")
    print(f"- Recognition threshold: {RECOGNITION_THRESHOLD}")
    print(f"- Minimum face size: {MIN_FACE_SIZE} pixels")
    print(f"- Face detection confidence: {CONFIDENCE_THRESHOLD}")
    
    print("\nPress 'Q' in ANY window to quit the application.\n")

    # Create and start threads for each camera
    threads = []
    
    for camera_type, cap in cameras.items():
        # Create threads for each camera
        capture_thread = threading.Thread(
            target=capture_frames,
            args=(cap, camera_type),
            name=f"{camera_type}_capture",
            daemon=True
        )
        
        process_thread = threading.Thread(
            target=process_frames,
            args=(camera_type,),
            name=f"{camera_type}_process",
            daemon=True
        )
        
        display_thread = threading.Thread(
            target=display_results,
            args=(camera_type,),
            name=f"{camera_type}_display",
            daemon=True
        )
        
        threads.extend([capture_thread, process_thread, display_thread])
    
    # Start all threads
    for thread in threads:
        thread.start()
        logger.debug(f"Started thread: {thread.name}")

    # Wait for threads to complete
    try:
        while all(thread.is_alive() for thread in threads):
            time.sleep(0.1)
            
            # Check all windows for quit key
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                logger.debug("Quit signal received")
                exit_flag = True  # Set global exit flag
                break
                
    except KeyboardInterrupt:
        logger.debug("Keyboard interrupt received")
        exit_flag = True
    except Exception as e:
        logger.error(f"Error in main loop: {str(e)}")
        exit_flag = True
    finally:
        # Ensure exit flag is set
        exit_flag = True
        
        print("\nCleaning up...")
        for camera_type, cap in cameras.items():
            cap.release()
            logger.debug(f"Released {camera_type} camera")
        
        cv2.destroyAllWindows()
        
        # Calculate time differences between entry and exit events
        calculate_time_differences()
        
        logger.info("Face recognition process ended")
        print("Cleanup complete. Application terminated")

if __name__ == "__main__":
    main()