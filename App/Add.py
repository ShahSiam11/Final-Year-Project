# Copyright (c) 2025 Ahsan Latif (@GittyCandy)  
# All Rights Reserved.  
#  
# Unauthorized access, use, reproduction, modification, distribution,  
# or creation of derivative works based on this code is strictly prohibited  
# without the prior explicit written permission of the owner.  
#  
# Violators may be subject to legal action.  

import cv2
import torch
import os
import sys
import re
import pandas as pd
import numpy as np
from facenet_pytorch import InceptionResnetV1, MTCNN
from PIL import Image
import logging

# Configure logging
LOG_FILE = "face_recognition.log"
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# Initialize models
mtcnn = MTCNN(
    image_size=160, margin=0, min_face_size=20,
    device=torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
)
resnet = InceptionResnetV1(pretrained='vggface2').eval()
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')

# Directories and database
FACES_DIR = 'Faces'
IMAGE_SAVE_DIR = os.path.join(FACES_DIR, 'Temp_images')
os.makedirs(FACES_DIR, exist_ok=True)
os.makedirs(IMAGE_SAVE_DIR, exist_ok=True)

DATABASE_FILE = os.path.join(FACES_DIR, 'Face_database.csv')
if not os.path.exists(DATABASE_FILE):
    pd.DataFrame(columns=['Name'] + [f'v{i}' for i in range(512)]).to_csv(DATABASE_FILE, index=False)

def add_face_to_database(name, embedding):
    db = pd.read_csv(DATABASE_FILE)
    new_entry = pd.DataFrame([[name] + embedding.tolist()], columns=['Name'] + [f'v{i}' for i in range(512)])
    db = pd.concat([db, new_entry], ignore_index=True)
    db.to_csv(DATABASE_FILE, index=False)
    logging.info(f"User '{name}' added to the database.")

def recognize_face(embedding):
    db = pd.read_csv(DATABASE_FILE)
    names = db['Name']
    embeddings = db.iloc[:, 1:].values
    distances = np.linalg.norm(embeddings - embedding, axis=1)
    min_dist = np.min(distances) if len(distances) > 0 else float('inf')
    min_index = np.argmin(distances) if len(distances) > 0 else -1
    if min_dist < 0.8:
        return names[min_index], min_dist
    else:
        return None, min_dist
import random

def process_image_file(image_path):
    filename = os.path.basename(image_path)
    # Extract base name and the "name" portion (everything before the underscore)
    base = os.path.splitext(filename)[0]
    parts = base.split("_")
    name_only = parts[0] if parts else base

    # Generate a random ID for the name
    random_id = random.randint(100000, 999999)
    name_with_id = f"{name_only}_{random_id}"

    image = cv2.imread(image_path)
    if image is None:
        print(f"{name_with_id}||FAIL||Unable to read image", flush=True)
        return
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    faces, _ = mtcnn.detect(rgb_image)
    if faces is None:
        print(f"{name_with_id}||FAIL||No face detected", flush=True)
        return
    for i, (left, top, right, bottom) in enumerate(faces):
        # If multiple faces, add an index (e.g. "John Doe #1")
        if len(faces) > 1:
            face_name = f"{name_with_id} #{i+1}"
        else:
            face_name = name_with_id
        face_region = rgb_image[int(top):int(bottom), int(left):int(right)]
        if face_region.size == 0:
            print(f"{face_name}||FAIL||Empty face region", flush=True)
            continue
        try:
            face_pil = Image.fromarray(face_region)
            face_processed = mtcnn(face_pil)
            if face_processed is None:
                print(f"{face_name}||FAIL||mtcnn processing failed", flush=True)
                continue
            face_embedding = resnet(face_processed.unsqueeze(0)).detach().cpu().numpy()[0]
        except Exception as e:
            print(f"{face_name}||FAIL||Error: {e}", flush=True)
            continue

        recognized_name, distance = recognize_face(face_embedding)
        if recognized_name is not None:
            print(f"{face_name}||EXISTS||Already in database", flush=True)
        else:
            add_face_to_database(face_name, face_embedding)
            print(f"{face_name}||SUCCESS||Face processed successfully", flush=True)

def process_folder(folder_path):
    # Expect file names in the format: Name_ID (e.g., "John Doe_7821821")
    pattern = re.compile(r'^[\w\s]+_\d+$')
    for root, _, files in os.walk(folder_path):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
                base_name = os.path.splitext(file)[0]
                if not pattern.match(base_name):
                    print(f"{base_name}||FAIL||Not in correct format (Expected: Name_ID)", flush=True)
                    continue
                file_path = os.path.join(root, file)
                process_image_file(file_path)
    print(flush=True)

def interactive_mode():
    print("Interactive mode not modified – please use folder upload for batch processing.", flush=True)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_path = sys.argv[1]
        if os.path.isdir(input_path):
            process_folder(input_path)
        else:
            process_image_file(input_path)
    else:
        interactive_mode()
