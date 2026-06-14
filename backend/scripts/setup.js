require('dotenv').config();
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Board = require('../src/models/Board');
const Task = require('../src/models/Task');

async function setup() {
  try {
    await connectDB();

    const [users, boards, tasks] = await Promise.all([
      User.estimatedDocumentCount(),
      Board.estimatedDocumentCount(),
      Task.estimatedDocumentCount(),
    ]);

    console.log('MongoDB setup check complete');
    console.log(`Users: ${users}`);
    console.log(`Boards: ${boards}`);
    console.log(`Tasks: ${tasks}`);
    console.log('Ready to start the server');
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

setup();
