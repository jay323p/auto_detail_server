const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Contact = require('../models/contactsModel');
const Gallery = require('../models/galleryModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const multiparty = require('multiparty');
const Token = require('../models/tokenModel');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const template1 = require('../utils/emailTemplates');

// GEN TOKEN -----------------------------------------------------------------------------------------------
const genToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// REGISTER USER -------------------------------------------------------------------------------------------
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, confirmPassword } = req.body;

  if (!name || !email || !password || !phone || !confirmPassword) {
    res.status(400);
    throw new Error('Please fill out all the fields!');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be atleast 6 characters long!');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match!');
  }

  // check if email already registered
  const emailCheck = await User.findOne({ email });

  if (emailCheck) {
    res.status(400);
    throw new Error(
      'Email has already been registered, please provide a different one!'
    );
  }

  // validation pass -> create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
  });

  // genToken for auth
  const token = genToken(user._id);

  //   send http-only cookie
  res.cookie('token', token, {
    path: '/',
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: 'none',
    secure: true,
  });

  if (user) {
    const { _id, name, email } = user;

    //   update contacts arr with new contact
    const allContacts = await Contact.find({});
    const newContactData = {
      _id,
      name,
      email,
      phone,
      privilege: 'Basic',
      activeOrders: [],
      archivedOrders: [],
    };
    const updatedQtyNewClients = allContacts[0].qtyNewClients + 1;
    allContacts[0].clientContacts.push(newContactData);
    allContacts[0].newClients = true;
    allContacts[0].qtyNewClients = updatedQtyNewClients;
    allContacts[0].markModified('clientContacts');
    allContacts[0].markModified('newClients');
    allContacts[0].markModified('qtyNewClients');
    await allContacts[0].save();

    res.status(200).json({
      _id,
      name,
      email,
      phone,
      privilege: 'Basic',
      token,
      activeOrders: [],
      archivedOrders: [],
    });
  } else {
    res.status(400);
    throw new Error('Unable to register user, please try again!');
  }
});

// REGISTER ADMIN -------------------------------------------------------------------------------------------
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, password, confirmPassword, adminCode } = req.body;

  if (
    !name ||
    !email ||
    !password ||
    !phone ||
    !adminCode ||
    !confirmPassword
  ) {
    res.status(400);
    throw new Error('Please fill out all the fields!');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be atleast 6 characters long!');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match!');
  }

  // check if email already registered
  const emailCheck = await User.findOne({ email });

  if (emailCheck) {
    res.status(400);
    throw new Error(
      'Email has already been registered, please provide a different one!'
    );
  }

  if (adminCode !== process.env.ADMIN_CODE) {
    res.status(404);
    throw new Error('Unable to create administrator account!');
  }

  // validation pass -> create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    privilege: 'Admin',
  });

  // genToken for auth
  const adminToken = genToken(user._id);

  // send http-only cookie
  res.cookie('adminToken', adminToken, {
    path: '/',
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: 'none',
    secure: true,
  });

  if (user) {
    const { _id, name, email } = user;
    res.status(200).json({
      _id,
      name,
      email,
      phone,
      privilege: 'Admin',
      adminToken,
      activeOrders: [],
      archivedOrders: [],
    });
  } else {
    res.status(400);
    throw new Error('Unable to register user, please try again!');
  }
});

// LOGIN USER -------------------------------------------------------------------------------------------
const loginUser = asyncHandler(async (req, res) => {
  // req.body validation
  const { email, password } = req.body;
  console.log(email);
  console.log(password);
  if ((!email, !password)) {
    res.status(400);
    throw new Error('Please provide an email and password!');
  }

  // check if user exists in db
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error('User not found, please register!');
  }

  if (user.privilege === 'Admin') {
    res.status(404);
    throw new Error('Please login through admin link!');
  }

  // user exists, check password
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  // gen token for auth
  const token = genToken(user._id);

  // SEND HTTP-ONLY COOKIE
  res.cookie('token', token, {
    path: '/',
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1-DAY EXPIRATION
    sameSite: 'none',
    secure: true,
  });

  // user found and passwords match
  if (user && passwordIsCorrect) {
    const { _id, name, email, phone, activeOrders, archivedOrders } = user;
    res.status(200).json({
      _id,
      name,
      email,
      phone,
      privilege: 'Basic',
      token,
      activeOrders,
      archivedOrders,
    });
  } else {
    res.status(400);
    throw new Error('Invalid email or password!');
  }
});

