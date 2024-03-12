const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const orderSchema = mongoose.Schema(
  {
    userRefId: {
      type: String,
    },
    id: {
      type: String,
    },
    vehicle: {
      type: String,
    },
    packageChosen: {
      type: Object,
    },
    addOns: {
      type: Array,
    },
    ttlPrice: {
      type: Number,
    },
    date: {
      type: Object,
    },
    mobileRequired: {
      type: Boolean,
    },
    address: {
      type: String,
    },
    county: {
      type: String,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    name: {
      type: String,
    },
    vehicleMake: {
      type: String,
    },
    vehicleModel: {
      type: String,
    },
    plateNumber: {
      type: String,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
