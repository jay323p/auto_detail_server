const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Calendar = require('../models/calendarModel');
const Order = require('../models/orderModel');
const Contact = require('../models/contactsModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dateFns = require('date-fns');
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail');
const { generateTemplate2 } = require('../utils/emailTemplates');
const ObjectId = require('mongodb').ObjectId;

// SUBMIT USER ORDER
const submitUserOrder = asyncHandler(async (req, res) => {
  // save order to Order model with all params
  // store reference in resp. User under activeOrders array

  const {
    userRefId,
    id,
    vehicle,
    packageChosen,
    addOns,
    ttlPrice,
    date,
    mobileRequired,
    address,
    county,
    phone,
    email,
    name,
    vehicleMake,
    vehicleModel,
    plateNumber,
  } = req.body;

  if (
    !userRefId ||
    !id ||
    !vehicle ||
    !packageChosen ||
    !addOns ||
    !ttlPrice ||
    !date ||
    !phone ||
    !email ||
    !name ||
    !vehicleMake ||
    !vehicleModel ||
    !plateNumber
  ) {
    res.status(400);
    throw new Error('Please fill out all fields before submitting order!');
  }

  const user = await User.findById(userRefId);

  console.log('orderr received --------------');
  console.log('user');
  console.log(user);

  if (!user) {
    res.status(404);
    throw new Error(
      'Please ensure you are properly signed in before submitting!'
    );
  }

  const newOrder = await Order.create({
    userRefId,
    id,
    vehicle,
    packageChosen,
    addOns,
    ttlPrice,
    date,
    mobileRequired,
    address,
    county,
    phone,
    email,
    name,
    vehicleMake,
    vehicleModel,
    plateNumber,
    completed: false,
  });

  if (newOrder) {
    const allContacts = await Contact.find({});
    const updatedQtyClientUpdates = allContacts[0].qtyClientUpdates + 1;
    console.log('allContacts');
    console.log(allContacts);

    const contactsWithUpdatedContactRemoved =
      allContacts[0].clientContacts.filter(
        (contact) => contact._id.toString() !== userRefId.toString()
      );
    const contactToUpdate = allContacts[0].clientContacts.filter(
      (contact) => contact._id.toString() === userRefId.toString()
    );
    console.log('contactsWithUpdatedContactRemoved -----------------------');
    console.log(contactsWithUpdatedContactRemoved);
    console.log('contactToUpdate --------------------------------------');
    console.log(contactToUpdate);
    contactToUpdate[0].activeOrders.push(newOrder._id);
    contactsWithUpdatedContactRemoved.push(contactToUpdate[0]);
    allContacts[0].clientContacts = [];
    allContacts[0].clientContacts = contactsWithUpdatedContactRemoved;
    allContacts[0].clientUpdates = true;
    allContacts[0].qtyClientUpdates = updatedQtyClientUpdates;

    const msgName = newOrder.name;
    const msgDate =
      newOrder.date.dateChosen.localDate +
      ' ' +
      'at' +
      ' ' +
      newOrder.date.interval;
    const msgVehicle = newOrder.vehicleMake + ' ' + newOrder.vehicleModel;
    const msgPackage = newOrder.packageChosen.title;
    const msgPrice = newOrder.ttlPrice.toString();
    const addOnsArr = [];

    for (let i = 0; i < newOrder.addOns.length; i++) {
      addOnsArr.push(newOrder.addOns[i].title);
    }

    const msgAddOns = addOnsArr.join(', ');
    const message = generateTemplate2(
      msgName,
      msgDate,
      msgVehicle,
      msgPackage,
      msgAddOns,
      msgPrice
    );

    //   send email confirmation
    const accountURL = `${process.env.FRONTEND_URL}/account`;
    const subject = `Jay\'s Auto Spa Detail Appointment Confirmed`;
    const send_to = newOrder.email;
    const sent_from = process.env.EMAIL_USER;
    try {
      await sendEmail(subject, message, send_to, sent_from);
      allContacts[0].markModified('clientContacts');
      allContacts[0].markModified('clientUpdates');
      allContacts[0].markModified('qtyClientUpdates');
      await allContacts[0].save();
      user.activeOrders.push(newOrder._id);
      user.markModified('activeOrders');
      await user.save();
      res.status(200).json(newOrder);
      // res.send(newOrder);
    } catch (error) {
      res.status(500);
      throw new Error('Email not sent, please try again!');
    }
  }
});

// GET USER UNCOMPLETED ORDERS
const getUserOrders = asyncHandler(async (req, res) => {
  const user = req.user;
  console.log(user);

  if (!user) {
    res.status(404);
    throw new Error(
      "Don't hesitate to restore your vehicle, signup and book today!"
    );
  }

  const userActiveOrders = user.activeOrders;
  const userOrders = [];
  if (userActiveOrders.length === 0) {
    res.status(200).json(userOrders);
  } else {
    for (let i = 0; i < userActiveOrders.length; i++) {
      const order = await Order.findById(userActiveOrders[i]);
      if (order && order.completed === false) {
        userOrders.push(order);
      }
    }
    res.status(200).json(userOrders);
  }
});

// GET USER COMPLETED ORDERS
const getCompletedUserOrders = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    res.status(404);
    throw new Error(
      "Don't hesitate to restore your vehicle, signup and book today!"
    );
  }

  const userCompletedOrders = user.archivedOrders;
  console.log(userCompletedOrders);
  const userOrders = [];
  if (userCompletedOrders.length === 0) {
    res.status(200).json(userOrders);
  } else {
    for (let i = 0; i < userCompletedOrders.length; i++) {
      const order = await Order.findById(userCompletedOrders[i]);
      if (order && order.completed === true) {
        userOrders.push(order);
      }
    }
    res.status(200).json(userOrders);
  }
});

