const mongoose = require('mongoose');
const Board = require('../models/Board');
const Task = require('../models/Task');
const User = require('../models/User');
const { buildBoardPayload, serializeBoard, serializeUser, toId } = require('../utils/serializers');
const { findBoardForUser } = require('../utils/access');

const populateBoard = (query) => query
  .populate('owner', 'name email role createdAt updatedAt')
  .populate('members', 'name email role createdAt updatedAt');

const getBoards = async (req, res) => {
  try {
    const filter = req.user.role === 'ADMIN'
      ? {}
      : { $or: [{ owner: req.user.id }, { members: req.user.id }] };

    const boards = await populateBoard(Board.find(filter).sort({ createdAt: -1 }));

    res.json(boards.map(serializeBoard));
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createBoard = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Board name is required' });

    const board = await Board.create({
      name: name.trim(),
      description: description?.trim() || '',
      owner: req.user.id,
      members: [],
    });

    await board.populate('owner', 'name email role createdAt updatedAt');

    const serialized = serializeBoard(board);
    const io = req.app.get('io');
    if (io) io.emit('board:created', serialized);

    res.status(201).json(serialized);
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { board, error, status } = await findBoardForUser(id, req.user, { populate: true });

    if (!board) return res.status(status).json({ message: error });

    const tasks = await Task.find({ board: id })
      .populate('assignee', 'name email role createdAt updatedAt')
      .populate('createdBy', 'name email role createdAt updatedAt')
      .sort({ status: 1, order: 1, createdAt: 1 });

    res.json(buildBoardPayload(board, tasks));
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, members } = req.body;
    const { board, error, status } = await findBoardForUser(id, req.user);

    if (!board) return res.status(status).json({ message: error });
    if (toId(board.owner) !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only the board owner or an admin can update it' });
    }

    if (name !== undefined) {
      if (!name?.trim()) return res.status(400).json({ message: 'Board name is required' });
      board.name = name.trim();
    }

    if (description !== undefined) {
      board.description = description?.trim() || '';
    }

    if (Array.isArray(members)) {
      const validMemberIds = members.filter((memberId) => mongoose.isValidObjectId(memberId));
      const users = await User.find({ _id: { $in: validMemberIds } }).select('_id');
      board.members = users
        .map((member) => member._id)
        .filter((memberId) => toId(memberId) !== toId(board.owner));
    }

    await board.save();
    await board.populate('owner', 'name email role createdAt updatedAt');
    await board.populate('members', 'name email role createdAt updatedAt');

    const serialized = serializeBoard(board);
    const io = req.app.get('io');
    if (io) io.to(id).emit('board:updated', serialized);

    res.json(serialized);
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const board = mongoose.isValidObjectId(id) ? await Board.findById(id) : null;

    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (toId(board.owner) !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only the board owner can delete it' });
    }

    await Task.deleteMany({ board: id });
    await Board.findByIdAndDelete(id);

    const io = req.app.get('io');
    if (io) io.emit('board:deleted', { id });

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    const board = mongoose.isValidObjectId(id) ? await Board.findById(id) : null;
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (toId(board.owner) !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only the board owner can add members' });
    }

    if (!normalizedEmail) return res.status(400).json({ message: 'Email is required' });

    const userToAdd = await User.findOne({ email: normalizedEmail }).select('name email role createdAt updatedAt');
    if (!userToAdd) return res.status(404).json({ message: 'User not found' });

    if (toId(board.owner) === toId(userToAdd)) {
      return res.status(400).json({ message: 'User is already the board owner' });
    }

    if (board.members.some((memberId) => toId(memberId) === toId(userToAdd))) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    board.members.push(userToAdd._id);
    await board.save();
    await board.populate('owner', 'name email role createdAt updatedAt');
    await board.populate('members', 'name email role createdAt updatedAt');

    const io = req.app.get('io');
    if (io) io.to(id).emit('board:memberAdded', { boardId: id, user: serializeUser(userToAdd) });

    res.status(201).json(serializeBoard(board));
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const board = mongoose.isValidObjectId(id) ? await Board.findById(id) : null;

    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (toId(board.owner) !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only the board owner can remove members' });
    }

    board.members = board.members.filter((memberId) => toId(memberId) !== userId);
    await board.save();
    await Task.updateMany({ board: id, assignee: userId }, { $unset: { assignee: '' } });

    const io = req.app.get('io');
    if (io) io.to(id).emit('board:memberRemoved', { boardId: id, userId });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember,
};
