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
const router = express.Router();
const db = require('../Config/DataBaseConfig.js');

router.get('/api/users', (req, res) => {
  const search = req.query.search || '';
  // The query aggregates profile and attendance info so that each user is returned only once.
  const query = `
    SELECT
      u.userid,
      u.name,
      u.email,
      u.role,
      COALESCE(MAX(p.subject_status), '') AS subject_status,
      COALESCE(MAX(a.attendance), '') AS attendance,
      att.attendanceStatus
    FROM users u
    LEFT JOIN profile p ON u.id = p.user_id
    LEFT JOIN attendance_info a ON u.id = a.user_id
    LEFT JOIN (
      SELECT
        u2.userid,
        CASE
          WHEN COUNT(CASE WHEN a2.attendance = 'Not Marked' THEN 1 END) <= 2 THEN 'Safe'
          ELSE 'Critical'
        END AS attendanceStatus
      FROM users u2
      LEFT JOIN attendance_info a2 ON u2.id = a2.user_id
      GROUP BY u2.userid
    ) att ON u.userid = att.userid
    WHERE u.userid LIKE ?
    GROUP BY u.userid, u.name, u.email, u.role, att.attendanceStatus
  `;
  db.query(query, [`%${search}%`], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

/**
 * PUT /api/users
 * Updates a user’s details in the users table.
 * Expected JSON payload: { userid, name, email, role }
 */
router.put('/api/users', (req, res) => {
  const { userid, name, email, role } = req.body;
  const query = `
    UPDATE users
    SET name = ?, email = ?, role = ?
    WHERE userid = ?
  `;
  db.query(query, [name, email, role, userid], (err, result) => {
    if (err) throw err;
    res.json({ message: 'User updated successfully' });
  });
});

/**
 * DELETE /api/users/:userid
 * Deletes a user.
 */
router.delete('/api/users/:userid', (req, res) => {
  const userid = req.params.userid;
  const query = `DELETE FROM users WHERE userid = ?`;
  db.query(query, [userid], (err, result) => {
    if (err) throw err;
    res.json({ message: 'User deleted successfully' });
  });
});

/**
 * GET /api/subjects/:userid
 * Fetches subjects for a specific user.
 */
router.get('/api/subjects/:userid', (req, res) => {
  const userid = req.params.userid;
  const query = `
    SELECT p.id, p.subject_name, p.subject_status, a.attendance,a.time_joined, DATE_FORMAT(a.date, '%Y-%m-%d') AS formatted_date
    FROM profile p
    LEFT JOIN attendance_info a ON p.user_id = a.user_id
    WHERE p.user_id = (SELECT id FROM users WHERE userid = ?)
  `;
  db.query(query, [userid], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

/**
 * PUT /api/subjects/:userid
 * Updates one or more subject records for the user.
 * Expected payload: an array of objects with { subjectName, subjectStatus }
 */
router.put('/api/subjects/:userid', (req, res) => {
  const userid = req.params.userid;
  const updates = req.body;
  updates.forEach(update => {
    const query = `
      UPDATE profile
      SET subject_status = ?
      WHERE user_id = (SELECT id FROM users WHERE userid = ?)
      AND subject_name = ?
    `;
    db.query(query, [update.subjectStatus, userid, update.subjectName], (err, result) => {
      if (err) throw err;
    });
  });
  res.json({ message: 'Subject changes saved successfully' });
});

/**
 * DELETE /api/subjects/:subjectId
 * Deletes a subject.
 */
router.delete('/api/subjects/:subjectId', (req, res) => {
  const subjectId = req.params.subjectId;
  const query = `DELETE FROM profile WHERE id = ?`;
  db.query(query, [subjectId], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Subject deleted successfully' });
  });
});


module.exports = router;