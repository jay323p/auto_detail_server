const express = require('express');
const router = express.Router();
const {
  submitUserOrder,
  getUserOrders,
  editUserOrder,
  deleteUserOrder,
  getAllCustomerOrders,
  getAllCompletedCustomerOrders,
  completeUserOrder,
  getCompletedUserOrders,
  getSingleCustomerOrder,
} = require('../controllers/orderController');
const protect = require('../middleware/authMiddleware');
const adminProtect = require('../middleware/adminMiddleware');

router.get('/getUserOrders', protect, getUserOrders);
router.get('/getCompletedUserOrders', protect, getCompletedUserOrders);
router.post('/submitOrder', protect, submitUserOrder);
router.patch('/editOrder', protect, editUserOrder);
router.patch('/deleteOrder', protect, deleteUserOrder);
router.get('/getAllCustomerOrders', adminProtect, getAllCustomerOrders);
router.post('/getSingleCustomerOrder', adminProtect, getSingleCustomerOrder);
router.patch('/completeUserOrder', adminProtect, completeUserOrder);

module.exports = router;
