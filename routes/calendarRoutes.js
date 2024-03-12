const express = require('express');
const router = express.Router();
const {
  updateDateToToday,
  initCalendar,
  getCalendar,
  reserveTimeSlot,
  unreserveTimeSlot,
} = require('../controllers/calendarController');
const protect = require('../middleware/authMiddleware');
const adminProtect = require('../middleware/adminMiddleware');

router.get('/initCalendar', adminProtect, initCalendar);
router.get('/getCalendar', protect, getCalendar);
router.post('/updateDateToToday', updateDateToToday);
router.patch('/reserveTimeSlot', protect, reserveTimeSlot);
router.patch('/unreserveTimeSlot', protect, unreserveTimeSlot);

module.exports = router;
