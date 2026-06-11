const router = require('express').Router();
const { triggerSOS, getSosLogs, acknowledgesSOS, resolveSOS } = require('../controllers/sosController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, triggerSOS);
router.get('/:societyId', protect, authorize('admin'), getSosLogs);
router.put('/:id/acknowledge', protect, authorize('admin'), acknowledgesSOS);
router.put('/:id/resolve', protect, authorize('admin'), resolveSOS);

module.exports = router;
