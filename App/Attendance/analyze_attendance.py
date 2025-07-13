# Copyright (c) 2025 Ahsan Latif (@GittyCandy)
# All Rights Reserved.
#
# Unauthorized access, use, reproduction, modification, distribution,  
# or creation of derivative works based on this code is strictly prohibited  
# without the prior explicit written permission of the owner.  
#
# Violators may be subject to legal action.



import csv
import os
from datetime import datetime, timedelta

# Load existing logs from CSV
def load_logs(file_path):
    logs = []
    try:
        with open(file_path, mode='r', newline='') as file:
            reader = csv.DictReader(file)
            for row in reader:
                logs.append(row)
    except FileNotFoundError:
        pass  # If no file, return an empty list
    return logs

# Save new log to a new CSV file
def save_log(file_path, log_entries):
    fieldnames = ['Date', 'Time', 'Name', 'StudentID', 'Criteria', 'Duration', 'Attendance', 'Label', 'Subject', 'ClassType']
    with open(file_path, mode='w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()  # Write the header
        writer.writerows(log_entries)  # Write all the log entries

# Process the input CSV and create the new output CSV
def process_csv(input_file_path, output_file_path):
    logs = load_logs(input_file_path)
    processed_logs = []
    student_sessions = {}

    # Extract subject and class type from the input file name
    file_name = os.path.basename(input_file_path)
    parts = file_name.split('_')
    subject = parts[-2] if len(parts) > 2 else "Unknown"
    class_type = parts[-1].replace('.csv', '').capitalize() if len(parts) > 1 else "Unknown"

    # Iterate over all the logs
    for row in logs:
        student_id = row['StudentID']
        name = row['Name']
        label = row['Label']
        score = float(row['Score'])
        current_time = datetime.strptime(row['Date'] + ' ' + row['Time'], '%B %d, %Y %I:%M:%S %p')

        # If it's the first detection of this student, initialize their session
        if student_id not in student_sessions:
            student_sessions[student_id] = {
                'first_detection': current_time,
                'last_detection': current_time,
                'valid_score': score if label == 'Real' and score > 0.7 else 0,
                'valid_label': label == 'Real' and score > 0.7,
                'name': name,
                'label': label  # Store the label for the first detection
            }
        else:
            # Update last detection time and score if this entry is valid
            session = student_sessions[student_id]
            session['last_detection'] = current_time
            if label == 'Real' and score > 0.7:
                session['valid_score'] = score
                session['valid_label'] = True

    # Calculate duration and attendance
    for student_id, session in student_sessions.items():
        first_detection = session['first_detection']
        last_detection = session['last_detection']
        duration = last_detection - first_detection
        criteria = "1 hour" if duration >= timedelta(hours=1) else "Less than 1 hour"
        duration_str = str(duration).split(".")[0]  # Remove microseconds
        attendance = "Marked" if session['valid_label'] and duration >= timedelta(hours=1) else "Not marked"

        log_entry = {
            'Date': first_detection.strftime('%B %d'),
            'Time': first_detection.strftime('%I:%M %p'),
            'Name': session['name'],
            'StudentID': student_id,
            'Criteria': criteria,
            'Duration': duration_str,
            'Attendance': attendance,
            'Label': session['label'],  # Add the label column to the output
            'Subject': subject,
            'ClassType': class_type
        }
        processed_logs.append(log_entry)

    # Save the processed logs to the output CSV file
    save_log(output_file_path, processed_logs)

# Automatically process all log files in the "logs" folder and save to "Processed_Logs"
def process_all_logs(input_directory, output_directory):
    # Create the output directory if it doesn't exist
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)

    for filename in os.listdir(input_directory):
        if filename.endswith('.csv') and filename.startswith('AttendanceLog'):
            input_file_path = os.path.join(input_directory, filename)
            # Generate a unique output file name based on the input file name
            output_file_name = f"Processed_{filename}"
            output_file_path = os.path.join(output_directory, output_file_name)

            # Process the log file
            process_csv(input_file_path, output_file_path)
            print(f"Processed logs have been saved to {output_file_name}")

# Main function
def main():
    input_directory = 'Logs'  # Folder where the log files are located
    output_directory = 'Processed_Logs'  # Folder where the processed logs will be saved
    process_all_logs(input_directory, output_directory)

if __name__ == "__main__":
    main()
