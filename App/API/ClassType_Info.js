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
const db = require('../Config/DataBaseConfig.js');

const router = express.Router();


router.get("/attend-tut-info", (req, res) => {
    if (req.session.userId) {
        // Check if the user has the 'user' role
        if (req.session.userRole === 'user') {
            // Hardcoded tutorial attendance data for role 'user'
            const hardcodedTutData = {
                name: req.session.userName,
                role: req.session.userRole,
                recentAttendance: [
                    {
                        date: "2025-02-20",
                        time_joined: "11:00:00",
                        subject: "Tutorial on Algorithms",
                        class_type: "Tutorial",
                        time_stayed: "1:00:00",
                        attendance: "Marked"
                    },
                    {
                        date: "2025-02-18",
                        time_joined: "10:30:00",
                        subject: "Data Structures Tutorial",
                        class_type: "Tutorial",
                        time_stayed: "1:15:00",
                        attendance: "Marked"
                    }
                ]
            };
            return res.json(hardcodedTutData);
        } else {
            // For all other roles, execute the database query
            const userId = req.session.userId;
            const query = `
                SELECT a.date, a.time_joined, a.subject, a.class_type, a.time_stayed, a.attendance
                FROM attendance_info a
                WHERE a.user_id = ?
                  AND (a.class_type LIKE 'Tutorial%' OR a.class_type LIKE 'tut%' OR a.class_type LIKE 'Tut%')
                ORDER BY a.date DESC, a.time_joined DESC
                LIMIT 65;
            `;
            db.query(query, [userId], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }
                if (result.length > 0) {
                    return res.json({
                        name: req.session.userName,
                        role: req.session.userRole,
                        recentAttendance: result
                    });
                } else {
                    return res.status(404).json({ error: "No Tutorial attendance records found" });
                }
            });
        }
    } else {
        return res.status(401).json({ error: "Unauthorized" });
    }
});

router.get("/attend-lecture-info", (req, res) => {
    if (req.session.userId) {
        // Check if the user has the 'user' role
        if (req.session.userRole === 'user') {
            // Hardcoded lecture attendance data for role 'user'
            const hardcodedLectureData = {
                name: req.session.userName,
                role: req.session.userRole,
                recentAttendance: [
                    {
                        date: "2025-02-20",
                        time_joined: "08:00:00",
                        subject: "Introduction to Computer Science",
                        class_type: "Lecture",
                        time_stayed: "1:30:00",
                        attendance: "Marked"
                    },
                    {
                        date: "2025-02-19",
                        time_joined: "09:00:00",
                        subject: "Advanced Programming Lecture",
                        class_type: "Lecture",
                        time_stayed: "1:15:00",
                        attendance: "Marked"
                    }
                ]
            };
            return res.json(hardcodedLectureData);
        } else {
            // For all other roles, execute the database query
            const userId = req.session.userId;
            const query = `
                SELECT a.date, a.time_joined, a.subject, a.class_type, a.time_stayed, a.attendance
                FROM attendance_info a
                WHERE a.user_id = ?
                  AND (a.class_type LIKE 'lecture%' OR a.class_type LIKE 'lec%' OR a.class_type LIKE 'Lec%')
                ORDER BY a.date DESC, a.time_joined DESC
                LIMIT 75;
            `;
            db.query(query, [userId], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }
                if (result.length > 0) {
                    return res.json({
                        name: req.session.userName,
                        role: req.session.userRole,
                        recentAttendance: result
                    });
                } else {
                    return res.status(404).json({ error: "No lecture attendance records found" });
                }
            });
        }
    } else {
        return res.status(401).json({ error: "Unauthorized" });
    }
});

router.get("/attend-lab-info", (req, res) => {
    if (req.session.userId) {
        // Check if the logged-in user has the 'user' role
        if (req.session.userRole === 'user') {
            // Hardcoded lab attendance data for role 'user'
            const hardcodedLabData = {
                name: req.session.userName,
                role: req.session.userRole,
                recentAttendance: [
                    {
                        date: "2025-02-20",
                        time_joined: "09:00:00",
                        subject: "Computer Lab Basics",
                        class_type: "Lab",
                        time_stayed: "1:30:00",
                        attendance: "Marked"
                    },
                    {
                        date: "2025-02-19",
                        time_joined: "10:00:00",
                        subject: "Advanced Lab Techniques",
                        class_type: "Lab",
                        time_stayed: "1:00:00",
                        attendance: "Marked"
                    }
                ]
            };

            return res.json(hardcodedLabData);
        } else {
            // For all other roles, run the database query
            const userId = req.session.userId;
            const query = `
                SELECT a.date, a.time_joined, a.subject, a.class_type, a.time_stayed, a.attendance
                FROM attendance_info a
                WHERE a.user_id = ?
                  AND (a.class_type LIKE 'lab%' OR a.class_type LIKE 'Lab%' OR a.class_type LIKE 'LAb%' OR a.class_type LIKE 'Laboratory%')
                ORDER BY a.date DESC, a.time_joined DESC
                LIMIT 55;
            `;

            db.query(query, [userId], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }

                if (result.length > 0) {
                    return res.json({
                        name: req.session.userName,
                        role: req.session.userRole,
                        recentAttendance: result
                    });
                } else {
                    return res.status(404).json({ error: "No lab attendance records found" });
                }
            });
        }
    } else {
        return res.status(401).json({ error: "Unauthorized" });
    }
});

module.exports = router;