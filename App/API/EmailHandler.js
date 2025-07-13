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
const nodemailer = require('nodemailer');
const router = express.Router();


const transporter = nodemailer.createTransport({
  host: 'web1.revivenode.com',
  port: 587,
  secure: false, // Using STARTTLS
  auth: {
    user: 'candy@pixelatednetwork.com',
    pass: 'fDp8qAGFxPZAFvptHVNY'
  },
  dkim: {
    domainName: 'pixelatednetwork.com',
    keySelector: 'default'
  }
});

// Save a new event (inserting into the database)
router.post('/api/saveEvent', (req, res) => {
  const { user_id, title, date, startMinutes, endMinutes, notification_email } = req.body;
  if (!user_id || !title || !date || startMinutes == null || endMinutes == null || !notification_email) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const sql = "INSERT INTO events (user_id, title, date, start_minutes, end_minutes, notification_email) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [user_id, title, date, startMinutes, endMinutes, notification_email], (err, result) => {
    if (err) {
      console.error("Error inserting event:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Event saved successfully", event_id: result.insertId });
  });
});

// Retrieve events for a given user
router.get('/api/getEvents/:user_id', (req, res) => {
  const { user_id } = req.params;
  const sql = "SELECT * FROM events WHERE user_id = ?";
  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("Error fetching events:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Delete an event
router.delete('/api/deleteEvent/:event_id', (req, res) => {
  const { event_id } = req.params;
  const sql = "DELETE FROM events WHERE id = ?";
  db.query(sql, [event_id], (err, result) => {
    if (err) {
      console.error("Error deleting event:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Event deleted successfully" });
  });
});

// Send email notification endpoint
router.post('/api/sendNotification', (req, res) => {
  const { title, date, startMinutes, email, message } = req.body;

  // Convert event start to a Date object for display purposes
  const eventDate = new Date(date);
  eventDate.setHours(Math.floor(startMinutes / 60));
  eventDate.setMinutes(startMinutes % 60);
  eventDate.setSeconds(0);
  const eventTimeStr = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Use provided email or a default
  const recipient = email || 'candymonsta640@gmail.com';

  const mailOptions = {
    from: 'candy@pixelatednetwork.com',
    to: recipient,
    subject: `Upcoming Event Reminder: ${title}`,
    text: message || `Reminder: Your event "${title}" is starting at ${eventTimeStr} on ${date}.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Error sending email' });
    }
    console.log('Email sent successfully:', info.response);
    res.json({ message: 'Email sent successfully', info: info.response });
  });
});

module.exports = router;