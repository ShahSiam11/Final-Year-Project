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
const db = require('../Config/DataBaseConfig.js');
const fs = require('fs');
const router = express.Router();


router.get("/attend-info", (req, res) => {
    if (req.session.userId) {
        const userId = req.session.userId;

        // Query to fetch recent attendance info (e.g., last 5 records)
        const query = `
            SELECT DATE_FORMAT(a.date, '%Y-%m-%d') AS date, a.time_joined, a.subject, a.class_type, a.time_stayed, a.attendance
            FROM attendance_info a
            WHERE a.user_id = ?
            ORDER BY a.date DESC, a.time_joined DESC
            LIMIT 5;
        `;

        db.query(query, [userId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Internal Server Error" });
            }

            // Always return the user's name and role, even if no attendance records are found
            res.json({
                name: req.session.userName,
                role: req.session.userRole,
                recentAttendance: result
            });
        });
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
});

module.exports = router;