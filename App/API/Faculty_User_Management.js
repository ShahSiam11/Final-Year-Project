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



// Endpoint to fetch filter options (subjects and class types)
router.get('/filters', (req, res) => {
  const querySubjects = 'SELECT DISTINCT subject FROM attendance_info';
  const queryClassTypes = 'SELECT DISTINCT class_type FROM attendance_info';

  db.query(querySubjects, (err, subjects) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    db.query(queryClassTypes, (err, classTypes) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      res.json({
        success: true,
        subjects: subjects.map(row => row.subject),
        classTypes: classTypes.map(row => row.class_type)
      });
    });
  });
});

// Endpoint to handle the search
// Endpoint to handle the search
router.get('/search/:userid', (req, res) => {
  const userId = req.params.userid;
  const { subject, classType } = req.query;

  let query = `
    SELECT a.id, u.name, u.userid, a.subject,
           DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
           a.time_joined, a.attendance, a.class_type
    FROM users u
    JOIN attendance_info a ON u.id = a.user_id
    WHERE u.userid = ?
  `;
  const queryParams = [userId];

  // Add filters for subject and class type if provided
  if (subject) {
    query += ' AND a.subject = ?';
    queryParams.push(subject);
  }
  if (classType) {
    query += ' AND a.class_type = ?';
    queryParams.push(classType);
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length > 0) {
      return res.json({ success: true, attendanceInfo: results });
    } else {
      return res.json({ success: false, message: 'No records found' });
    }
  });
});

router.post('/update-attendance', (req, res) => {
  const { recordId, attendance } = req.body;

  let query = `
    UPDATE attendance_info
    SET attendance = ?
    WHERE id = ?
  `;
  const queryParams = [attendance, recordId];

  db.query(query, queryParams, (err, result) => {
    if (err) {
      console.error('Error updating attendance:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Attendance updated successfully.' });
    } else {
      res.json({ success: false, message: 'No matching record found.' });
    }
  });
});


module.exports = router;