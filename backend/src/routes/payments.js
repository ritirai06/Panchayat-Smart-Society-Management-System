const router = require('express').Router();
const { generateMonthlyBills, getPayments, markPaid, sendReminders, getPaymentStats, createOrder, verifyPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/generate', protect, authorize('admin'), generateMonthlyBills);
router.get('/society/:societyId', protect, getPayments);
router.get('/stats/:societyId', protect, getPaymentStats);
router.put('/:id/pay', protect, markPaid);
router.post('/reminders/:societyId', protect, authorize('admin'), sendReminders);
router.post('/:id/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;
