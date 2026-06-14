const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const isMongoUri = (uri = '') => uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');

const getMongoUri = () => {
  if (isMongoUri(process.env.MONGODB_URI)) return process.env.MONGODB_URI;
  if (isMongoUri(process.env.DATABASE_URL)) return process.env.DATABASE_URL;
  return undefined;
};

const connectDB = async () => {
  const uri = getMongoUri();

  if (!uri) {
    throw new Error('MONGODB_URI is required and must start with mongodb:// or mongodb+srv://');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log('MongoDB connected');
};

module.exports = { connectDB, getMongoUri };
