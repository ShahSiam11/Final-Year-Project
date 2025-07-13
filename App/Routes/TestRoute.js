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

router.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/HTML/tests.html')));

module.exports = router
