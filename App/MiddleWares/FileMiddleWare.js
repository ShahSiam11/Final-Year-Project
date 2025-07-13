// Copyright (c) 2025 Ahsan Latif (@GittyCandy)
// All Rights Reserved.
//
// Unauthorized access, use, reproduction, modification, distribution,  
// or creation of derivative works based on this code is strictly prohibited  
// without the prior explicit written permission of the owner.  
//
// Violators may be subject to legal action.


const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Middleware to fetch log files
const logFileMiddleware = (req, res) => {
    const logDir = path.join(__dirname, '../../App/Attendance/Processed_Logs/');
    fs.readdir(logDir, (err, files) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error reading log files.');
        }
        const logFiles = files.filter(file => file.endsWith('.csv'));
        res.json(logFiles);
    });
};

// Middleware to process CSV data
const dataMiddleware = (req, res) => {
    const logFile = req.params.logFile;
    const logFilePath = path.join(__dirname, '../../App/Attendance/Processed_Logs/', logFile);

    const results = [];
    fs.createReadStream(logFilePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            res.json(results);
        })
        .on('error', (err) => {
            console.error(err);
            res.status(500).send('Error processing file');
        });
};

module.exports = { logFileMiddleware, dataMiddleware };
