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


router.get("/greet", (req, res) => {
    if (req.session.userId) {
        res.json({
            name: req.session.userName,
            role: req.session.userRole
        });
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
});

module.exports = router;