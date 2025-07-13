// Copyright (c) 2025 Ahsan Latif (@GittyCandy)
// All Rights Reserved.
//
// Unauthorized access, use, reproduction, modification, distribution,  
// or creation of derivative works based on this code is strictly prohibited  
// without the prior explicit written permission of the owner.  
//
// Violators may be subject to legal action.


const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const cors = require("cors");

const router = express.Router();
router.use(cors());

const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/upload", upload.array("faces", 1000), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files received" });
  }

  const totalFiles = req.files.length;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  res.write(`data: Total images found: ${totalFiles}\n\n`);

  const pythonProcess = spawn("python", ["add.py", uploadDir]);

  pythonProcess.stdout.on("data", (data) => {
    const message = data.toString().trim();
    res.write(`data: ${message}\n\n`);
  });

  pythonProcess.stderr.on("data", (data) => {
    const message = data.toString().trim();
    res.write(`data: ERROR: ${message}\n\n`);
  });

  pythonProcess.on("close", (code) => {
    // Delete uploaded files after processing
    req.files.forEach(file => {
      fs.unlinkSync(file.path);
    });

    res.write(`data: Process ended. Uploaded files deleted.\n\n`);
    res.end();
  });
});

module.exports = router;