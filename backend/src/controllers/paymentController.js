const Payment = require('../models/Payment');
const Resident = require('../models/Resident');
const Notification = require('../models/Notification');
const Society = require('../models/Society');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const generateMonthlyBills = async (req, res) => {
  try {
    const { societyId, month } = req.body;
    if (!societyId || !month) return res.status(400).json({ success: false, message: 'societyId and month are required' });
    const society = await Society.findById(societyId);
    if (!society) return res.status(404).json({ success: false, message: 'Society not found' });
    const residents = await Resident.find({ society: societyId, isActive: true });
    if (!residents.length) return res.json({ success: true, message: 'No active residents found' });

    const dueDate = new Date(`${month}-10`);
    const bills = residents.map(r => ({
      resident: r._id,
      flat: r.flat,
      society: societyId,
      amount: society.maintenanceAmount,
      type: 'Maintenance',
      month,
      dueDate,
      status: 'Pending'
    }));

    const result = await Payment.insertMany(bills, { ordered: false }).catch(err => {
      // Return partial success info
      return { insertedCount: err.result?.nInserted || 0 };
    });
    const inserted = result.insertedCount ?? bills.length;
    res.json({ success: true, message: `Bills generated for ${inserted} residents (${bills.length - inserted} already existed)` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPayments = async (req, res) => {
  try {
    const filter = { society: req.params.societyId };
    if (req.query.month) filter.month = req.query.month;
    if (req.query.status) filter.status = req.query.status;
    // Residents only see their own payments
    if (req.user.role === 'resident') {
      const resident = await Resident.findOne({ user: req.user._id, society: req.params.societyId });
      if (resident) filter.resident = resident._id;
      else return res.json({ success: true, payments: [] });
    }

    const payments = await Payment.find(filter)
      .populate('resident', 'name phone')
      .populate('flat', 'flatNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const markPaid = async (req, res) => {
  try {
    const { transactionId, paymentMethod, status } = req.body;
    let update = {};
    if (status === 'Paid') {
      update = { status: 'Paid', paidAt: new Date(), transactionId: transactionId || undefined, paymentMethod: paymentMethod || 'Online' };
    } else if (status === 'Waived') {
      update = { status: 'Waived', paidAt: new Date(), transactionId: 'WAIVED', paymentMethod: 'Admin' };
    } else if (status === 'Pending') {
      update = { status: 'Pending', paidAt: null, transactionId: null, paymentMethod: null };
    } else if (status === 'Overdue') {
      update = { status: 'Overdue' };
    } else {
      // Default to marking as paid if no specific non-paid status provided
      update = { status: 'Paid', paidAt: new Date(), transactionId: transactionId || undefined, paymentMethod: paymentMethod || 'Online' };
    }

    const payment = await Payment.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const sendReminders = async (req, res) => {
  try {
    const overdue = await Payment.find({ society: req.params.societyId, status: 'Pending' })
      .populate('resident', 'name')
      .populate('flat', 'flatNumber');

    const notifications = overdue.map(p => ({
      title: 'Payment Reminder',
      message: `Dear ${p.resident?.name}, maintenance of ₹${p.amount} for ${p.month} is pending.`,
      type: 'payment',
      society: p.society
    }));

    await Notification.insertMany(notifications);
    await Payment.updateMany({ _id: { $in: overdue.map(p => p._id) } }, { reminderSent: true });

    const io = req.app.get('io');
    io.to(req.params.societyId).emit('payment_reminder', { count: overdue.length });

    res.json({ success: true, message: `Reminders sent to ${overdue.length} residents` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPaymentStats = async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      { $match: { society: require('mongoose').Types.ObjectId.createFromHexString(req.params.societyId) } },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    const options = {
      amount: Math.round(payment.amount * 100), // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${payment._id}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      await Payment.findByIdAndUpdate(paymentId, {
        status: 'Paid',
        paidAt: new Date(),
        transactionId: razorpay_payment_id,
        paymentMethod: 'Online'
      });
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { generateMonthlyBills, getPayments, markPaid, sendReminders, getPaymentStats, createOrder, verifyPayment };
