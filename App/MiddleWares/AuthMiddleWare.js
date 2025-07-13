# Copyright (c) 2025 Ahsan Latif (@GittyCandy)
# All Rights Reserved.
#
# Unauthorized access, use, reproduction, modification, distribution,  
# or creation of derivative works based on this code is strictly prohibited  
# without the prior explicit written permission of the owner.  
#
# Violators may be subject to legal action.


module.exports = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};
