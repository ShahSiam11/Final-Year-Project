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


// New API to fetch notifications summary
router.get("/fetch-notifications-summary", (req, res) => {
  const userId = req.session.userId;

  const criticalQuery = `
    SELECT
      p.subject_name AS name,
      3 - COUNT(CASE WHEN a.class_type = 'Lab' AND a.attendance = 'Marked' THEN 1 END) AS missedLabs,
      3 - COUNT(CASE WHEN a.class_type = 'Tutorial' AND a.attendance = 'Marked' THEN 1 END) AS missedTutorials
    FROM profile p
    LEFT JOIN attendance_info a ON p.user_id = a.user_id AND p.subject_code = a.subject
    WHERE p.user_id = ?
    GROUP BY p.subject_name
    HAVING missedLabs > 0 OR missedTutorials > 0
  `;

  const todaysAttendanceQuery = `
    SELECT
      p.subject_name AS subject,
      a.class_type AS type,
      a.attendance = 'Marked' AS marked
    FROM attendance_info a
    JOIN profile p ON a.user_id = p.user_id AND a.subject = p.subject_code
    WHERE a.date = CURDATE() AND a.user_id = ?
  `;

  Promise.all([
    new Promise((resolve, reject) => db.query(criticalQuery, [userId], (err, results) => (err ? reject(err) : resolve(results)))),
    new Promise((resolve, reject) => db.query(todaysAttendanceQuery, [userId], (err, results) => (err ? reject(err) : resolve(results))))
  ])
    .then(([critical, todaysAttendance]) => {
      const totalNotifications = critical.length + todaysAttendance.length;
      res.json({ totalNotifications });
    })
    .catch(() => res.status(500).json({ error: "Something went wrong" }));
});


router.get("/fetch-notifications", (req, res) => {
  const userId = req.session.userId;

  const criticalQuery = `
    SELECT
      p.subject_name AS name,
      3 - COUNT(CASE WHEN a.class_type = 'Lab' AND a.attendance = 'Marked' THEN 1 END) AS missedLabs,
      3 - COUNT(CASE WHEN a.class_type = 'Tutorial' AND a.attendance = 'Marked' THEN 1 END) AS missedTutorials
    FROM profile p
    LEFT JOIN attendance_info a ON p.user_id = a.user_id AND p.subject_code = a.subject
    WHERE p.user_id = ?
    GROUP BY p.subject_name
    HAVING missedLabs > 0 OR missedTutorials > 0
  `;

  const todaysAttendanceQuery = `
    SELECT
      p.subject_name AS subject,
      a.class_type AS type,
      a.attendance = 'Marked' AS marked
    FROM attendance_info a
    JOIN profile p ON a.user_id = p.user_id AND a.subject = p.subject_code
    WHERE a.date = CURDATE() AND a.user_id = ?
  `;

  Promise.all([
    new Promise((resolve, reject) => db.query(criticalQuery, [userId], (err, results) => (err ? reject(err) : resolve(results)))),
    new Promise((resolve, reject) => db.query(todaysAttendanceQuery, [userId], (err, results) => (err ? reject(err) : resolve(results))))
  ])
    .then(([critical, todaysAttendance]) => {
      const totalNotifications = critical.length + todaysAttendance.length;
      res.json({ critical, todaysAttendance, totalNotifications });
    })
    .catch(() => res.status(500).json({ error: "Something went wrong" }));
});



router.get("/get-notifications", (req, res) => {
  const userId = req.session.userId;
  const userRole = req.session.userRole || "user";

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Static/demo branch for "user" role remains unchanged
  if (userRole === "user") {
    // Sample static notifications data
    const staticNotifications = [
      { name: "Cybersecurity", missedLabs: 2, missedTutorials: 1 },
      { name: "Machine Learning", missedLabs: 1, missedTutorials: 2 },
    ];

    // Only mark a subject as critical if missed sessions > 2
    const critical = staticNotifications.filter(
      subject => subject.missedLabs > 2 || subject.missedTutorials > 2
    );

    return res.json({
      critical,
      todaysAttendance: [
        { subject: "Cybersecurity", type: "Lecture", marked: true },
        { subject: "Machine Learning", type: "Lab", marked: false },
      ],
    });
  }

  // For real data: count the missed sessions directly
  const criticalQuery = `
    SELECT
      p.subject_name AS name,
      IFNULL(SUM(CASE WHEN a.class_type = 'Lab' AND a.attendance <> 'Marked' THEN 1 ELSE 0 END), 0) AS missedLabs,
      IFNULL(SUM(CASE WHEN a.class_type = 'Tutorial' AND a.attendance <> 'Marked' THEN 1 ELSE 0 END), 0) AS missedTutorials
    FROM profile p
    LEFT JOIN attendance_info a ON p.user_id = a.user_id AND p.subject_code = a.subject
    WHERE p.user_id = ?
    GROUP BY p.subject_name
    HAVING (missedLabs > 2 OR missedTutorials > 2)
  `;

  const todaysAttendanceQuery = `
    SELECT
      p.subject_name AS subject,
      a.class_type AS type,
      a.attendance = 'Marked' AS marked
    FROM attendance_info a
    JOIN profile p ON a.user_id = p.user_id AND a.subject = p.subject_code
    WHERE a.date = CURDATE() AND a.user_id = ?
  `;

  Promise.all([
    new Promise((resolve, reject) =>
      db.query(criticalQuery, [userId], (err, results) => (err ? reject(err) : resolve(results)))
    ),
    new Promise((resolve, reject) =>
      db.query(todaysAttendanceQuery, [userId], (err, results) => (err ? reject(err) : resolve(results)))
    )
  ])
    .then(([critical, todaysAttendance]) => res.json({ critical, todaysAttendance }))
    .catch(() => res.status(500).json({ error: "Something went wrong" }));
});

module.exports = router;