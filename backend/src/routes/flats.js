const router = require('express').Router();
const { createFlat, getFlats, updateFlat, deleteFlat } = require('../controllers/residentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, authorize('admin'), upload.array('image', 1), createFlat);
router.get('/society/:societyId', protect, getFlats);
router.put('/:id', protect, authorize('admin'), upload.array('image', 1), updateFlat);
router.delete('/:id', protect, authorize('admin'), deleteFlat);

module.exports = router;
