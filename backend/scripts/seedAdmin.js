const bcrypt = require('bcryptjs');
require('dotenv').config();
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.');
  process.exit(1);
}

async function seed() {
  try {
    await connectDB();
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const email = ADMIN_EMAIL.trim().toLowerCase();

    const user = await User.findOneAndUpdate(
      { email },
      {
        name: ADMIN_NAME,
        email,
        password: hashed,
        role: 'ADMIN',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`Admin ready: ${user.email}`);
  } catch (err) {
    console.error('Seeding admin failed:', err.message);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

seed();
