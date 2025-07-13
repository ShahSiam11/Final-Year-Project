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
const fs = require('fs');
const CONFIG_FILE = path.join(__dirname, '../config.txt');

const router = express.Router();


router.post("/api/config", (req, res) => {
    const { SPOOF_THRESHOLD, FRAME_SLEEP_TIME, IDLE_SLEEP_TIME, RECOGNITION_THRESHOLD, MIN_SCORE, MIN_DURATION } = req.body;

    // Validate input
    if (!SPOOF_THRESHOLD || !FRAME_SLEEP_TIME || !IDLE_SLEEP_TIME || !RECOGNITION_THRESHOLD || !MIN_DURATION) {
        return res.status(400).send({ message: "Invalid configuration data" });
    }

    const configContent = `
SPOOF_THRESHOLD=${SPOOF_THRESHOLD}
FRAME_SLEEP_TIME=${FRAME_SLEEP_TIME}
IDLE_SLEEP_TIME=${IDLE_SLEEP_TIME}
RECOGNITION_THRESHOLD=${RECOGNITION_THRESHOLD}
MIN_SCORE=${MIN_SCORE}
MIN_DURATION=${MIN_DURATION}
    `.trim();

    fs.writeFile(CONFIG_FILE, configContent, (err) => {
        if (err) {
            console.error("Failed to update config.txt:", err);
            return res.status(500).send({ message: "Failed to update configuration file" });
        }
        res.send({ message: "Configuration updated successfully" });
    });
});


module.exports = router;