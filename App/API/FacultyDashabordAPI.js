// Copyright (c) 2025 Ahsan Latif (@GittyCandy)
// All Rights Reserved.
//
// Unauthorized access, use, reproduction, modification, distribution,  
// or creation of derivative works based on this code is strictly prohibited  
// without the prior explicit written permission of the owner.  
//
// Violators may be subject to legal action.


const express = require('express');
const router = express.Router();
const db = require('../Config/DataBaseConfig.js'); // Adjust the path as necessary

router.get("/subject-summary", (req, res) => {
  if (req.session.userId) {
    const userId = req.session.userId;

    /*
      Explanation:
      1. The subquery alias "s" gets all subjects that the current (faculty) user is enrolled in.
      2. The subquery alias "students" aggregates the counts for each subject across profiles,
         but only for users that are NOT the current user.
         - total_students: the number of enrolled students (excluding the faculty)
         - at_risk_count: counts students with more than 2 "Not Marked" attendance records.
         - avg_attendance_percentage: the average attendance percentage among these students.
      3. A LEFT JOIN ensures that even if no other students are enrolled, the subject is still returned,
         with NULL values replaced by 0 using IFNULL.
    */

    const query = `
      SELECT
        s.subject_code,
        s.subject_name,
        IFNULL(students.total_students, 0) AS total_students,
        IFNULL(students.at_risk_count, 0) AS at_risk_count,
        IFNULL(students.avg_attendance_percentage, 0) AS avg_attendance_percentage
      FROM (
          SELECT subject_code, subject_name
          FROM profile
          WHERE user_id = ?
      ) s
      LEFT JOIN (
          SELECT
            p.subject_code,
            COUNT(*) AS total_students,
            SUM(CASE WHEN IFNULL(r.count_not_marked, 0) > 2 THEN 1 ELSE 0 END) AS at_risk_count,
            ROUND(AVG(IFNULL(a.marked_ratio, 0)), 2) AS avg_attendance_percentage
          FROM profile p
          LEFT JOIN (
              SELECT a.subject AS subject_code, a.user_id, COUNT(*) AS count_not_marked
              FROM attendance_info a
              WHERE a.attendance = 'Not Marked'
              GROUP BY a.subject, a.user_id
          ) r ON r.subject_code = p.subject_code AND r.user_id = p.user_id
          LEFT JOIN (
              SELECT a.subject AS subject_code, a.user_id,
                     (SUM(CASE WHEN a.attendance = 'Marked' THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS marked_ratio
              FROM attendance_info a
              GROUP BY a.subject, a.user_id
          ) a ON a.subject_code = p.subject_code AND a.user_id = p.user_id
          WHERE p.user_id != ?
          GROUP BY p.subject_code
      ) students ON s.subject_code = students.subject_code;
    `;

    // The current userId is passed twice: once to get the faculty's subjects, and once to exclude the faculty from student counts.
    db.query(query, [userId, userId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Return the subjects regardless of whether any other students exist.
      res.json({
        name: req.session.userName,
        role: req.session.userRole,
        subjects: result
      });
    });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});


module.exports = router;
