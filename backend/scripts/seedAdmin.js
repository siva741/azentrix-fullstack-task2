const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ADMIN = {
  name: 'Admin User',
  email: 'admin@taskflow.com',
  password: 'admin123',
  role: 'ADMIN',
};

async function seed() {
  try {
    const hashed = await bcrypt.hash(ADMIN.password, 12);

    const existing = await prisma.user.findUnique({ where: { email: ADMIN.email } });
    if (existing) {
      await prisma.user.update({
        where: { email: ADMIN.email },
        data: { name: ADMIN.name, password: hashed, role: ADMIN.role },
      });
      console.log('Updated existing admin user:', ADMIN.email);
    } else {
      await prisma.user.create({
        data: { name: ADMIN.name, email: ADMIN.email, password: hashed, role: ADMIN.role },
      });
      console.log('Created admin user:', ADMIN.email);
    }
  } catch (err) {
    console.error('Seeding admin failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
