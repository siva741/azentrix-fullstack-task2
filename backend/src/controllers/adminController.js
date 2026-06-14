const bcrypt = require('bcryptjs');
const Board = require('../models/Board');
const Task = require('../models/Task');
const User = require('../models/User');
const { serializeUser, toId } = require('../utils/serializers');

const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'MEMBER' } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    const created = {
      ...serializeUser(user),
      _count: { ownedBoards: 0, createdCards: 0 },
    };

    const io = req.app.get('io');
    if (io) io.emit('user:created', created);

    res.status(201).json(created);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('name email role createdAt updatedAt')
      .sort({ createdAt: 1 })
      .lean();

    const withCounts = await Promise.all(users.map(async (user) => {
      const [ownedBoards, createdCards] = await Promise.all([
        Board.countDocuments({ owner: user._id }),
        Task.countDocuments({ createdBy: user._id }),
      ]);

      return {
        ...serializeUser(user),
        _count: { ownedBoards, createdCards },
      };
    }));

    res.json(withCounts);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, name } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (role !== undefined) {
      if (!['ADMIN', 'MEMBER'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      if (user.role === 'ADMIN' && role === 'MEMBER') {
        const adminCount = await User.countDocuments({ role: 'ADMIN' });
        if (adminCount <= 1) {
          return res.status(400).json({ message: 'At least one admin is required' });
        }
      }

      user.role = role;
    }

    if (name !== undefined) {
      if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
      user.name = name.trim();
    }

    await user.save();

    const updated = serializeUser(user);
    const io = req.app.get('io');
    if (io) io.emit('user:updated', updated);

    res.json(updated);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ownedBoards = await Board.find({ owner: id }).select('_id');
    const ownedBoardIds = ownedBoards.map((board) => board._id);

    await Task.deleteMany({ board: { $in: ownedBoardIds } });
    await Board.deleteMany({ owner: id });
    await Board.updateMany({}, { $pull: { members: id } });
    await Task.deleteMany({ createdBy: id });
    await Task.updateMany({ assignee: id }, { $unset: { assignee: '' } });
    await User.findByIdAndDelete(id);

    const io = req.app.get('io');
    if (io) io.emit('user:deleted', { id, name: user.name, email: user.email });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  if (req.user.role !== 'ADMIN' && toId(req.params.id) !== req.user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  return updateUser(req, res);
};

module.exports = { createUser, getUsers, updateUser, updateProfile, deleteUser };
