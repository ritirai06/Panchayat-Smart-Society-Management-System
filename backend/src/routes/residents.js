const router = require('express').Router();
const { addResident, getResidents, updateResident, deleteResident } = require('../controllers/residentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, authorize('admin'), upload.array('image', 1), addResident);
router.get('/society/:societyId', protect, getResidents);
router.put('/:id', protect, authorize('admin'), upload.array('image', 1), updateResident);
router.delete('/:id', protect, authorize('admin'), deleteResident);

module.exports = router;
