const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

const getBookings = async (req, res) => {
  try {
    const { societyId } = req.params;
    const filter = { society: societyId };
    if (req.query.facility) filter.facility = req.query.facility;
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.date)     filter.date      = req.query.date;
    const bookings = await Booking.find(filter)
      .populate('bookedBy', 'name email')
      .populate('resident', 'name flatNumber')
      .sort({ date: 1, timeSlot: 1 });
    res.json({ success: true, bookings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ bookedBy: req.user._id })
      .sort({ date: -1 });
    res.json({ success: true, bookings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createBooking = async (req, res) => {
  try {
    const societyId = req.user.society?._id || req.user.society;
    const { facility, date, timeSlot } = req.body;

    // Conflict check
    const conflict = await Booking.findOne({ society: societyId, facility, date, timeSlot, status: { $in: ['Pending', 'Approved'] } });
    if (conflict) return res.status(400).json({ success: false, message: 'This slot is already booked' });

    const booking = await Booking.create({ ...req.body, society: societyId, bookedBy: req.user._id });

    // Notify admins
    const io = req.app.get('io');
    io?.to(String(societyId)).emit('new_booking', { facility, date, timeSlot, user: req.user.name });

    res.status(201).json({ success: true, booking });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, rejectionReason, approvedBy: req.user._id },
      { new: true }
    ).populate('bookedBy', 'name');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Notify resident
    await Notification.create({
      title: `Booking ${status}`,
      message: `Your booking for ${booking.facility} on ${booking.date} (${booking.timeSlot}) has been ${status.toLowerCase()}.`,
      type: 'system',
      recipient: booking.bookedBy._id,
      society: booking.society,
    });

    const io = req.app.get('io');
    io?.to(String(booking.society)).emit('booking_updated', { status, facility: booking.facility });

    res.json({ success: true, booking });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, bookedBy: req.user._id },
      { status: 'Cancelled' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Get available slots for a facility on a date
const getAvailableSlots = async (req, res) => {
  try {
    const { societyId, facility, date } = req.query;
    const ALL_SLOTS = ['06:00-08:00','08:00-10:00','10:00-12:00','12:00-14:00','14:00-16:00','16:00-18:00','18:00-20:00','20:00-22:00'];
    const booked = await Booking.find({ society: societyId, facility, date, status: { $in: ['Pending', 'Approved'] } }).select('timeSlot');
    const bookedSlots = booked.map(b => b.timeSlot);
    const available = ALL_SLOTS.filter(s => !bookedSlots.includes(s));
    res.json({ success: true, available, booked: bookedSlots });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getBookingStats = async (req, res) => {
  try {
    const { societyId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const [total, todayCount, pending, byFacility] = await Promise.all([
      Booking.countDocuments({ society: societyId }),
      Booking.countDocuments({ society: societyId, date: today }),
      Booking.countDocuments({ society: societyId, status: 'Pending' }),
      Booking.aggregate([
        { $match: { society: require('mongoose').Types.ObjectId.createFromHexString(societyId) } },
        { $group: { _id: '$facility', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);
    res.json({ success: true, stats: { total, todayCount, pending, byFacility } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getBookings, getMyBookings, createBooking, updateBookingStatus, cancelBooking, getAvailableSlots, getBookingStats };
