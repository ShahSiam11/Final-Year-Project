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


router.get("/user-profile", (req, res) => {
    if (req.session.userId) {
        const userId = req.session.userId;

        const query = `
            SELECT p.subject_code AS subjectID,
                   p.subject_name AS subjectName,
                   p.subject_code AS subject,
                   TIME_FORMAT(p.start_time, '%H:%i') AS startTime,
                   p.semester,
                   p.subject_status AS subjectStatus
            FROM profile p
            WHERE p.user_id = ?
            ORDER BY p.start_time ASC`; // Sort by start time

        db.query(query, [userId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Internal Server Error" });
            }

            // Always return the user's name and role, even if no records are found
            res.json({
                name: req.session.userName,
                role: req.session.userRole,
                userProfile: result.length > 0 ? result : []
            });
        });
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
});


router.post("/add-subject", (req, res) => {
    if (req.session.userId) {
        const userId = req.session.userId;
        const { subjectID, subjectName, semester, facultyName } = req.body;

        // Query to check how many subjects the user already has
        const checkSubjectCountQuery = `
            SELECT COUNT(*) AS subjectCount
            FROM profile
            WHERE user_id = ?`;

        db.query(checkSubjectCountQuery, [userId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Internal Server Error" });
            }

            const subjectCount = result[0].subjectCount;

            // If the user already has 3 subjects, don't allow adding more
            if (subjectCount >= 3) {
                return res.status(400).json({ error: "You can only add up to 3 subjects." });
            }

            // If less than 3 subjects, add a new subject
            const insertSubjectQuery = `
                INSERT INTO profile (user_id, subject_code, subject_name, subject_status, start_time, semester, faculty_name, credits)
                VALUES (?, ?, ?, 'Pending', NOW(), ?, ?, 0)`;

            db.query(insertSubjectQuery, [userId, subjectID, subjectName, semester, facultyName], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Failed to add subject." });
                }

                // Respond with success and the updated subjects
                res.json({ success: true, message: "Subject added successfully." });
            });
        });
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
});



module.exports = router;