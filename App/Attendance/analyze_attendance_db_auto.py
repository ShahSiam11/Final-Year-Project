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
import mysql.connector

# Configuration Parameters
INPUT_DIRECTORY = './Attendance/Logs'  # Folder where the log files are located
OUTPUT_DIRECTORY = './Attendance/Processed_Logs'  # Folder where the processed logs will be saved

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'attendance_system'
}

# Only process files that have been modified within this threshold (e.g., 1 day)
RECENT_THRESHOLD = timedelta(days=1)


# Function to parse duration string (e.g., "1h" for 1 hour, "30m" for 30 minutes)
def parse_duration(duration_str):
    try:
        if duration_str.endswith('h'):  # Hours
            hours = int(duration_str[:-1])
            return timedelta(hours=hours)
        elif duration_str.endswith('m'):  # Minutes
            minutes = int(duration_str[:-1])
            return timedelta(minutes=minutes)
        else:
            raise ValueError("Invalid duration format. Use '1h' for 1 hour or '30m' for 30 minutes.")
    except ValueError as e:
        print(f"Error parsing duration: {e}")
        return timedelta(hours=1)  # Default to 1 hour


# Read configuration parameters
def read_config(config_file='./config.txt'):
    config = {}
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
    return config


# Read configuration with enhanced MIN_DURATION parsing
config = read_config()
MIN_SCORE = config.get('MIN_SCORE', 0.7)  # Default score
MIN_DURATION = config.get('MIN_DURATION', timedelta(hours=1))  # Default duration

DEFAULT_EMAIL_DOMAIN = 'example.com'  # Placeholder email domain for new users
DEFAULT_PASSWORD = 'default_password'  # Placeholder password for new users
VALID_LABEL = 'Real'


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
    fieldnames = ['Date', 'Time', 'Name', 'StudentID', 'Criteria', 'Duration', 'Attendance', 'Label', 'Subject',
                  'ClassType']
    with open(file_path, mode='w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()  # Write the header
        writer.writerows(log_entries)  # Write all the log entries


# Insert log entries into MySQL database
def insert_into_db(log_entries):
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        print("Connection successful!")
        cursor = connection.cursor()

        for entry in log_entries:
            # Check if the user exists in the 'users' table
            cursor.execute("SELECT id FROM users WHERE userid = %s", (entry['StudentID'],))
            user = cursor.fetchone()

            if not user:
                # Add the user if they don't exist
                add_user_query = """
                INSERT INTO users (userid, name, email, password, role)
                VALUES (%s, %s, %s, %s, 'student')
                """
                cursor.execute(add_user_query, (
                    entry['StudentID'],
                    entry['Name'],
                    f"{entry['StudentID']}@{DEFAULT_EMAIL_DOMAIN}",
                    DEFAULT_PASSWORD
                ))
                connection.commit()
                cursor.execute("SELECT id FROM users WHERE userid = %s", (entry['StudentID'],))
                user = cursor.fetchone()

            user_id = user[0]  # Get the user ID

            # Insert attendance record
            insert_attendance_query = """
            INSERT INTO attendance_info (subject, date, user_id, time_joined, time_stayed, attendance, class_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """

            # Parse and format date and time
            current_year = datetime.now().year
            formatted_date = f"{current_year} {entry['Date']}"
            date_object = datetime.strptime(formatted_date, '%Y %B %d').date()
            time_joined = datetime.strptime(entry['Time'], '%I:%M %p').time()

            # Prepare data for attendance record
            data = (
                entry['Subject'],
                date_object,
                user_id,
                time_joined,
                entry['Duration'],  # Duration already in HH:MM:SS format
                entry['Attendance'],
                entry['ClassType']
            )
            cursor.execute(insert_attendance_query, data)

        connection.commit()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()


# Process the input CSV and create the new output CSV
def process_csv(input_file_path, output_file_path):
    logs = load_logs(input_file_path)
    processed_logs = []
    student_sessions = {}

    # Extract subject and class type from the input file name
    file_name = os.path.basename(input_file_path)
    parts = file_name.split('_')
    subject = parts[-2] if len(parts) > 2 else "Unknown"
    class_type = parts[-1].replace('.csv', '').strip().capitalize() if len(parts) > 1 else "Unknown"

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
                'valid_score': score if label == VALID_LABEL and score > MIN_SCORE else 0,
                'valid_label': label == VALID_LABEL and score > MIN_SCORE,
                'name': name,
                'label': label  # Store the label for the first detection
            }
        else:
            # Update last detection time and score if this entry is valid
            session = student_sessions[student_id]
            session['last_detection'] = current_time
            if label == VALID_LABEL and score > MIN_SCORE:
                session['valid_score'] = score
                session['valid_label'] = True

    # Calculate duration and attendance
    for student_id, session in student_sessions.items():
        first_detection = session['first_detection']
        last_detection = session['last_detection']
        duration = last_detection - first_detection  # This is the time the student stayed in class

        # Calculate time_stayed as string in HH:MM:SS format
        time_stayed_str = str(duration).split(".")[0]  # Remove microseconds

        criteria = "1 hour" if duration >= MIN_DURATION else "Less than 1 hour"
        attendance = "Marked" if session['valid_label'] and duration >= MIN_DURATION else "Not marked"

        log_entry = {
            'Date': first_detection.strftime('%B %d'),
            'Time': first_detection.strftime('%I:%M %p'),
            'Name': session['name'],
            'StudentID': student_id,
            'Criteria': criteria,
            'Duration': time_stayed_str,
            'Attendance': attendance,
            'Label': session['label'],
            'Subject': subject,
            'ClassType': class_type
        }
        processed_logs.append(log_entry)

    # Save the processed logs to the output CSV file
    save_log(output_file_path, processed_logs)

    # Insert processed logs into the MySQL database
    insert_into_db(processed_logs)


# Automatically process all log files in the "logs" folder and save to "Processed_Logs"
def process_all_logs(input_directory, output_directory):
    # Create the output directory if it doesn't exist
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)

    for filename in os.listdir(input_directory):
        if filename.endswith('.csv'):
            input_file_path = os.path.join(input_directory, filename)

            # Check if the file was modified within the recent threshold
            mod_time = datetime.fromtimestamp(os.path.getmtime(input_file_path))
            if datetime.now() - mod_time > RECENT_THRESHOLD:
                print(f"Skipping {filename} (last modified: {mod_time.strftime('%Y-%m-%d %H:%M:%S')})")
                continue

            # Generate a unique output file name based on the input file name
            output_file_name = filename
            output_file_path = os.path.join(output_directory, output_file_name)

            # Process the log file
            process_csv(input_file_path, output_file_path)
            print(f"Processed logs have been saved to {output_file_name}")


# Main function
def main():
    process_all_logs(INPUT_DIRECTORY, OUTPUT_DIRECTORY)


if __name__ == "__main__":
    main()
