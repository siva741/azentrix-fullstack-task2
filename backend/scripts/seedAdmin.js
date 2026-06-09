const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';
const ADMIN_ROLE = process.env.ADMIN_ROLE || 'ADMIN';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.');
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.');
  process.exit(1);
}

async function seed() {
  try {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (existing) {
      await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: { name: ADMIN_NAME, password: hashed, role: ADMIN_ROLE },
      });
      console.log('Updated existing admin user:', ADMIN_EMAIL);
    } else {
      await prisma.user.create({
        data: { name: ADMIN_NAME, email: ADMIN_EMAIL, password: hashed, role: ADMIN_ROLE },
      });
      console.log('Created admin user:', ADMIN_EMAIL);
    }
  } catch (err) {
    console.error('Seeding admin failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
