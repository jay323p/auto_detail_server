const mongoose = require('mongoose');

const gallerySchema = mongoose.Schema({
  urls: {
    type: Array,
    default: [],
  },
  vehicleDescription: {
    type: String,
    default: '',
  },
  categoryTags: {
    type: Array,
    default: [],
  },
  vehicleTags: {
    type: Array,
    default: [],
  },
  userRefId: {
    type: String,
    default: '',
  },
  publicId: {
    type: String,
    default: '',
  },
});

const Gallery = mongoose.model('Gallery', gallerySchema);

module.exports = Gallery;
