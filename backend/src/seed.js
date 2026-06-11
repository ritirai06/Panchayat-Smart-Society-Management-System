require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const Society = require('./models/Society');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Wipe all users
  await User.deleteMany({});
  console.log('All users deleted');

  // Get or create a society to link users to
  let society = await Society.findOne({});
  if (!society) {
    society = await Society.create({
      name: 'Panchayat Society',
      address: '123 Main Street',
      city: 'Mumbai',
      admin: new mongoose.Types.ObjectId(), // temp, updated below
      maintenanceAmount: 2000
    });
  }

  // Create admin
  const admin = await User.create({
    name: 'Riti Admin',
    email: 'ritiadmin@panchayat.com',
    password: 'riti1234',
    role: 'admin',
    society: society._id
  });

  // Update society admin reference
  await Society.findByIdAndUpdate(society._id, { admin: admin._id });

  // Create resident
  await User.create({
    name: 'Riti Resident',
    email: 'ritiresident@panchayat.com',
    password: 'riti1234',
    role: 'resident',
    society: society._id
  });

  console.log('\n✅ Users created:');
  console.log('  Admin    → ritiadmin@panchayat.com     / riti1234');
  console.log('  Resident → ritiresident@panchayat.com  / riti1234');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
