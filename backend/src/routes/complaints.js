const router = require('express').Router();
const { createComplaint, getComplaints, updateComplaint, deleteComplaint, getComplaintStats } = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, upload.array('images', 5), createComplaint);
router.get('/society/:societyId', protect, getComplaints);
router.get('/stats/:societyId', protect, getComplaintStats);
router.put('/:id', protect, updateComplaint);
router.delete('/:id', protect, authorize('admin'), deleteComplaint);

module.exports = router;
