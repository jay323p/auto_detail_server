const asyncHandler = require('express-async-handler');
const Contact = require('../models/contactsModel');
const User = require('../models/userModel');
const Calendar = require('../models/calendarModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dateFns = require('date-fns');
const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectId;

// CREATE/INIT CONTACTS -------------------------------------------------------------------------------------------
const initContacts = asyncHandler(async (req, res) => {
  const storedContacts = await Contact.find({});

  if (storedContacts.length === 0) {
    console.log('here');
    const contactsInit = await Contact.create({
      clientContacts: [],
      newClients: false,
      qtyNewClients: 0,
      clientUpdates: false,
      qtyClientUpdates: 0,
    });
    res.status(200).json(contactsInit);
  } else {
    res.status(200).json(storedContacts[0]);
  }
});

const acknowledgeContactUpdates = asyncHandler(async (req, res) => {
  const storedContacts = await Contact.find({});

  if (!storedContacts) {
    res.status(400);
    throw new Error('Unable to find contacts. Please ensure proper login!');
  }

  storedContacts[0].newClients = false;
  storedContacts[0].qtyNewClients = 0;
  storedContacts[0].clientUpdates = false;
  storedContacts[0].qtyClientUpdates = 0;

  storedContacts[0].markModified('newClients');
  storedContacts[0].markModified('qtyNewClients');
  storedContacts[0].markModified('clientUpdates');
  storedContacts[0].markModified('qtyClientUpdates');

  await storedContacts[0].save();

  res.status(200).json(storedContacts[0]);
});
module.exports = {
  initContacts,
  acknowledgeContactUpdates,
};
