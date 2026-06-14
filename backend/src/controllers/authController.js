const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Board = require('../models/Board');
const Task = require('../models/Task');
const { generateToken } = require('../utils/jwt');
const { serializeUser } = require('../utils/serializers');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'ADMIN' : 'MEMBER';
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    const safeUser = serializeUser(user);
    const token = generateToken({ userId: safeUser.id, email: safeUser.email, role: safeUser.role });

    res.status(201).json({ user: safeUser, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const safeUser = serializeUser(user);
    const token = generateToken({ userId: safeUser.id, email: safeUser.email, role: safeUser.role });

    res.json({ user: safeUser, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

const resetDb = async (req, res) => {
  try {
    const { secret, action, email, password } = req.body;

    const expectedSecret = process.env.JWT_SECRET;
    if (!secret || secret !== expectedSecret) {
      return res.status(403).json({ message: 'Unauthorized: Invalid reset secret' });
    }

    if (action === 'clear') {
      await Promise.all([
        User.deleteMany({}),
        Board.deleteMany({}),
        Task.deleteMany({})
      ]);
      return res.json({ message: 'Database cleared successfully. You can now register a new admin user.' });
    } else if (action === 'reset-admin') {
      const adminEmail = email || process.env.ADMIN_EMAIL || 'admin@example.com';
      const adminPassword = password || process.env.ADMIN_PASSWORD || 'ChangeMeToAStrongPassword';
      
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      const user = await User.findOneAndUpdate(
        { email: adminEmail.trim().toLowerCase() },
        {
          name: process.env.ADMIN_NAME || 'Admin User',
          password: hashedPassword,
          role: 'ADMIN',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      
      return res.json({
        message: 'Admin user reset successfully',
        admin: {
          email: user.email,
          role: user.role,
          name: user.name,
          password: adminPassword
        }
      });
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "clear" or "reset-admin".' });
    }
  } catch (error) {
    console.error('Reset DB error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = { register, login, getMe, resetDb };
