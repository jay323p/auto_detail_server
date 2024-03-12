const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
  reviewedBy: {
    type: String,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Please provide integer between 1-5',
    },
  },
  orderDetails: {
    type: Object,
    default: {
      packageChosen: '',
      vehicleName: '',
      ttlPrice: 0,
    },
  },
  imgSrcs: {
    type: Array,
  },
  review: {
    type: String,
  },
  checklist: {
    type: Object,
    default: {
      timelyService: false,
      needsFulfilled: false,
      professionalCrew: false,
      useServiceAgain: false,
      recommendToOthers: false,
    },
  },
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
