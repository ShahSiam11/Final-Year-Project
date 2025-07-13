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
import pandas as pd
import numpy as np
from facenet_pytorch import InceptionResnetV1, MTCNN
import logging
# Configure logging
LOG_FILE = "face_recognition.log"
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
# Initialize models
mtcnn = MTCNN(image_size=160, margin=0, min_face_size=20,
              device=torch.device('cuda:0' if torch.cuda.is_available() else 'cpu'))
resnet = InceptionResnetV1(pretrained='vggface2').eval()
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')

# Directories
FACES_DIR = 'Faces'
IMAGE_SAVE_DIR = os.path.join(FACES_DIR, 'Temp_images')

# Ensure directories exist
os.makedirs(FACES_DIR, exist_ok=True)
os.makedirs(IMAGE_SAVE_DIR, exist_ok=True)

# Database file
DATABASE_FILE = os.path.join(FACES_DIR, 'Face_database.csv')

# Initialize database
if not os.path.exists(DATABASE_FILE):
    pd.DataFrame(columns=['Name'] + [f'v{i}' for i in range(512)]).to_csv(DATABASE_FILE, index=False)

def add_face_to_database(name, embedding):
    # Load existing database
    db = pd.read_csv(DATABASE_FILE)

    # Create a new row with the name and embedding
    new_entry = pd.DataFrame([[name] + embedding.tolist()], columns=['Name'] + [f'v{i}' for i in range(512)])

    # Append and save the database
    db = pd.concat([db, new_entry], ignore_index=True)
    db.to_csv(DATABASE_FILE, index=False)
    logging.info(f"User '{name}' registered in the database.")
    print(f"{name} added to the database!")

def recognize_face(embedding):
    # Load existing database
    db = pd.read_csv(DATABASE_FILE)

    # Extract embeddings and names
    names = db['Name']
    embeddings = db.iloc[:, 1:].values

    # Calculate distances between the input embedding and database embeddings
    distances = np.linalg.norm(embeddings - embedding, axis=1)
    min_dist = np.min(distances)
    min_index = np.argmin(distances)

    # Threshold for recognition
    if min_dist < 0.8:  # You can adjust this threshold as needed
        return names[min_index], min_dist
    else:
        return None, min_dist

def main():
    logging.info("Application started! Learning new Faces")
    print("Welcome to Face Recognition!")
    mode = 'add'

    # Open camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        logging.error("Could not open camera.")
        print("Error: Could not open camera.")
        return

    print("Press 'q' to capture the image.")
    while True:
        ret, frame = cap.read()
        if not ret:
            logging.error("Could not read frame from camera.")
            print("Error: Could not read frame.")
            break

        cv2.imshow("Camera", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    # Convert to RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Detect and extract all faces
    faces, probs = mtcnn.detect(rgb_frame)

    if faces is None:
        logging.debug("No faces detected.")
        print("No faces detected. Please try again.")
        return

    print(f"Detected {len(faces)} faces.")

    # Loop through each face detected
    for i, (left, top, right, bottom) in enumerate(faces):
        # Create a copy of the original frame for each iteration
        processed_frame = frame.copy()

        # Loop through faces again and block all faces except the current one
        for j, (block_left, block_top, block_right, block_bottom) in enumerate(faces):
            if i != j:  # Block the other faces
                cv2.rectangle(processed_frame, (int(block_left), int(block_top)), (int(block_right), int(block_bottom)),
                              (0, 0, 255), -1)  # Block with red color

        # Extract the face region of the current face
        face_region = rgb_frame[int(top):int(bottom), int(left):int(right)]

        # Generate embedding for the current face
        face_embedding = resnet(mtcnn(torch.tensor(face_region).to(device)).unsqueeze(0)).detach().cpu().numpy()[0]

        print(f"Face {i + 1}:")

        # Check if the face is already in the database
        recognized_name, distance = recognize_face(face_embedding)

        if recognized_name is not None:
            logging.warning(f"Face: {recognized_name} (Distance: {distance:.4f}) is already in the Database!")
            print(f"Face already in the database: {recognized_name} (Distance: {distance:.4f})")
        else:
            if mode == 'add':
                name = input(f"Enter the name for face {i + 1}: ").strip()
                student_id = input(f"Enter the student ID for face {i + 1}: ").strip()
                full_name = f"{name}_{student_id}"
                add_face_to_database(full_name, face_embedding)
            else:
                logging.error("Invalid mode to add face selected.")
                print("Invalid mode. Please choose 'add'.")

    # Display the last processed frame (optional, depending on your use case)
    cv2.imshow("Detected Faces", processed_frame)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    logging.debug("Application closed.")

if __name__ == "__main__":
    main()
