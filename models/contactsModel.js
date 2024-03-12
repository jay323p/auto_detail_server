const mongoose = require('mongoose');

const contactSchema = mongoose.Schema({
  clientContacts: {
    type: Array,
    default: [],
  },
  newClients: {
    type: Boolean,
    default: false,
  },
  qtyNewClients: {
    type: Number,
    default: 0,
  },
  clientUpdates: {
    type: Boolean,
    default: false,
  },
  qtyClientUpdates: {
    type: Number,
    default: 0,
  },
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