// LOGIN ADMIN -------------------------------------------------------------------------------------------
const loginAdmin = asyncHandler(async (req, res) => {
  // req.body validation
  const { email, password } = req.body;
  console.log(email);
  console.log(password);
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide an email and password!');
  }

  // check if user exists in db
  const user = await User.findOne({ email });

  console.log('user');
  console.log(user);

  if (!user) {
    res.status(400);
    throw new Error('User not found, please register!');
  }

  if (user.privilege !== 'Admin') {
    res.status(404);
    throw new Error('Account does not have admin status!');
  }

  // user exists, check password
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  // gen token for auth
  const adminToken = genToken(user._id);

  // SEND HTTP-ONLY COOKIE
  res.cookie('adminToken', adminToken, {
    path: '/',
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1-DAY EXPIRATION
    sameSite: 'none',
    secure: true,
  });

  // user found and passwords match
  if (user && passwordIsCorrect) {
    const { _id, name, email, phone, activeOrders, archivedOrders } = user;
    res.status(200).json({
      _id,
      name,
      email,
      phone,
      privilege: 'Admin',
      adminToken,
      activeOrders,
      archivedOrders,
    });
  } else {
    res.status(400);
    throw new Error('Invalid email or password!');
  }
});

// RESET USER PASSWORD -------------------------------------------------------------------------------
const resetUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword, userRefId } = req.body;

  if (!oldPassword || !newPassword || !confirmNewPassword) {
    res.status(400);
    throw new Error('Old and/or new password not provided for reset!');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error(
      'Please make sure new password is at least 6 characters long!'
    );
  }

  if (newPassword !== confirmNewPassword) {
    res.status(400);
    throw new Error('New password and confirm password do not match!');
  }

  if (!userRefId) {
    res.status(400);
    throw new Error('User ID not provided!');
  }

  const user = await User.findById(userRefId);

  if (!user) {
    res.status(404);
    throw new Error('Unauthorized to reset user password!');
  }

  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  if (passwordIsCorrect) {
    user.password = newPassword;
    user.markModified('password');
    await user.save();
    const { _id, name, email, phone, activeOrders, archivedOrders, privilege } =
      user;

    res.status(200).json({
      _id,
      name,
      email,
      phone,
      activeOrders,
      archivedOrders,
      privilege,
    });
  } else {
    res.status(400);
    throw new Error('Unable to reset password!');
  }
});

// SEND EMAIL VERIFICATION -----------------------------------------------------------------------------
const sendEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found, please register!');
  }

  // new token
  let emailVerifyToken = crypto.randomBytes(32).toString('hex') + user._id;

  // hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(emailVerifyToken)
    .digest('hex');

  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 1440 * (60 * 1000),
  }).save();

  const resetUrl = `${process.env.FRONTEND_URL}/verifyEmail/${emailVerifyToken}`;

  const message = `
    <h2>Hello ${user.name}</h2>
    <p>Please use the url below to verify your email!</p>
    <p>This reset link is valid for only 1 day!</p>

    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

    <p>Regards...</p>
    <p>Jay\'s Auto Spa</p>
    `;
  const subject = "Verify Email For Jay's Auto Spa";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  console.log('SENDING -----------------------------------------');

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: 'Please Verify Email' });
  } catch (error) {
    res.status(500);
    throw new Error('Problem sending verification email!');
  }
});

// Verify Email --------------------------------------------------------------------------------------
const verifyEmail = asyncHandler(async (req, res) => {
  const { emailVerifyToken } = req.params;

  const hashedToken = crypto
    .createHash('sha256')
    .update(emailVerifyToken)
    .digest('hex');

  // FIND TOKEN IN DB
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error(
      'Email Verification Token Expired or Email Already Verified!'
    );
  }

  // TOKEN = VALID, FIND USER TO UPDATE PASSWORD
  const user = await User.findOne({ _id: userToken.userId });

  if (!user) {
    res.status(404);
    throw new Error('Unable to find user at the moment!');
  }

  user.emailVerified = true;
  user.markModified('emailVerified');
  await user.save();

  res.status(200).json(user);
});

// GET EMAIL VERIFICATION ---------------------------------------------------------------------------------
const getEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log(email);

  if (!email) {
    res.status(400);
    throw new Error(
      'Please create an account and verify your email to get started.'
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error(
      'Please create an account and verify your email to get started.'
    );
  }

  const emailVerified = user.emailVerified;
  res.status(200).json(emailVerified);
});

// GET CLIENT EMAIL VERIFICATION ---------------------------------------------------------------------------------
const getClientEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log(email);

  if (!email) {
    res.status(400);
    throw new Error('Email of user not provided! User may not exist anymore.');
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error('User may not exist anymore.');
  }

  const emailVerified = user.emailVerified;
  res.status(200).json(emailVerified);
});

