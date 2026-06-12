/**
 * Setup script: detects environment and configures Prisma accordingly.
 * - Local: uses SQLite (no PostgreSQL needed)
 * - Production: uses PostgreSQL (from DATABASE_URL env var)
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env if it exists (dotenv may not be loaded yet)
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (e) { /* dotenv might not be available in CI */ }

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('postgresql');
const prismaDir = path.join(__dirname, '..', 'prisma');

if (isProduction) {
  console.log('📦 Production mode — using PostgreSQL schema');
  // schema.prisma already points to PostgreSQL via DATABASE_URL in .env
} else {
  console.log('📦 Local mode — using SQLite schema');

  // Copy the SQLite schema over schema.prisma
  const sqliteSchema = fs.readFileSync(path.join(prismaDir, 'schema.sqlite.prisma'), 'utf-8');
  fs.writeFileSync(path.join(prismaDir, 'schema.prisma'), sqliteSchema);
  console.log('✅ SQLite schema applied to schema.prisma');

  // Set DATABASE_URL for SQLite if not already set
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('postgresql')) {
    process.env.DATABASE_URL = 'file:./dev.db';
    // Also write it so Prisma CLI picks it up
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    try { envContent = fs.readFileSync(envPath, 'utf-8'); } catch (e) { /* ignore */ }

    const lines = envContent.split('\n').filter(line => !line.startsWith('DATABASE_URL='));
    lines.unshift(`DATABASE_URL="file:./dev.db"`);
    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('✅ .env updated with SQLite database URL');
  }
}

// Regenerate Prisma client
console.log('🔄 Generating Prisma client...');
execSync('npx prisma generate', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
console.log('✅ Prisma client generated');

// Push schema to database
console.log('🔄 Pushing schema to database...');
execSync('npx prisma db push', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
console.log('✅ Schema pushed successfully');
console.log('🚀 Ready to start the server!');
