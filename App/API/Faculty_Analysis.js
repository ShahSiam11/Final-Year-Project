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

router.get('/api/facultyattendance', (req, res) => {
  const sql = `
    SELECT
      subject,
      SUM(CASE WHEN attendance = 'Marked' THEN 1 ELSE 0 END) AS presents,
      SUM(CASE WHEN attendance != 'Marked' THEN 1 ELSE 0 END) AS missed,
      SUM(CASE WHEN attendance != 'Marked' AND (SELECT COUNT(*) FROM attendance_info WHERE user_id = users.id AND attendance != 'Marked') > 3 THEN 1 ELSE 0 END) AS missed_more_than_3
    FROM attendance_info
    JOIN users ON attendance_info.user_id = users.id
    GROUP BY subject`;
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

router.get('/api/faculty-subject-analytics', (req, res) => {
  const sql = `
    SELECT
      subject,
      SUM(CASE WHEN attendance = 'Marked' THEN 1 ELSE 0 END) AS marked,
      SUM(CASE WHEN attendance = 'Not Marked' THEN 1 ELSE 0 END) AS not_marked,
      SUM(CASE WHEN attendance = 'Late' THEN 1 ELSE 0 END) AS late,
      SUM(CASE WHEN attendance = 'Excused' THEN 1 ELSE 0 END) AS excused
    FROM attendance_info
    GROUP BY subject`;
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

router.get('/api/subject-user-analytics/:subject', (req, res) => {
  const subject = req.params.subject;
  const sql = `
    SELECT
      users.userid,
      users.name,
      SUM(CASE WHEN attendance_info.attendance = 'Marked' THEN 1 ELSE 0 END) AS marked,
      SUM(CASE WHEN attendance_info.attendance = 'Not Marked' THEN 1 ELSE 0 END) AS not_marked,
      SUM(CASE WHEN attendance_info.attendance = 'Late' THEN 1 ELSE 0 END) AS late,
      SUM(CASE WHEN attendance_info.attendance = 'Excused' THEN 1 ELSE 0 END) AS excused
    FROM attendance_info
    JOIN users ON attendance_info.user_id = users.id
    WHERE attendance_info.subject = ?
    GROUP BY users.userid, users.name`;
  db.query(sql, [subject], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});


module.exports = router;