// EDIT USER ORDER
const editUserOrder = asyncHandler(async (req, res) => {
  console.log(req.body);

  const {
    _id,
    id,
    vehicle,
    packageChosen,
    addOns,
    ttlPrice,
    date,
    mobileRequired,
    address,
    county,
    phone,
    email,
    name,
    vehicleMake,
    vehicleModel,
    plateNumber,
  } = req.body;

  if (
    !_id ||
    !id ||
    !vehicle ||
    !packageChosen ||
    !addOns ||
    !ttlPrice ||
    !date ||
    !phone ||
    !email ||
    !name ||
    !vehicleMake ||
    !vehicleModel ||
    !plateNumber
  ) {
    res.status(400);
    throw new Error('Please fill out all fields before submitting order!');
  }

  const userOrder = await Order.findById(_id);

  if (!userOrder) {
    res.status(400);
    throw new Error('Unable to find order for update!');
  }

  userOrder.name = name;
  userOrder.phone = phone;
  userOrder.email = email;
  userOrder.vehicleMake = vehicleMake;
  userOrder.vehicleModel = vehicleModel;
  userOrder.plateNumber = plateNumber;

  if (mobileRequired) {
    userOrder.address = address;
  }

  await userOrder.save();
  res.status(200).json(userOrder);
});

// DELETE USER ORDER
const deleteUserOrder = asyncHandler(async (req, res) => {
  // find order using id to locate date/timeSlot to make reservable again
  const { _id } = req.body;
  const user = req.user;

  if (!user) {
    res.status(404);
    throw new Error('Please login before cancelling appointment!');
  }

  if (!_id) {
    res.status(400);
    throw new Error('Order ID not provided, please call us for cancellation!');
  }

  const userProfile = await User.findById(user._id);
  const newActiveOrders = userProfile.activeOrders.filter(
    (order) => order.toHexString() !== _id
  );
  console.log(newActiveOrders);
  userProfile.activeOrders = [];
  userProfile.activeOrders = newActiveOrders;
  userProfile.markModified('activeOrders');

  const deletedOrder = await Order.findByIdAndDelete(_id);

  if (deletedOrder) {
    await userProfile.save();
    res.status(200).json(userProfile);
  } else {
    res.status(400);
    throw new Error('Unable to delete user order');
  }
});

