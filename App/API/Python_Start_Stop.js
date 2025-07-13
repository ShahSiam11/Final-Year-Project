// Copyright (c) 2025 Ahsan Latif (@GittyCandy)
// All Rights Reserved.
//
// Unauthorized access, use, reproduction, modification, distribution,  
// or creation of derivative works based on this code is strictly prohibited  
// without the prior explicit written permission of the owner.  
//
// Violators may be subject to legal action.



const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();
let pythonProcess = null; // Variable to track the attendance Python process

// Start Attendance
router.post('/start-attendance', (req, res) => {
    const { subject, classType } = req.body;

    pythonProcess = spawn('python', [
        path.join(__dirname, '../AttendanceLogFace.py'),
        subject,
        classType,
    ]);

    console.log('Started AttendanceLogFace.py...');

    pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`AttendanceLogFace.py exited with code ${code}`);
        pythonProcess = null;
    });

    res.send('Attendance logging started.');
});

// Stop Attendance
router.post('/stop-attendance', (req, res) => {
    if (pythonProcess) {
        // Run the finalization Python script before stopping
        const stopScriptPath = path.join(__dirname, '../Attendance/analyze_attendance_db_auto.py'); // Change the file name as needed
        const stopScriptProcess = spawn('python', [stopScriptPath]);

        stopScriptProcess.stdout.on('data', (data) => {
            console.log(`StopScript stdout: ${data}`);
        });

        stopScriptProcess.stderr.on('data', (data) => {
            console.error(`StopScript stderr: ${data}`);
        });

        stopScriptProcess.on('close', (code) => {
            console.log(`StopScript.py exited with code ${code}`);
            // Once the finalization script has completed, stop the attendance logging process
            pythonProcess.kill('SIGINT');
            console.log('Stopped AttendanceLogFace.py...');
        });

        res.send('Finalization script initiated and attendance logging stopping.');
    } else {
        res.send('No running attendance logging process to stop.');
    }
});

module.exports = router;
