// Copyright (c) 2025 Ahsan Latif (@GittyCandy)
// All Rights Reserved.
//
// Unauthorized access, use, reproduction, modification, distribution,  
// or creation of derivative works based on this code is strictly prohibited  
// without the prior explicit written permission of the owner.  
//
// Violators may be subject to legal action.

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../Faces/face_Images');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Use the original file name without any modification
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

// Upload route
router.post('/', upload.single('user_image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'No file uploaded' });
        }

        // Example: Process the file or save it
        const processedImages = [req.file.filename];

        // Respond with success and details about the uploaded file
        return res.status(200).json({
            status: 'success',
            message: 'File uploaded successfully',
            processed_images: processedImages,
        });
    } catch (error) {
        console.error('Error during file upload:', error);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

module.exports = router;
