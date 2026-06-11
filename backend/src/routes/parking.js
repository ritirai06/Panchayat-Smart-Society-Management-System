const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSlots, createSlot, updateSlot, deleteSlot,
  assignSlot, releaseSlot, autoAssign,
  getVehicles, addVehicle, updateVehicle, deleteVehicle,
  getParkingStats,
} = require('../controllers/parkingController');

// Stats
router.get('/stats/:societyId', protect, getParkingStats);

// Slots
router.get('/slots/:societyId', protect, getSlots);
router.post('/slots', protect, authorize('admin'), createSlot);
router.put('/slots/:id', protect, authorize('admin'), updateSlot);
router.delete('/slots/:id', protect, authorize('admin'), deleteSlot);
router.post('/slots/assign', protect, authorize('admin'), assignSlot);
router.put('/slots/:id/release', protect, authorize('admin'), releaseSlot);
router.post('/slots/auto-assign', protect, authorize('admin'), autoAssign);

// Vehicles
router.get('/vehicles/:societyId', protect, getVehicles);
router.post('/vehicles', protect, addVehicle);
router.put('/vehicles/:id', protect, updateVehicle);
router.delete('/vehicles/:id', protect, authorize('admin'), deleteVehicle);

module.exports = router;
