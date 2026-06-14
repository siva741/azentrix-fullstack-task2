const { MongoMemoryServer } = require('mongodb-memory-server');
const { spawn } = require('child_process');
const path = require('path');

async function run() {
  console.log('🌱 Starting in-memory MongoDB server...');
  // Set explicit download path or timeout if needed, but defaults usually work
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log(`✅ In-memory MongoDB started at: ${uri}`);

  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
  process.env.PORT = process.env.PORT || '4000';

  console.log('🚀 Launching backend server...');
  const child = spawn('npx', ['nodemon', 'src/index.js'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, MONGODB_URI: uri }
  });

  child.on('close', (code) => {
    console.log(`Backend server exited with code ${code}`);
    mongod.stop();
    process.exit(code);
  });
  
  process.on('SIGINT', async () => {
    console.log('Stopping in-memory MongoDB...');
    child.kill('SIGINT');
    await mongod.stop();
    process.exit(0);
  });
}

run().catch(err => {
  console.error('Failed to run in-memory dev server:', err);
});
