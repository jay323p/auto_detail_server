const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  loginStatus,
  logoutUser,
  loginAdmin,
  registerAdmin,
  resetUserPassword,
  forgotPassword,
  resetPasswordFromEmailLink,
  sendEmailVerification,
  verifyEmail,
  editUserProfile,
  getAllUserContactInfo,
  uploadPhotosAdmin,
  getAllImagesFromCloud,
  getPaginatedGalleryImages,
  deleteImage,
  getEmailVerification,
  getClientEmailVerification,
  requestedMoreInfo,
} = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');
const adminProtect = require('../middleware/adminMiddleware');

router.post('/register', registerUser);
router.post('/registerAdmin', registerAdmin);
router.post('/login', loginUser);
router.post('/loginAdmin', loginAdmin);
router.get('/loginStatus', loginStatus);
router.patch('/resetPassword', protect, resetUserPassword);
router.post('/forgotpass', forgotPassword);
router.put('/resetPasswordEmail/:resetToken', resetPasswordFromEmailLink);
router.post('/sendEmailVerification', sendEmailVerification);
router.put('/verifyEmail/:emailVerifyToken', verifyEmail);
router.post('/getEmailVerification', getEmailVerification);
router.post(
  '/getClientEmailVerification',
  adminProtect,
  getClientEmailVerification
);
router.patch('/editUserProfile', protect, editUserProfile);
router.get('/logoutUser', logoutUser);
router.get('/getAllUserContactInfo', adminProtect, getAllUserContactInfo);
router.post('/uploadPhotosAdmin', uploadPhotosAdmin);
router.get('/getImagesFromCloud', getAllImagesFromCloud);
router.get('/getPaginatedGalleryImages', getPaginatedGalleryImages);
router.delete('/deleteImg', adminProtect, deleteImage);
router.post('/requestInfo', requestedMoreInfo);

module.exports = router;
