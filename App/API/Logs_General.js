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


router.get('/logs', (req, res) => {
  fs.readFile(logFilePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading log file');
    }

    // Filter out only 'INFO' logs and split by lines
    const logs = data.split('\n')
      .filter(line => line.includes('INFO')); // Get all 'INFO' logs

    res.json(logs); // Send logs as JSON
  });
});

router.get('/logs-error', (req, res) => {
  fs.readFile(logFilePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading log file');
    }

    // Filter out only 'INFO' logs and split by lines
    const logs = data.split('\n')
      .filter(line => line.includes('ERROR')); // Get all 'INFO' logs

    res.json(logs); // Send logs as JSON
  });
});


router.get('/logs-critical', (req, res) => {
  fs.readFile(logFilePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading log file');
    }

    // Filter out only 'INFO' logs and split by lines
    const logs = data.split('\n')
      .filter(line => line.includes('CRITICAL')); // Get all 'INFO' logs

    res.json(logs); // Send logs as JSON
  });
});


router.get('/logs-debug', (req, res) => {
  fs.readFile(logFilePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading log file');
    }

    // Filter out only 'INFO' logs and split by lines
    const logs = data.split('\n')
      .filter(line => line.includes('DEBUG')); // Get all 'INFO' logs

    res.json(logs); // Send logs as JSON
  });
});

module.exports = router;