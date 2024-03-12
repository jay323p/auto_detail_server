const express = require('express');
const router = express.Router();
const {
  initContacts,
  acknowledgeContactUpdates,
} = require('../controllers/contactsController');
const protect = require('../middleware/authMiddleware');
const adminProtect = require('../middleware/adminMiddleware');

router.get('/initContacts', adminProtect, initContacts);
router.get(
  '/acknowledgeContactUpdates',
  adminProtect,
  acknowledgeContactUpdates
);

module.exports = router;