// GET ALL ORDERS (ADMIN)
const getAllCustomerOrders = asyncHandler(async (req, res) => {
  if (!req.admin || req.admin.privilege !== 'Admin') {
    res.status(404);
    throw new Error('Access denied!');
  }

  const allOrders = await Order.find({});
  const uncompletedOrders = allOrders.filter(
    (order) => order.completed === false
  );
  const completedOrders = allOrders.filter((order) => order.completed === true);
  res.status(200).json({ uncompletedOrders, completedOrders });
});

// GET SINGLE USER ORDER (ADMIN)
const getSingleCustomerOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!req.admin || req.admin.privilege !== 'Admin') {
    res.status(404);
    throw new Error('Access denied!');
  }

  if (!orderId || orderId.length !== 24) {
    res.status(400);
    throw new Error('Order Id not provided or not valid!');
  }

  const singleOrder = await Order.findById(orderId);

  if (!singleOrder) {
    res.status(400);
    throw new Error('Order no longer exists in database!');
  }

  res.status(200).json(singleOrder);
});

// COMPLETE USER ORDER (ADMIN)
const completeUserOrder = asyncHandler(async (req, res) => {
  if (!req.admin || req.admin.privilege !== 'Admin') {
    res.status(404);
    throw new Error('Access denied!');
  }

  const { _id, userRefId } = req.body;

  if (!_id || _id.length !== 24 || !userRefId || userRefId.length !== 24) {
    res.status(400);
    throw new Error("Order and/or user ID's not provided!");
  }

  const respectiveOrder = await Order.findById(_id);
  const respectiveUser = await User.findById(userRefId);

  // get user contact & update there
  const allContacts = await Contact.find({});
  const respectiveContact = allContacts[0].clientContacts.filter(
    (contact) => contact._id.toString() === userRefId.toString()
  );
  const remainingContacts = allContacts[0].clientContacts.filter(
    (contact) => contact._id.toString() !== userRefId.toString()
  );

  if (!respectiveContact || respectiveContact.length === 0) {
    res.status(400);
    throw new Error('Unable to find contact in order for update!');
  }

  if (!respectiveOrder) {
    res.status(400);
    throw new Error('Unable to find order in order to mark complete!');
  }

  respectiveOrder.completed = true;
  respectiveOrder.markModified('completed');
  await respectiveOrder.save();

  let newActiveOrders;
  let completedOrder;
  if (respectiveUser) {
    newActiveOrders = respectiveUser.activeOrders.filter(
      (order) => order.toHexString() !== _id
    );
    completedOrder = respectiveUser.activeOrders.filter(
      (order) => order.toHexString() === _id
    );
    respectiveUser.activeOrders = [];
    respectiveUser.activeOrders = newActiveOrders;
    respectiveUser.archivedOrders.push(completedOrder[0]);
    respectiveUser.markModified('activeOrders');
    respectiveUser.markModified('archivedOrders');
    respectiveContact[0].activeOrders = [];
    respectiveContact[0].activeOrders = newActiveOrders;
    respectiveContact[0].archivedOrders.push(completedOrder[0]);
    remainingContacts.push(respectiveContact[0]);
    allContacts[0].clientContacts = [];
    allContacts[0].clientContacts = remainingContacts;
    allContacts[0].markModified('clientContacts');
    await respectiveUser.save();
    await allContacts[0].save();
  }

  const allOrders = await Order.find({});
  const uncompletedOrders = allOrders.filter(
    (order) => order.completed === false
  );

  res.status(200).json(uncompletedOrders);
});

module.exports = {
  submitUserOrder,
  getUserOrders,
  getCompletedUserOrders,
  editUserOrder,
  deleteUserOrder,
  getAllCustomerOrders,
  getSingleCustomerOrder,
  completeUserOrder,
};

// features needed
// admin mark order as complete (need to add completed: true/false to order object)
// admin edit order
// admin delete order
