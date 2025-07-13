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
let pythonProcess = null;

// Endpoint to start the "add face" process
router.post('/start-add-face', (req, res) => {
  // Spawning the Python process for Add.py
  pythonProcess = spawn('python', [
    path.join(__dirname, '../Add.py')
  ]);

  console.log('Started Add.py process...');

  // Log standard output from the Python script
  pythonProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  // Log errors from the Python script
  pythonProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  // When the process exits, reset our process variable
  pythonProcess.on('close', (code) => {
    console.log(`Add.py exited with code ${code}`);
    pythonProcess = null;
  });

  res.send('Add face process started.');
});

// Endpoint to stop the "add face" process (if it’s running)
router.post('/stop-add-face', (req, res) => {
  if (pythonProcess) {
    // Kill the process gracefully
    pythonProcess.kill('SIGINT');
    console.log('Stopped Add.py process...');
    res.send('Add face process stopped.');
  } else {
    res.send('No running add face process to stop.');
  }
});

module.exports = router;
