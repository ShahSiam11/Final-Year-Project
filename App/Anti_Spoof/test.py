import os
import cv2
import numpy as np
import argparse
import warnings
import time

import sys
# Get the base directory dynamically
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Append path for src dynamically
SRC_PATH = os.path.join(BASE_DIR, "src")
sys.path.append(SRC_PATH)

from src.anti_spoof_predict import AntiSpoofPredict
from src.generate_patches import CropImage
from src.utility import parse_model_name
warnings.filterwarnings('ignore')


SAMPLE_IMAGE_PATH = "./images/sample/"


def crop_image_to_ratio(img, target_height_ratio, target_width_ratio, middle):
    h, w = img.shape[:2]
    h = h - h % 4  # Ensure height is divisible by 4
    new_w = int(h / target_height_ratio) * target_width_ratio
    startx = middle - new_w // 2
    endx = middle + new_w // 2

    # Ensure the cropped image stays within bounds
    cropped_img = img[0:h, max(0, startx):min(w, endx)]
    return cropped_img

def check_image_aspect_ratio(image):
    height, width, channel = image.shape
    if width / height != 3 / 4:
        return False
    return True


def test(image_name, model_dir, device_id):
    model_test = AntiSpoofPredict(device_id)
    image_cropper = CropImage()
    image = cv2.imread(image_name)

    if not check_image_aspect_ratio(image):
        height, width, _ = image.shape
        middle = width // 2
        image = crop_image_to_ratio(image, 3, 4, middle)

    image_bbox = model_test.get_bbox(image)
    prediction = np.zeros((1, 3))
    total_time = 0

    for model_name in os.listdir(model_dir):
        h_input, w_input, model_type, scale = parse_model_name(model_name)
        params = {
            "org_img": image,
            "bbox": image_bbox,
            "scale": scale,
            "out_w": w_input,
            "out_h": h_input,
            "crop": scale is not None,
        }

        cropped_img = image_cropper.crop(**params)
        start_time = time.time()
        prediction += model_test.predict(cropped_img, os.path.join(model_dir, model_name))
        total_time += time.time() - start_time

    label = np.argmax(prediction)
    score = prediction[0][label] / 2
    return label,score,total_time


if __name__ == "__main__":
    desc = "test"
    parser = argparse.ArgumentParser(description=desc)
    parser.add_argument(
        "--device_id",
        type=int,
        default=0,
        help="which gpu id, [0/1/2/3]")
    parser.add_argument(
        "--model_dir",
        type=str,
        default="./resources/anti_spoof_models",
        help="model_lib used to test")
    parser.add_argument(
        "--image_name",
        type=str,
        default="image_F1.jpg",
        help="image used to test")
    args = parser.parse_args()
    test(args.image_name, args.model_dir, args.device_id)