// FORGOT PASSWORD ------------------------------------------------------------------------------------
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found, please register!');
  }

  // delete prev reset token if
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // new token
  let resetToken = crypto.randomBytes(32).toString('hex') + user._id;

  // hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000),
  }).save();

  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  const message = `
    <h2>Hello ${user.name}</h2>
    <p>Please use the url below to reset your password!</p>
    <p>This reset link is valid for only 30 minutes!</p>

    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

    <p>Regards...</p>
    <p>Jay\'s Auto Spa</p>
    `;
  const subject = 'Password Reset Request';
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: 'Reset Email Sent' });
  } catch (error) {
    res.status(500);
    throw new Error('Email not sent, please try again!');
  }
});

// RESET PASSWORD FROM EMAIL LINK -----------------------------------------------------------------------
const resetPasswordFromEmailLink = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;
  const { resetToken } = req.params;

  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // FIND TOKEN IN DB
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error(
      'Invalid or Expired Token, please try to send another reset email! '
    );
  }

  // TOKEN = VALID, FIND USER TO UPDATE PASSWORD
  const user = await User.findOne({ _id: userToken.userId });

  if (!user) {
    res.status(404);
    throw new Error('Unable to find user at the moment!');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match!');
  }
  user.password = password;
  await user.save();

  res.status(200).json({
    message: 'Password Reset Success',
  });
});

// EDIT USER PROFILE --------------------------------------------------------------------------------------
const editUserProfile = asyncHandler(async (req, res) => {
  const { userRefId, name, phone } = req.body;

  if (!name || !phone) {
    res.status(400);
    throw new Error('Please ensure all fields are filled in before submitting');
  }
  if (!userRefId || userRefId.length !== 24) {
    res.status(404);
    throw new Error('User not found: please ensure proper login');
  }

  const user = await User.findById(userRefId);
  if (!user) {
    res.status(404);
    throw new Error('User not found: user id reference does not match');
  }

  user.name = name;
  user.phone = phone;

  user.markModified('name');
  user.markModified('phone');

  await user.save();

  res.status(200).json(user);
});

// LOGOUT USER ---------------------------------------------------------------------------------------------
const logoutUser = asyncHandler(async (req, res) => {
  // clear auth token
  res.cookie('token', '', {
    path: '/',
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'none',
    secure: true,
  });
  // clear adminToken
  res.cookie('adminToken', '', {
    path: '/',
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'none',
    secure: true,
  });

  return res.status(200).json({ message: 'Successfully Logged Out!' });
});

// GET LOGIN STATUS ------------------------------------------------------------------------------------------
const loginStatus = asyncHandler(async (req, res) => {
  // retreive token from cookies
  const token = req.cookies.token;

  if (!token) {
    return res.json(false);
  }

  // VERIFY TOKEN
  const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);

  if (verifiedToken) {
    return res.json(true);
  }

  return res.json(false);
});

// GET ALL USER CONTACT INFO (ADMIN) ------------------------------------------------------------------------
const getAllUserContactInfo = asyncHandler(async (req, res) => {
  const admin = req.admin;

  if (!admin || admin.privilege !== 'Admin') {
    res.status(404);
    throw new Error('Unauthorized!');
  }

  const allUsers = await User.find({});

  if (!allUsers) {
    res.status(400);
    throw new Error('Unable to find users at the moment');
  }

  let contactsArr = [];

  for (let i = 0; i < allUsers.length; i++) {
    let contactObj = {
      _id: '',
      name: '',
      email: '',
      phone: '',
      privilege: '',
      activeOrders: [],
      archivedOrders: [],
    };
    console.log(`${allUsers[i].name}`);
    contactObj._id = allUsers[i]._id;
    contactObj.name = allUsers[i].name;
    contactObj.email = allUsers[i].email;
    contactObj.phone = allUsers[i].phone;
    contactObj.privilege = allUsers[i].privilege;
    contactObj.activeOrders = allUsers[i].activeOrders;
    contactObj.archivedOrders = allUsers[i].archivedOrders;
    contactsArr.push(contactObj);
  }

  res.status(200).json(contactsArr);
});

