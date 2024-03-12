const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Contact = require('../models/contactsModel');
const Gallery = require('../models/galleryModel');
const Review = require('../models/reviewModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const multiparty = require('multiparty');

// POST SUBMIT REVIEW -------------------------------------------------------------------------------------------
const submitReview = asyncHandler(async (req, res) => {
  const { reviewedBy, rating, orderDetails, imgSrcs, review, checklist } =
    req.body;

  if (
    !reviewedBy ||
    !review ||
    !rating ||
    !orderDetails ||
    !imgSrcs ||
    !checklist
  ) {
    res.status(400);
    throw new Error(
      'Please provide all required fields and submit at least one image!'
    );
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Please provide an integer rating between 1-5');
  }

  const userReview = await Review.create({
    reviewedBy,
    rating,
    orderDetails,
    imgSrcs,
    review,
    checklist,
  });

  if (userReview) {
    res.status(200).json(userReview);
  } else {
    res.status(400);
    throw new Error('Unable to upload review, please try again!');
  }
});

// QUICK IMAGE UPLOAD
const quickImageUpload = asyncHandler(async (req, res) => {
  if (!req.body.file) {
    res.status(400);
    throw new Error('Unable to upload image!');
  }
  const urls = [];
  const form = new multiparty.Form({ maxFieldsSize: '20MB' });
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
      urls.push(result.secure_url);
      const sendObject = {
        urls,
        publicId: result.public_id,
      };
      res.status(200).json(sendObject);
    } catch (error) {
      res.status(400);
      throw new Error(error);
    }
  });
});

// QUICK IMAGE DELETE
const quickDeleteImage = asyncHandler(async (req, res) => {
  const publicId = req.body.publicId;

  if (!publicId) {
    res.status(400);
    throw new Error('Unable to locate image for deletion!');
  }

  cloudinary.uploader
    .destroy(publicId)
    .then(async (result) => {
      res.status(200).json('Image Deleted');
    })
    .catch((err) => {
      res.status(400);
      throw new Error(err);
    });
});

// GET ALL REVIEWS
const getAllReviewsFromDb = asyncHandler(async (req, res) => {
  const allReviews = await Review.find();

  res.status(200).json(allReviews);
});

// DELETE REVIEW (ADMIN)
const deleteReviewAdmin = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || id.length !== 24) {
    res.status(400);
    throw new Error('Unable to find review for deletion!');
  }

  const review = await Review.findById(id);

  if (!review) {
    res.status(400);
    throw new Error('Unable to find review for deletion!');
  } else {
    await Review.findByIdAndDelete(id);
    const reviews = await Review.find();
    res.status(200).json(reviews);
  }
});

module.exports = {
  quickImageUpload,
  quickDeleteImage,
  submitReview,
  getAllReviewsFromDb,
  deleteReviewAdmin,
};
