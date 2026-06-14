const mongoose = require('mongoose');
const Board = require('../models/Board');
const { toId } = require('./serializers');

const isBoardMember = (board, userId) => {
  const id = toId(userId);
  return toId(board.owner) === id || (board.members || []).some((member) => toId(member) === id);
};

const canAccessBoard = (board, user) => {
  if (!board || !user) return false;
  return user.role === 'ADMIN' || isBoardMember(board, user.id);
};

const findBoardForUser = async (boardId, user, options = {}) => {
  if (!mongoose.isValidObjectId(boardId)) {
    return { board: null, error: 'Board not found', status: 404 };
  }

  let query = Board.findById(boardId);

  if (options.populate) {
    query = query
      .populate('owner', 'name email role createdAt updatedAt')
      .populate('members', 'name email role createdAt updatedAt');
  }

  const board = await query;

  if (!board) return { board: null, error: 'Board not found', status: 404 };
  if (!canAccessBoard(board, user)) return { board: null, error: 'Access denied', status: 403 };

  return { board };
};

module.exports = {
  isBoardMember,
  canAccessBoard,
  findBoardForUser,
};
