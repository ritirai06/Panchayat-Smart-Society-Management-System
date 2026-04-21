require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User');
const Society = require('./src/models/Society');
const Flat = require('./src/models/Flat');
const Resident = require('./src/models/Resident');
const Complaint = require('./src/models/Complaint');
const Payment = require('./src/models/Payment');
const Notification = require('./src/models/Notification');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([User, Society, Flat, Resident, Complaint, Payment, Notification].map(M => M.deleteMany({})));
  console.log('Cleared existing data');

  // Create admin user
  const admin = await User.create({
    name: 'Rajesh Kumar',
    email: 'admin@panchayat.com',
    password: 'admin123',
    phone: '+91 9876543210',
    role: 'admin'
  });

  // Create society
  const society = await Society.create({
    name: 'Green Valley Apartments',
    address: '42, Sector 15, Navi Mumbai',
    city: 'Mumbai',
    admin: admin._id,
    maintenanceAmount: 3500,
    amenities: ['Gym', 'Swimming Pool', 'Parking', 'Clubhouse', 'Children Play Area', 'Security'],
    rules: `GREEN VALLEY APARTMENTS - SOCIETY BYLAWS

1. GENERAL RULES
   - All residents must register with the society office within 7 days of moving in.
   - Visitors must sign in at the security gate.
   - No commercial activities allowed in residential flats.

2. TIMINGS
   - Gym: 6:00 AM to 10:00 PM daily
   - Swimming Pool: 7:00 AM to 8:00 PM (Children: 4 PM - 6 PM only)
   - Clubhouse: 9:00 AM to 11:00 PM
   - Quiet hours: 10:00 PM to 7:00 AM

3. MAINTENANCE
   - Monthly maintenance: ₹3,500 per flat
   - Due date: 10th of every month
   - Late fee: ₹100 per week after due date

4. PARKING
   - Each flat is allotted one parking spot
   - Visitor parking available near Gate 2 (max 4 hours)
   - No parking in fire lanes

5. PETS
   - Pets allowed with prior registration
   - Pets must be on leash in common areas
   - Pet owners responsible for cleanliness

6. WASTE MANAGEMENT
   - Dry and wet waste must be segregated
   - Garbage collection: 8 AM and 6 PM daily
   - No littering in common areas

7. EVENTS
   - Society events require 7 days advance notice
   - Private parties in clubhouse require booking and deposit`
  });

  // Update admin with society
  await User.findByIdAndUpdate(admin._id, { society: society._id });

  // Create resident users
  const residentUsers = await User.insertMany([
    { name: 'Priya Sharma', email: 'resident@panchayat.com', password: await bcrypt.hash('resident123', 10), phone: '+91 9876543211', role: 'resident', society: society._id },
    { name: 'Amit Patel', email: 'amit@panchayat.com', password: await bcrypt.hash('resident123', 10), phone: '+91 9876543212', role: 'resident', society: society._id },
    { name: 'Sunita Verma', email: 'sunita@panchayat.com', password: await bcrypt.hash('resident123', 10), phone: '+91 9876543213', role: 'resident', society: society._id },
  ]);

  // Create flats
  const flats = await Flat.insertMany([
    { flatNumber: '101', floor: 1, society: society._id, type: '2BHK', area: 950, isOccupied: true },
    { flatNumber: '102', floor: 1, society: society._id, type: '3BHK', area: 1200, isOccupied: true },
    { flatNumber: '201', floor: 2, society: society._id, type: '2BHK', area: 950, isOccupied: true },
    { flatNumber: '202', floor: 2, society: society._id, type: '1BHK', area: 650, isOccupied: false },
    { flatNumber: '301', floor: 3, society: society._id, type: '3BHK', area: 1200, isOccupied: false },
    { flatNumber: '302', floor: 3, society: society._id, type: '2BHK', area: 950, isOccupied: false },
  ]);

  await Society.findByIdAndUpdate(society._id, { totalFlats: flats.length });

  // Create residents
  const residents = await Resident.insertMany([
    { name: 'Priya Sharma', phone: '+91 9876543211', email: 'priya@example.com', type: 'owner', flat: flats[0]._id, society: society._id, user: residentUsers[0]._id, familyMembers: [{ name: 'Rahul Sharma', relation: 'Husband', age: 35 }, { name: 'Aryan Sharma', relation: 'Son', age: 8 }] },
    { name: 'Amit Patel', phone: '+91 9876543212', email: 'amit@example.com', type: 'owner', flat: flats[1]._id, society: society._id, user: residentUsers[1]._id, familyMembers: [{ name: 'Neha Patel', relation: 'Wife', age: 30 }] },
    { name: 'Sunita Verma', phone: '+91 9876543213', email: 'sunita@example.com', type: 'tenant', flat: flats[2]._id, society: society._id, user: residentUsers[2]._id, familyMembers: [] },
  ]);

  // Update flats with owners
  await Flat.findByIdAndUpdate(flats[0]._id, { owner: residents[0]._id });
  await Flat.findByIdAndUpdate(flats[1]._id, { owner: residents[1]._id });
  await Flat.findByIdAndUpdate(flats[2]._id, { owner: residents[2]._id });

  // Update resident users with flat info
  await User.findByIdAndUpdate(residentUsers[0]._id, { flat: flats[0]._id });
  await User.findByIdAndUpdate(residentUsers[1]._id, { flat: flats[1]._id });
  await User.findByIdAndUpdate(residentUsers[2]._id, { flat: flats[2]._id });

  // Create complaints
  await Complaint.insertMany([
    { title: 'Water leakage in bathroom', description: 'There is a major water leakage from the pipe under the sink. Water is spreading on the floor.', category: 'Plumbing', status: 'Open', priority: 'High', raisedBy: residentUsers[0]._id, society: society._id, flat: flats[0]._id },
    { title: 'Lift not working', description: 'The lift on Block A has been out of service since yesterday morning. Elderly residents are facing difficulty.', category: 'Lift', status: 'In Progress', priority: 'Urgent', raisedBy: residentUsers[1]._id, society: society._id, flat: flats[1]._id },
    { title: 'Street light broken', description: 'The street light near parking lot B is not working for the past 3 days. It is very dark at night.', category: 'Electricity', status: 'Open', priority: 'Medium', raisedBy: residentUsers[2]._id, society: society._id, flat: flats[2]._id },
    { title: 'Garbage not collected', description: 'Garbage has not been collected from our floor for 2 days. It is causing bad smell.', category: 'Cleanliness', status: 'Resolved', priority: 'Medium', raisedBy: residentUsers[0]._id, society: society._id, flat: flats[0]._id, resolvedAt: new Date() },
    { title: 'Loud music at night', description: 'Flat 302 plays loud music after 11 PM regularly. This is disturbing sleep.', category: 'Noise', status: 'Open', priority: 'Medium', raisedBy: residentUsers[1]._id, society: society._id },
  ]);

  // Create payments
  const months = ['2024-10', '2024-11', '2024-12'];
  const paymentData = [];
  for (const resident of residents) {
    for (const month of months) {
      paymentData.push({
        resident: resident._id,
        flat: resident.flat,
        society: society._id,
        amount: 3500,
        type: 'Maintenance',
        month,
        dueDate: new Date(`${month}-10`),
        status: month === '2024-10' ? 'Paid' : month === '2024-11' ? 'Paid' : 'Pending',
        paidAt: month !== '2024-12' ? new Date() : undefined,
        transactionId: month !== '2024-12' ? `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined
      });
    }
  }
  await Payment.insertMany(paymentData);

  // Create notifications
  await Notification.insertMany([
    { title: 'Welcome to Panchayat!', message: 'Your society management system is now active. Explore all features.', type: 'announcement', society: society._id },
    { title: 'Maintenance Due', message: 'December maintenance of ₹3,500 is due by 10th December.', type: 'payment', society: society._id },
    { title: 'Society Meeting', message: 'Annual General Meeting scheduled for 15th December at 6 PM in the Clubhouse.', type: 'announcement', society: society._id },
  ]);

  console.log('\n✅ Seed data created successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('Admin:    admin@panchayat.com    / admin123');
  console.log('Resident: resident@panchayat.com / resident123');
  console.log('Resident: amit@panchayat.com     / resident123');
  console.log('\n🏢 Society: Green Valley Apartments, Mumbai');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1) });
