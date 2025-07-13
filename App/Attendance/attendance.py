# Copyright (c) 2025 Ahsan Latif (@GittyCandy)
# All Rights Reserved.
#
# Unauthorized access, use, reproduction, modification, distribution,  
# or creation of derivative works based on this code is strictly prohibited  
# without the prior explicit written permission of the owner.  
#
# Violators may be subject to legal action.



import csv
from datetime import datetime
import os
import sys
# Ensure directories exist
os.makedirs("Attendance/Logs", exist_ok=True)

if len(sys.argv) != 3:
    print("Usage: attendancelog.py <subject_name> <class_type>")
    sys.exit(1)

subject_name = sys.argv[1]
class_type = sys.argv[2]

# Generate a consistent file name using the current time
now = datetime.now()
file_name = f"Attendance/Logs/{now.strftime('%B-%d-%Y_%I-%M%p')}_{subject_name}_{class_type}.csv"

def log_attendance(name_label, label, score):
    if name_label.lower() == "unknown":
        print("Unknown face detected. Skipping logging.")
        return

    try:
        name, student_id = name_label.rsplit("_", 1)
    except ValueError:
        print("Invalid format for name_label. Skipping logging.")
        return

    # Get current date and time with seconds
    now = datetime.now()
    current_date = now.strftime("%B %d, %Y")
    current_time = now.strftime("%I:%M:%S %p")  # Include seconds

    # Prepare the row data with seconds, subject name, and class type
    row = [current_date, current_time, name, student_id, label, f"{score:.2f}", subject_name, class_type]

    # Check if the file exists
    file_exists = os.path.exists(file_name)

    # Write to CSV
    with open(file_name, mode='a', newline='') as file:
        writer = csv.writer(file)
        if not file_exists:
            # Write the header if the file does not exist
            writer.writerow(["Date", "Time", "Name", "StudentID", "Label", "Score", "Subject", "ClassType"])
        writer.writerow(row)

    # Log the message with seconds
    print(f"{current_date}, {current_time}, {name}, {student_id}, {label}, {f'{score:.2f}'}, {subject_name}, {class_type}")

