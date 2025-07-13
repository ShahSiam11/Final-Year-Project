# Developed and maintained by Shah Siam, 2025

import os
import json
import sys
import argparse
import socket
import uuid
import xml.etree.ElementTree as ET
import requests
import xmltodict
from xml.sax.saxutils import escape
import time
import base64
from getpass import getpass
import logging

# Constants
CONFIG_FILE = "camera_config.txt"
CAMERA_CONFIG_FILE = "camera_settings.json"
MAX_RETRIES = 5
RETRY_DELAY = 5

# Default thresholds that match the main application
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
    'CONFIDENCE_THRESHOLD': 0.80
}

# Setup logging
logging.basicConfig(filename='reconfig.log', level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('camera_reconfig')
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter('%(levelname)s - %(message)s')
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

def get_camera_ips():
    """Discover Hikvision cameras using ONVIF WS-Discovery"""
    print("🔍 Searching for Hikvision cameras via ONVIF discovery...")
    discovered_ips = []
    probe_template = '''<?xml version="1.0" encoding="UTF-8"?>
    <e:Envelope xmlns:e="http://www.w3.org/2003/05/soap-envelope"
                xmlns:w="http://schemas.xmlsoap.org/ws/2004/08/addressing"
                xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery">
        <e:Header>
            <w:MessageID>uuid:{}</w:MessageID>
            <w:To e:mustUnderstand="true">urn:schemas-xmlsoap-org:ws:2005:04:discovery</w:To>
            <w:Action e:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2005:04/discovery/Probe</w:Action>
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

                    if scopes and 'hikvision' in scopes.lower():
                        for xaddr in xaddrs.split():
                            if xaddr.startswith('http://'):
                                # Extract IP and ensure it's IPv4
                                ip = xaddr.split('/')[2].split(':')[0]
                                # Check if it's a valid IPv4 address
                                if ip.count('.') == 3 and not ip.startswith('fe80'):
                                    if ip not in discovered_ips:
                                        discovered_ips.append(ip)
                                        print(f"✅ Found Hikvision camera at {ip}")
            except socket.timeout:
                break
    except Exception as e:
        print(f"⚠️ Discovery error: {str(e)}")
    finally:
        sock.close()

    if not discovered_ips:
        print("⚠️ No IPv4 cameras found via ONVIF discovery.")
    
    return discovered_ips

def load_config():
    """Load saved configuration"""
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as file:
            config = json.load(file)
            # Convert legacy config format if needed
            if config and isinstance(config, dict):
                if 'entry' in config or 'exit' in config:
                    return config
                # Convert old format to new format
                return {'cameras': config}
    return {}

def save_config(camera_configs):
    """Save configuration with camera type assignments"""
    with open(CONFIG_FILE, "w") as file:
        json.dump(camera_configs, file, indent=4)
        print(f"✅ Camera configuration saved to {CONFIG_FILE}")

def load_threshold_settings():
    """Load threshold settings from configuration file"""
    if os.path.exists(CAMERA_CONFIG_FILE):
        try:
            with open(CAMERA_CONFIG_FILE, "r") as file:
                settings = json.load(file)
                return settings.get('thresholds', DEFAULT_THRESHOLDS)
        except Exception as e:
            logger.error(f"Error loading threshold settings: {str(e)}")
    return DEFAULT_THRESHOLDS

def save_threshold_settings(thresholds, camera_ips):
    """Save threshold settings to configuration file"""
    settings = {
        'ips': camera_ips,
        'thresholds': thresholds
    }
    
    try:
        with open(CAMERA_CONFIG_FILE, "w") as file:
            json.dump(settings, file, indent=4)
            print(f"✅ Threshold settings saved to {CAMERA_CONFIG_FILE}")
    except Exception as e:
        logger.error(f"Error saving threshold settings: {str(e)}")

def get_camera_capabilities(ip, username, password):
    """Get camera capabilities using ONVIF"""
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

def verify_camera_connection(rtsp_url):
    """Check if the camera feed is accessible"""
    import cv2
    cap = cv2.VideoCapture(rtsp_url)
    if cap.isOpened():
        print(f"✅ Successfully connected to camera at {rtsp_url}")
        cap.release()
        return True
    print(f"❌ Could not connect to camera at {rtsp_url}")
    return False

def configure_cameras():
    """Configure cameras with type assignment"""
    existing_config = load_config()
    detected_ips = []

    for attempt in range(MAX_RETRIES):
        detected_ips = get_camera_ips()
        if detected_ips:
            break
        print(f"Retrying camera discovery... Attempt {attempt + 1}/{MAX_RETRIES}")
        time.sleep(RETRY_DELAY)

    if not detected_ips:
        manual_mode = input("⚠️ No Hikvision cameras found. Enter manual mode? (y/n): ").lower() == 'y'
        if manual_mode:
            detected_ips = [input("Please enter the IP address of the camera: ")]
        else:
            print("Exiting configuration without changes.")
            return None

    camera_configs = {}
    
    # Display existing config if available
    if existing_config:
        print("\nCurrent camera configuration:")
        for cam_type, config in existing_config.items():
            print(f"- {cam_type.upper()}: {config['ip']} (User: {config['username']})")
    
    print("\n🎥 Configure cameras:")
    available_types = ['entry', 'exit']
    configured_types = []
    
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
        if existing_config and any(cam_info.get('ip') == ip for cam_type, cam_info in existing_config.items()):
            existing_cam_type = next(cam_type for cam_type, cam_info in existing_config.items() if cam_info.get('ip') == ip)
            existing_cam_info = existing_config[existing_cam_type]
            
            reuse = input(f"Reuse existing credentials for {ip}? (y/n): ").lower() == 'y'
            if reuse:
                username = existing_cam_info['username']
                password = existing_cam_info['password']
                print(f"Using existing credentials for {ip}")
            else:
                username = input(f"Enter Camera Username (default: admin): ").strip() or "admin"
                password = getpass(f"Enter Camera Password: ").strip()
        else:
            username = input(f"Enter Camera Username (default: admin): ").strip() or "admin"
            password = getpass(f"Enter Camera Password: ").strip()
        
        rtsp_url = f"rtsp://{username}:{password}@{ip}:554/Streaming/Channels/101"
        
        # Verify connection
        if not verify_camera_connection(rtsp_url):
            retry = input("Connection failed. Retry with different credentials? (y/n): ").lower() == 'y'
            if retry:
                username = input(f"Enter Camera Username (default: admin): ").strip() or "admin"
                password = getpass(f"Enter Camera Password: ").strip()
                rtsp_url = f"rtsp://{username}:{password}@{ip}:554/Streaming/Channels/101"
                
                if not verify_camera_connection(rtsp_url):
                    print(f"Could not connect to camera at {ip}. Skipping.")
                    continue
        
        camera_configs[camera_type] = {
            "username": username,
            "password": password,
            "rtsp_url": rtsp_url,
            "ip": ip
        }

        # If we only have one camera, it must be entry
        if len(detected_ips) == 1:
            print("\n⚠️ Single camera mode - automatically configured as ENTRY camera")
            camera_configs['entry'] = camera_configs[camera_type]
            break

    # Confirm changes
    if camera_configs:
        print("\nNew camera configuration:")
        for cam_type, config in camera_configs.items():
            print(f"- {cam_type.upper()}: {config['ip']} (User: {config['username']})")
        
        save = input("\nSave this configuration? (y/n): ").lower() == 'y'
        if save:
            save_config(camera_configs)
            return camera_configs
    
    return None

def configure_thresholds():
    """Configure optimization thresholds"""
    # Load existing thresholds
    existing_thresholds = load_threshold_settings()
    
    print("\n🔧 Current threshold settings:")
    for key, value in existing_thresholds.items():
        print(f"- {key}: {value}")
    
    # Ask user which threshold to modify
    print("\nAvailable thresholds to modify:")
    threshold_keys = list(existing_thresholds.keys())
    for i, key in enumerate(threshold_keys):
        print(f"{i+1}. {key}")
    
    while True:
        try:
            selection = input("\nEnter number of threshold to modify (or 'all' for all, 'q' to quit): ")
            
            if selection.lower() == 'q':
                return None
                
            elif selection.lower() == 'all':
                # Modify all thresholds
                new_thresholds = {}
                for key in threshold_keys:
                    current = existing_thresholds[key]
                    try:
                        new_value = input(f"Enter new value for {key} (current: {current}, press Enter to keep): ")
                        if new_value.strip():
                            # Convert to appropriate type based on current value
                            if isinstance(current, int):
                                new_thresholds[key] = int(new_value)
                            elif isinstance(current, float):
                                new_thresholds[key] = float(new_value)
                            else:
                                new_thresholds[key] = new_value
                        else:
                            new_thresholds[key] = current
                    except ValueError:
                        print(f"Invalid value. Keeping current value for {key}.")
                        new_thresholds[key] = current
                
                # Confirm changes
                print("\nNew threshold settings:")
                for key, value in new_thresholds.items():
                    print(f"- {key}: {value}")
                
                save = input("\nSave these settings? (y/n): ").lower() == 'y'
                if save:
                    # Get camera IPs from config
                    config = load_config()
                    camera_ips = [config[cam_type]['ip'] for cam_type in config if 'ip' in config[cam_type]]
                    save_threshold_settings(new_thresholds, camera_ips)
                    return new_thresholds
                else:
                    return None
            
            else:
                # Modify single threshold
                idx = int(selection) - 1
                if 0 <= idx < len(threshold_keys):
                    key = threshold_keys[idx]
                    current = existing_thresholds[key]
                    try:
                        new_value = input(f"Enter new value for {key} (current: {current}): ")
                        
                        # Convert to appropriate type based on current value
                        if isinstance(current, int):
                            new_value = int(new_value)
                        elif isinstance(current, float):
                            new_value = float(new_value)
                        
                        # Create new thresholds dictionary with the updated value
                        new_thresholds = existing_thresholds.copy()
                        new_thresholds[key] = new_value
                        
                        # Confirm change
                        print(f"\nChanged {key}: {current} -> {new_value}")
                        save = input("Save this change? (y/n): ").lower() == 'y'
                        
                        if save:
                            # Get camera IPs from config
                            config = load_config()
                            camera_ips = [config[cam_type]['ip'] for cam_type in config if 'ip' in config[cam_type]]
                            save_threshold_settings(new_thresholds, camera_ips)
                            return new_thresholds
                        else:
                            return None
                    except ValueError:
                        print("Invalid value. Please try again.")
                else:
                    print("Invalid selection. Please try again.")
        except ValueError:
            print("Invalid input. Please enter a number or 'q' to quit.")

def reset_to_defaults():
    """Reset all settings to defaults"""
    confirm = input("⚠️ This will reset all threshold settings to defaults. Continue? (y/n): ").lower() == 'y'
    if confirm:
        # Get camera IPs from config
        config = load_config()
        camera_ips = [config[cam_type]['ip'] for cam_type in config if 'ip' in config[cam_type]]
        save_threshold_settings(DEFAULT_THRESHOLDS, camera_ips)
        print("✅ All threshold settings have been reset to defaults.")
        return DEFAULT_THRESHOLDS
    return None

def get_recommended_thresholds(camera_configs):
    """Generate recommended threshold settings based on camera capabilities"""
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
        
        # Get camera capabilities
        capabilities = get_camera_capabilities(ip, username, password)
        is_high_performance = False
        
        # Check if this is a high-performance camera based on capabilities
        if capabilities:
            try:
                # Check for analytics capability
                envelope = capabilities.get('SOAP-ENV:Envelope', {})
                body = envelope.get('SOAP-ENV:Body', {})
                response = body.get('tds:GetCapabilitiesResponse', {})
                caps = response.get('tds:Capabilities', {})
                analytics = caps.get('tt:Analytics', {})
                
                if analytics and analytics.get('tt:XAddr'):
                    logger.info(f"Camera at {ip} supports video analytics")
                    is_high_performance = True
            except Exception as e:
                logger.error(f"Error parsing capabilities: {str(e)}")
        
        if is_high_performance:
            high_performance_cameras += 1
    
    # Calculate the percentage of high-performance cameras
    performance_ratio = high_performance_cameras / total_cameras if total_cameras > 0 else 0
    
    # Adjust settings based on camera capabilities
    if performance_ratio > 0.5:  # If more than half are high performance
        print("✨ Detected high-performance cameras, optimizing settings")
        recommended.update({
            'PROCESS_EVERY_N_FRAMES': 1,  # Process every frame
            'MIN_FACE_SIZE': 60,  # Detect smaller faces
            'CONFIDENCE_THRESHOLD': 0.95,  # Slightly lower confidence threshold for more detections
            'FRAME_SLEEP_TIME': 0.005  # Reduced sleep time for faster processing
        })
    else:
        print("🔄 Detected standard-performance cameras, using conservative settings")
        recommended.update({
            'PROCESS_EVERY_N_FRAMES': 3,  # Process every third frame
            'CONFIDENCE_THRESHOLD': 0.99,  # Higher confidence threshold for more reliable detections
            'FRAME_SLEEP_TIME': 0.02  # Increased sleep time to reduce load
        })
    
    return recommended

def generate_recommendations():
    """Analyze cameras and generate recommended threshold settings"""
    # Load current camera config
    camera_configs = load_config()
    
    if not camera_configs:
        print("❌ No camera configuration found. Please configure cameras first.")
        return None
    
    print("\n🔍 Analyzing camera capabilities...")
    recommended_thresholds = get_recommended_thresholds(camera_configs)
    
    print("\nRecommended threshold settings:")
    for key, value in recommended_thresholds.items():
        print(f"- {key}: {value}")
    
    apply = input("\nApply these recommended settings? (y/n): ").lower() == 'y'
    if apply:
        # Get camera IPs
        camera_ips = [config['ip'] for config in camera_configs.values()]
        save_threshold_settings(recommended_thresholds, camera_ips)
        return recommended_thresholds
    
    return None

def main():
    """Main function with menu interface"""
    parser = argparse.ArgumentParser(description="Camera and Threshold Configuration Tool")
    parser.add_argument('--cameras', action='store_true', help='Configure cameras only')
    parser.add_argument('--thresholds', action='store_true', help='Configure thresholds only')
    parser.add_argument('--recommend', action='store_true', help='Generate and apply recommended settings')
    parser.add_argument('--reset', action='store_true', help='Reset to default settings')
    
    args = parser.parse_args()
    
    print("\n== Camera and Threshold Configuration Tool ==\n")
    
    # If arguments provided, perform specific action
    if args.cameras:
        configure_cameras()
        return
    elif args.thresholds:
        configure_thresholds()
        return
    elif args.recommend:
        generate_recommendations()
        return
    elif args.reset:
        reset_to_defaults()
        return
    
    # No arguments, show menu
    while True:
        print("\nConfiguration Menu:")
        print("1. Configure cameras")
        print("2. Configure threshold settings")
        print("3. Generate recommended settings")
        print("4. Reset to default settings")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ")
        
        if choice == '1':
            configure_cameras()
        elif choice == '2':
            configure_thresholds()
        elif choice == '3':
            generate_recommendations()
        elif choice == '4':
            reset_to_defaults()
        elif choice == '5':
            print("Exiting configuration tool.")
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
    except Exception as e:
        print(f"\nAn error occurred: {str(e)}")
        logger.error(f"Unhandled exception: {str(e)}")
        sys.exit(1)