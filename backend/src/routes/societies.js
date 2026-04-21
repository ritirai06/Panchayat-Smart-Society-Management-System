const router = require('express').Router();
const { createSociety, getSociety, updateSociety, uploadRules, getPublicStats } = require('../controllers/societyController');
const { protect, authorize } = require('../middleware/auth');

router.get('/public/stats', getPublicStats);

router.post('/', protect, createSociety);
router.get('/:id', protect, getSociety);
router.put('/:id', protect, authorize('admin'), updateSociety);
router.put('/:id/rules', protect, authorize('admin'), uploadRules);

module.exports = router;
