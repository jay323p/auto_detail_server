const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const adminProtect = asyncHandler(async (req, res, next) => {
  try {
    const adminToken = req.cookies.adminToken;

    if (!adminToken) {
      res.status(401);
      throw new Error('Admin access only!');
    }

    const isVerified = jwt.verify(adminToken, process.env.JWT_SECRET);

    const admin = await User.findById(isVerified.id).select('-password');

    if (!admin) {
      res.status(401);
      throw new Error('Admin not found!');
    }
    req.admin = admin;
    req.user = admin;
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized!');
  }
});

module.exports = adminProtect;
