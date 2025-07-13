// Copyright (c) 2025 Ahsan Latif (@GittyCandy)
// All Rights Reserved.
//
// Unauthorized access, use, reproduction, modification, distribution,  
// or creation of derivative works based on this code is strictly prohibited  
// without the prior explicit written permission of the owner.  
//
// Violators may be subject to legal action.

const express = require("express");
const router = express.Router();
const path = require('path');
const db = require('../Config/DataBaseConfig.js');
const bcrypt = require('bcryptjs');

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/HTML/register.html'));
});

router.post('/', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {

          res.redirect('/register?error=Server%20Not%20Responding');
    } else if (results.length === 0) {
      // Redirect back to the register.html page with an error message
      res.redirect('/register?error=Inncorect%20password');
    } else {
      bcrypt.compare(password, results[0].password, (err, isMatch) => {
        if (err) {

          res.redirect('/register?error=Server%20Not%20Responding');
        } else if (!isMatch) {
          // Redirect back with the error message
          res.redirect('/register?error=Inncorect%20password');
        } else {
          req.session.userId = results[0].id;
          req.session.userName = results[0].name;
          req.session.userRole = results[0].role;
          if (results[0].role === 'admin') {
            res.redirect('/HTML/Admin/admindashboard.html');
          } else if (results[0].role === 'faculty') {
            res.redirect('/HTML/Faculty/facultydashboard.html');
          } else {
            res.redirect('/Dashboard');
          }
        }
      });
    }
  });
});

module.exports = router;
