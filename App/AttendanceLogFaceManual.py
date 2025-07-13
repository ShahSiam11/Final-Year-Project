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
import time
import sys
import logging

logging.basicConfig(filename='face_recognition.log', level=logging.DEBUG,
                    format='%(asctime)s - %(levelname)s - %(message)s')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Append paths for Anti_Spoof and Attendance modules dynamically
ANTI_SPOOF_PATH = os.path.join(BASE_DIR, "Anti_Spoof")

sys.path.append(ANTI_SPOOF_PATH)


from Anti_Spoof.test import test

SPOOF_THRESHOLD = 1
FRAME_SLEEP_TIME = 1
IDLE_SLEEP_TIME = 1
RECOGNITION_THRESHOLD = 0.8

mtcnn = MTCNN(image_size=160, margin=0, min_face_size=20,
              device=torch.device('cuda:0' if torch.cuda.is_available() else 'cpu'))
resnet = InceptionResnetV1(pretrained='vggface2').eval()
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')

DATABASE_FILE = 'Faces/Face_database.csv'

if not os.path.exists(DATABASE_FILE):
    pd.DataFrame(columns=['Name'] + [f'v{i}' for i in range(512)]).to_csv(DATABASE_FILE, index=False)
    logging.info(f"Created new database file: {DATABASE_FILE}")

IMAGE_SAVE_DIR = 'Faces/Temp_images'
os.makedirs(IMAGE_SAVE_DIR, exist_ok=True)


def recognize_face(embedding):
    try:
        db = pd.read_csv(DATABASE_FILE)
        names = db['Name']
        embeddings = db.iloc[:, 1:].values
        distances = np.linalg.norm(embeddings - embedding, axis=1)
        min_dist = np.min(distances)
        min_index = np.argmin(distances)

        similarity = (1 - min_dist) * 100  # Convert distance to percentage similarity

        if min_dist < RECOGNITION_THRESHOLD:
            return names[min_index], min_dist, similarity
        else:
            return "Unknown", min_dist, similarity
    except Exception as e:
        logging.error(f"Error in recognize_face: {e}")
        return "Unknown", float('inf'), 0


def main():
    try:
        logging.info("Started face recognition process.")
        print(f"Automatic capture every {IDLE_SLEEP_TIME} seconds.")
        mode = 'recognize'

        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            raise Exception("Could not open camera.")

        while True:
            try:
                ret, frame = cap.read()
                if not ret:
                    raise Exception("Could not read frame.")

                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                faces, probs = mtcnn.detect(rgb_frame)

                if faces is None:
                    print(f"😴 No faces detected. Idle for {IDLE_SLEEP_TIME}s...")
                    time.sleep(IDLE_SLEEP_TIME)
                    continue

                num_faces = len(faces)
                face_emojis = " ".join([str(i + 1) + "️⃣" for i in range(num_faces)])

                print(f"Detected {num_faces} face(s): {face_emojis}")

                for i, (left, top, right, bottom) in enumerate(faces):
                    try:
                        processed_frame = frame.copy()
                        for j, (block_left, block_top, block_right, block_bottom) in enumerate(faces):
                            if i != j:
                                cv2.rectangle(processed_frame, (int(block_left), int(block_top)),
                                              (int(block_right), int(block_bottom)),
                                              (0, 0, 255), -1)

                        face_region = rgb_frame[int(top):int(bottom), int(left):int(right)]
                        face_embedding = \
                        resnet(mtcnn(torch.tensor(face_region).to(device)).unsqueeze(0)).detach().cpu().numpy()[0]

                        print(f"{i + 1}️⃣ Recognition in progress...")
                        if mode == 'recognize':
                            name, distance, similarity = recognize_face(face_embedding)
                            print(
                                f"Recognition Result: {name} (Distance: {distance:.2f})")
                                #f"Recognition Result: {name} (Distance: {distance:.2f}, Similarity: {similarity:.2f}%)")

                            image_filename = os.path.join(IMAGE_SAVE_DIR, f"processed_face_{i + 1}.jpg")
                            cv2.imwrite(image_filename, processed_frame)
                            print(f"📸 Processed image saved: {image_filename}")

                            print("🔍 Running anti-spoof check...")
                            spoof_result, score, test_speed = test(image_filename,
                                                                   "Anti_Spoof/resources/anti_spoof_models", device)
                            if spoof_result <= SPOOF_THRESHOLD:
                                print(f"✅ Spoof detection: Real Face (Accuracy: {score * 100:.2f}%)")
                            else:
                                print(f"❌ Spoof detection: Fake Face (Accuracy: {score * 100:.2f}%)")
                            print(f"🕒 Prediction Time: {test_speed:.2f}s")
                        else:
                            print("Invalid mode. Please choose 'recognize' ⚠️")

                    except Exception as e:
                        logging.error(f"Bad Lighting for face {i + 1}: {e}")
                        print(f"⚠️ Bad Lighting for face {i + 1}. Skipping this face.")
                        continue

                print("-" * 50)
                time.sleep(FRAME_SLEEP_TIME)

            except Exception as e:
                logging.error(f"Error during frame capture or processing: {e}")
                print(f"❌ Error: {e}. Retrying... 🔄")
                time.sleep(IDLE_SLEEP_TIME)

        cap.release()
        cv2.destroyAllWindows()
        logging.info("Face recognition process ended.")

    except Exception as e:
        logging.critical(f"Critical error in main: {e}")
        print(f"⚠️ Critical error: {e}. Program will attempt to continue.")
        time.sleep(IDLE_SLEEP_TIME)


if __name__ == "__main__":
    main()