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

function parseLogFile() {
    const logFilePath = path.join(__dirname, '../face_recognition.log');
    const logData = fs.readFileSync(logFilePath, 'utf8');
    const lines = logData.split('\n');

    let healthData = {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        aiMetrics: {
            facesProcessed: 0,
            avgFaceEmbeddingInferenceTime: 0,
            avgAntiSpoofingTestTime: 0
        }
    };

    lines.forEach(line => {
        if (line.includes('HEALTH - System Health')) {
            const cpuMatch = line.match(/CPU Usage: (\d+\.\d+)%/);
            const memoryMatch = line.match(/Memory Usage: (\d+\.\d+)%/);
            const diskMatch = line.match(/Disk Usage: (\d+\.\d+)%/);

            if (cpuMatch) healthData.cpuUsage = parseFloat(cpuMatch[1]);
            if (memoryMatch) healthData.memoryUsage = parseFloat(memoryMatch[1]);
            if (diskMatch) healthData.diskUsage = parseFloat(diskMatch[1]);
        }

        if (line.includes('HEALTH - AI Metrics')) {
            const facesProcessedMatch = line.match(/Faces Processed: (\d+)/);
            const avgFaceEmbeddingInferenceTimeMatch = line.match(/Avg Face Embedding Inference Time: (\d+\.\d+)s/);
            const avgAntiSpoofingTestTimeMatch = line.match(/Avg Anti-Spoofing Test Time: (\d+\.\d+)s/);

            if (facesProcessedMatch) healthData.aiMetrics.facesProcessed = parseInt(facesProcessedMatch[1]);
            if (avgFaceEmbeddingInferenceTimeMatch) healthData.aiMetrics.avgFaceEmbeddingInferenceTime = parseFloat(avgFaceEmbeddingInferenceTimeMatch[1]);
            if (avgAntiSpoofingTestTimeMatch) healthData.aiMetrics.avgAntiSpoofingTestTime = parseFloat(avgAntiSpoofingTestTimeMatch[1]);
        }
    });

    return healthData;
}

// API endpoint to get health data
router.get('/api/health', (req, res) => {
    const healthData = parseLogFile();
    res.json(healthData);
});


module.exports = router;
