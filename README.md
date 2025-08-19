# AttendEase - AI-Based Attendance System

![AttendEase Banner](attendease.png) 
## Overview
AttendEase is an AI-powered attendance system that utilizes facial recognition and anti-spoofing techniques to track student and employee attendance. The system supports automatic attendance marking, real-time verification, and an admin dashboard for management.

## Features
- **AI-Based Facial Recognition**: Detects and verifies faces with anti-spoofing measures.
- **Automated Attendance Logging**: Tracks attendance based on duration and presence.
- **Multi-Factor Authentication**: Supports barcode scanning and biometric checks.
- **Admin Dashboard**: Manage users, subjects, and attendance records.
- **Web-Based Interface**: Accessible from any device.

---

## System Requirements
### Hardware:
- **IP Camera** (for real-time attendance tracking)
- **ESP32 Chip** (optional for IoT integrations)

### Software:
- **Python 3.10** (Recommended for stability)
- **PyCharm IDE** (or Visual Studio Code)
- **Node.js** (For running the web server)
- **MySQL Database** (For data storage)

---

## Installation Guide
### Step 1: Clone the Repository
```bash
 git clone 
 cd AttendEase
```

### Step 2: Set Up Python Environment
1. Open **PyCharm** and create a new project.
2. Set the Python interpreter to **Python 3.10**.
3. Install prerequisites:
   ```bash
   pip install -r requirements.txt
   ```
4. Ensure `pip`, `setuptools`, and `wheel` are installed:
   ```bash
   pip install pip==23.2.1 setuptools==68.2.0 wheel==0.41.2
   ```

### Step 3: Install Node.js Requirements
1. Check if Node.js is installed:
   ```bash
   node -v
   ```
   If not installed, download from [Node.js Official Website](https://nodejs.org/).

2. Install required packages:
   ```bash
   npm install express csv-parser mysql2 body-parser bcryptjs express-session multer dotenv fs nodemailer
   ```

### Step 4: Configure Database
1. Open `Config/databaseconfig.js`
2. Update the MySQL credentials:
   ```javascript
   module.exports = {
     host: 'localhost',
     user: 'root', // Change this to your MySQL username
     password: '', // Change this to your MySQL password
     database: 'AttendEaseDB'
   };
   ```

### Step 5: Start the Server
```bash
 node ./Server.js
```
This will:
- Create the database and necessary tables.
- Set up a default admin account (`admin@example.com / password`).
- Start the web interface at `http://localhost:3030`.

---

## Testing Face Recognition
### Manual Testing (Without Classroom Setup)
To test the face recognition system manually:
```bash
 python attendancelogfacemanual.py
```
- Uses a webcam for recognition.
- Runs anti-spoofing detection.
- Saves detected faces temporarily.

To verify anti-spoofing, try showing an image or video instead of a real face.

---

## File Structure
```
AttendEase/
├── Server.js            # Main server script
├── Config/
│   ├── databaseconfig.js # Database configuration
├── Models/              # AI and ML models
├── Public/              # Frontend assets
├── Scripts/             # Utility scripts
├── Logs/                # Attendance logs
├── README.md            # This file
```

---

## Documentation
For a detailed guide on using the web dashboard and additional configurations, refer to the project documentation.

---
# Project Contributions and Ownership

This project was developed collaboratively by multiple contributors.

- The core system, including AttendanceLogFace.py, Reconfigure.py, and IPModeMain.py, was entirely authored and maintained by Shah Siam.  
- Additional source files authored by other contributors contain their respective copyright notices and usage restrictions.  
- Shah Siam led the system design, integration, project management, testing, and iterative improvements throughout development.  
- This repository reflects Shah Siam’s consolidated and cleaned version of the project codebase.

Please respect individual file licenses and seek permission from the respective authors for reuse of their code.




---

# Vision & Problem Statement

Traditional attendance systems in universities are either inefficient or easily bypassed. QR codes are instantly shared in group chats, RFID and fingerprint systems cause delays or can be spoofed, and manual roll calls waste valuable lecture time without guaranteeing real participation. Existing facial recognition tools also fall short, being vulnerable to spoofing and unable to track how long students remain in class.

AttendEase solves these problems by combining facial recognition with anti-spoofing and automated time tracking. The system logs attendance seamlessly as students enter and exit, ensuring accuracy to the second while preventing fraudulent check-ins. This reduces administrative overhead, saves up to 10 minutes per lecture, and provides real-time, reliable reports.

Our vision is to make attendance frictionless and secure, starting with universities but scalable to corporate offices and other environments requiring robust identity verification.

---

# My Role as Product Owner & Project Manager

While AttendEase was a collaborative project, I acted as the product owner and project manager, guiding both the technical and strategic direction. 

My contributions included:

- **Defining the vision and requirements**: Identified inefficiencies in existing attendance systems and translated them into clear, testable requirements for the team.

- **System design & integration leadership**: Designed the end-to-end architecture, authored core modules (AttendanceLogFace.py, Reconfigure.py, IPModeMain.py), and integrated contributions from teammates into a unified system.

- **Team & project management**: Coordinated task division, maintained timelines, and resolved design disputes to keep development aligned with the core vision.

- **Testing & quality assurance**: Led the testing strategy, combining functional, non-functional, and usability testing to validate accuracy, performance, and reliability.

- **Iterative improvement**: Identified bottlenecks (e.g., lag from logging delays, spoofing attempts, low-light failures) and drove fixes through threading, image enhancement, and automation features.

- **Documentation & stakeholder communication**: Produced requirement analysis, system design docs, test plans, and Figma prototypes, ensuring the product was both technically sound and clearly communicated.

This role required balancing _technical implementation_ with _product thinking_, ensuring AttendEase delivered not just working code but a reliable, scalable, and user-focused solution — ultimately earning a **High Distinction**.

---
