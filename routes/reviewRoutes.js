const express = require('express');
const router = express.Router();
const {
  quickImageUpload,
  quickDeleteImage,
  submitReview,
  getAllReviewsFromDb,
  deleteReviewAdmin,
} = require('../controllers/reviewController');
const protect = require('../middleware/authMiddleware');
const adminProtect = require('../middleware/adminMiddleware');

router.post('/quickImageUpload', protect, quickImageUpload);
router.post('/quickDeleteImage', protect, quickDeleteImage);
router.post('/submitReview', protect, submitReview);
router.get('/getReviews', getAllReviewsFromDb);
router.patch('/deleteReviewAdmin', adminProtect, deleteReviewAdmin);

module.exports = router;