// UPLOAD PHOTOS TO GALLERY (ADMIN)
const uploadPhotosAdmin = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { vehicleDescription, categoryTags, vehicleTags, userRefId } = req.body;

  if (!vehicleDescription || !categoryTags || !vehicleTags || !userRefId) {
    res.status(400);
    throw new Error('Please provide all fields!');
  }
  const urls = [];
  const form = new multiparty.Form({ maxFieldsSize: '20MB' });
  console.log(form);
  form.parse(req, async function (err, fields, files) {
    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      folder: '/test',
    };
    const filesData = req.body.file;
    const imagePath = filesData;
    try {
      const result = await cloudinary.uploader.upload(imagePath, options);
      console.log('result -------------------------=========================');
      console.log(result);
      urls.push(result.secure_url);
      const sendObject = {
        urls,
        vehicleDescription,
        categoryTags,
        vehicleTags,
        publicId: result.public_id,
      };

      const newGallerySubmission = await Gallery.create({
        urls,
        vehicleDescription,
        categoryTags,
        vehicleTags,
        userRefId,
        publicId: result.public_id,
      });

      if (newGallerySubmission) {
        return res.status(200).json(sendObject);
      }
    } catch (error) {
      console.error(error);
      return res.status(400);
    }
  });
});

// GET ALL IMAGES FROM CLOUDINARY
const getAllImagesFromCloud = asyncHandler(async (req, res) => {
  let imgs = [];
  cloudinary.search
    .expression(
      'folder:test' // add your folder
    )
    .sort_by('public_id', 'desc')
    .max_results(30)
    .execute()
    .then((result) => {
      let urls = [];
      for (let i = 0; i < result.resources.length; i++) {
        urls.push(result.resources[i].secure_url);
      }

      if (urls.length > 0) {
        res.status(200).json(urls);
      } else {
        res.status(400);
        throw new Error('Unable to retreive images at this moment!');
      }
    })
    .catch((error) => {
      res.status(400);
      throw new Error(error);
    });
});

// GET PAGINATED GALLERY IMAGES
const getPaginatedGalleryImages = asyncHandler(async (req, res) => {
  const pageSize = 4;
  const page = parseInt(req.query.page || '0');
  const filter = req.query.filter;
  console.log('filter');
  console.log(filter);
  if (filter === 'noFilter') {
    console.log('regular');
    const totalCount = await Gallery.countDocuments({});
    const paginatedImgs = await Gallery.find({})
      .limit(pageSize)
      .skip(pageSize * page);
    res.json({
      totalPages: Math.ceil(totalCount / pageSize),
      paginatedImgs,
    });
  } else {
    console.log('here');
    const totalCount = await Gallery.countDocuments({
      $or: [{ categoryTags: filter }, { vehicleTags: filter }],
    });
    const paginatedImgs = await Gallery.find({
      $or: [{ categoryTags: filter }, { vehicleTags: filter }],
    })
      .limit(pageSize)
      .skip(pageSize * page);

    console.log(totalCount);
    console.log(pageSize);
    res.json({
      totalPages: Math.ceil(totalCount / pageSize),
      paginatedImgs,
    });
  }
});

// DELETE IMAGE FROM CLOUD AND DB
const deleteImage = asyncHandler(async (req, res) => {
  const imgId = req.query.imgId;

  if (!imgId) {
    res.status(400);
    throw new Error('Unable to locate image for deletion!');
  }

  const imgInGallery = await Gallery.findById(imgId);

  if (!imgInGallery) {
    res.status(400);
    throw new Error('Image instance not found!');
  }

  const publicId = imgInGallery.publicId;

  cloudinary.uploader
    .destroy(publicId)
    .then(async (result) => {
      const deletedImg = await Gallery.findByIdAndDelete(imgId);

      if (deletedImg) {
        res.status(200).json(deletedImg);
      }
    })
    .catch((err) => {
      res.status(400);
      throw new Error(err);
    });
});

// REQUEST MORE INFO ------------------------------------------------------------------------------------
const requestedMoreInfo = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    res.status(400);
    throw new Error('Please provide all fields!');
  }

  //   const resetUrl = `${process.env.FRONTEND_URL}/verifyEmail/${emailVerifyToken}`;

  const message = template1.template1;
  const subject = `Welcome, ${name} to Jay\'s Auto Spa`;
  const send_to = email;
  const sent_from = process.env.EMAIL_USER;

  console.log('SENDING -----------------------------------------');
  console.log('message -----------------------------------------');
  console.log(typeof message);

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res
      .status(200)
      .json({ success: true, message: 'More Information Sent To Email' });
  } catch (error) {
    res.status(500);
    throw new Error('Problem sending email!');
  }
});

module.exports = {
  registerUser,
  registerAdmin,
  loginUser,
  loginAdmin,
  loginStatus,
  resetUserPassword,
  forgotPassword,
  resetPasswordFromEmailLink,
  sendEmailVerification,
  verifyEmail,
  getEmailVerification,
  getClientEmailVerification,
  editUserProfile,
  logoutUser,
  getAllUserContactInfo,
  uploadPhotosAdmin,
  getAllImagesFromCloud,
  getPaginatedGalleryImages,
  deleteImage,
  requestedMoreInfo,
};
