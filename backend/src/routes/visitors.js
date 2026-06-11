const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createVisitor, getVisitors, getMyVisitors,
  verifyGatePass, markEntry, markExit,
  updateVisitor, deleteVisitor, getVisitorStats,
} = require('../controllers/visitorController');

router.get('/stats/:societyId',    protect, getVisitorStats);
router.get('/society/:societyId',  protect, getVisitors);
router.get('/my',                  protect, getMyVisitors);
router.post('/',                   protect, createVisitor);
router.put('/:id',                 protect, updateVisitor);
router.put('/:id/exit',            protect, markExit);
router.delete('/:id',              protect, authorize('admin'), deleteVisitor);

// Gate pass (public — scanned at gate)
router.get('/verify/:token',       verifyGatePass);
router.post('/entry/:token',       protect, markEntry);

module.exports = router;
