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

router.get("/attendance-data", (req, res) => {
    if (req.session.userId) {
        const userId = req.session.userId;

        // Query to fetch subject, class type, and attendance status (marked or not)
        const query = `
            SELECT a.subject, a.class_type, a.attendance,a.date
            FROM attendance_info a
            WHERE a.user_id = ?
        `;

        db.query(query, [userId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Internal Server Error" });
            }
            if (result.length > 0) {
                res.json({ attendanceData: result });
            } else {
                res.status(404).json({ error: "No attendance data found" });
            }
        });
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
});


router.get("/subject-analytics", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.session.userId;

    const query = `
        SELECT
            p.subject_name AS subjectName,
            p.faculty_name AS facultyName,
            p.semester,
            SUM(CASE WHEN a.class_type = 'Lecture' THEN 1 ELSE 0 END) AS lectureClasses,
            SUM(CASE WHEN a.class_type = 'Lab' THEN 1 ELSE 0 END) AS labClasses,
            SUM(CASE WHEN a.class_type = 'Tutorial' THEN 1 ELSE 0 END) AS tutorialClasses,
            SUM(CASE WHEN a.class_type = 'Lecture' AND a.attendance = 'Marked' THEN 1 ELSE 0 END) AS markedLectures,
            SUM(CASE WHEN a.class_type = 'Lab' AND a.attendance = 'Marked' THEN 1 ELSE 0 END) AS markedLabs,
            SUM(CASE WHEN a.class_type = 'Tutorial' AND a.attendance = 'Marked' THEN 1 ELSE 0 END) AS markedTutorials,
            SUM(CASE WHEN a.class_type = 'Lecture' AND a.attendance = 'Not Marked' THEN 1 ELSE 0 END) AS unmarkedLectures,
            SUM(CASE WHEN a.class_type = 'Lab' AND a.attendance = 'Not Marked' THEN 1 ELSE 0 END) AS unmarkedLabs,
            SUM(CASE WHEN a.class_type = 'Tutorial' AND a.attendance = 'Not Marked' THEN 1 ELSE 0 END) AS unmarkedTutorials
        FROM profile p
        LEFT JOIN attendance_info a ON p.user_id = a.user_id AND p.subject_code = a.subject
        WHERE p.user_id = ?
        GROUP BY p.subject_name, p.faculty_name, p.semester`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        res.json({ subjectAnalytics: results });
    });
});

module.exports = router;