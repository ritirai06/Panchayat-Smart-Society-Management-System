const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendPush } = require('../utils/firebase');

const REMINDER_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Re-notify users who have unread notifications older than 5 minutes
 * and haven't been retried yet (retryAfter is null or in the past).
 */
const retryMissedNotifications = async () => {
  try {
    const cutoff = new Date(Date.now() - REMINDER_INTERVAL_MS);
    const missed = await Notification.find({
      isRead: false,
      recipient: { $ne: null }, // only personal notifications, not broadcasts
      createdAt: { $lte: cutoff },
      $or: [{ retryAfter: null }, { retryAfter: { $lte: new Date() } }],
    }).limit(100);

    for (const notif of missed) {
      const user = await User.findById(notif.recipient).select('fcmToken').lean();
      if (user?.fcmToken) {
        await sendPush(user.fcmToken, notif.title, notif.message, { notificationId: notif._id.toString() });
      }
      // Set next retry 5 minutes from now so we don't spam
      await Notification.findByIdAndUpdate(notif._id, { retryAfter: new Date(Date.now() + REMINDER_INTERVAL_MS) });
    }

    if (missed.length) console.log(`[Scheduler] Retried ${missed.length} missed notification(s)`);
  } catch (e) {
    console.error('[Scheduler] retryMissedNotifications error:', e.message);
  }
};

/**
 * Auto-mark payments as Overdue when their due date has passed and they're still Pending.
 */
const markOverduePayments = async () => {
  try {
    const result = await Payment.updateMany(
      { status: 'Pending', dueDate: { $lt: new Date() } },
      { status: 'Overdue' }
    );
    if (result.modifiedCount) console.log(`[Scheduler] Marked ${result.modifiedCount} payment(s) as Overdue`);
  } catch (e) {
    console.error('[Scheduler] markOverduePayments error:', e.message);
  }
};

const start = () => {
  // Run immediately on startup, then every 5 minutes
  retryMissedNotifications();
  markOverduePayments();
  setInterval(retryMissedNotifications, REMINDER_INTERVAL_MS);
  setInterval(markOverduePayments, REMINDER_INTERVAL_MS);
  console.log('[Scheduler] Auto-reminder scheduler started (5-min interval)');
};

module.exports = { start };
