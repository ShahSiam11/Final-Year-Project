// Copyright (c) 2025 Ahsan Latif (@GittyCandy)
// All Rights Reserved.
//
// Unauthorized access, use, reproduction, modification, distribution,  
// or creation of derivative works based on this code is strictly prohibited  
// without the prior explicit written permission of the owner.  
//
// Violators may be subject to legal action.



const express = require('express');
const path = require('path');
const logFilePath = path.join(__dirname, '../face_recognition.log');
const fs = require('fs');
const router = express.Router();


router.get('/real-faces', (req, res) => {
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  fs.readFile(logFilePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading real faces log file:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Filter log entries for today's date and real faces
    const realFacesCount = data
      .split('\n')
      .filter(line => line.includes(today) && line.includes('Real Face')) // Replace 'Real Face' with the relevant keyword
      .length;

    res.json({ count: realFacesCount });
  });
});

router.get('/fake-attempts', (req, res) => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  fs.readFile(logFilePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading fake attempts log file:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Split log file by newlines and filter for today's fake attempts.
    const fakeAttemptsCount = data
      .split('\n')
      .filter(line => line.includes(today) && line.includes('Fake Face'))
      .length;

    res.json({ count: fakeAttemptsCount });
  });
});

module.exports = router;