const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const protect = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const adminToken = req.cookies.adminToken;

    console.log('token');
    console.log(token);
    console.log('adminToken');
    console.log(adminToken);

    if (!token && !adminToken) {
      res.status(401);
      throw new Error('Not authorized, please login or signup!');
    }

    let user;
    if (token) {
      const isVerified = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(isVerified.id).select('-password');
    } else if (adminToken) {
      const isVerified = jwt.verify(adminToken, process.env.JWT_SECRET);
      user = await User.findById(isVerified.id).select('-password');
    }

    if (!user) {
      res.status(401);
      throw new Error('User not found!');
    }
    req.user = user;

    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, please login or signup!');
  }
});

module.exports = protect;
