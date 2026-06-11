const router = require('express').Router();
const { getNotifications, markRead, markAllRead, createAnnouncement, clearAll } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getNotifications);
// IMPORTANT: /read-all must come before /:id/read to avoid Express matching "read-all" as an :id
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markRead);
router.post('/announce', protect, authorize('admin'), createAnnouncement);
router.delete('/clear-all', protect, clearAll);

module.exports = router;
