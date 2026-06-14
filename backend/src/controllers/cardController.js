const mongoose = require('mongoose');
const Board = require('../models/Board');
const Task = require('../models/Task');
const User = require('../models/User');
const { findBoardForUser } = require('../utils/access');
const { serializeTask, toId } = require('../utils/serializers');
const {
  VALID_PRIORITIES,
  VALID_STATUSES,
  normalizePriority,
  normalizeStatus,
} = require('../utils/kanban');

const populateTask = (query) => query
  .populate('assignee', 'name email role createdAt updatedAt')
  .populate('createdBy', 'name email role createdAt updatedAt');

const boardMemberIds = (board) => [
  toId(board.owner),
  ...(board.members || []).map(toId),
].filter(Boolean);

const validateAssignee = async (board, assigneeId) => {
  if (!assigneeId) return null;
  if (!mongoose.isValidObjectId(assigneeId)) {
    return { error: 'Invalid assignee', status: 400 };
  }

  const assignee = await User.findById(assigneeId).select('name email role');
  if (!assignee) return { error: 'Assignee not found', status: 404 };

  if (!boardMemberIds(board).includes(toId(assignee))) {
    return { error: 'Assignee must be the board owner or a board member', status: 400 };
  }

  return { assignee };
};

const getAccessibleBoardIds = async (user) => {
  const filter = user.role === 'ADMIN'
    ? {}
    : { $or: [{ owner: user.id }, { members: user.id }] };
  const boards = await Board.find(filter).select('_id');
  return boards.map((board) => board._id);
};

const emitTaskEvent = (req, boardId, event, payload) => {
  const io = req.app.get('io');
  if (!io) return;

  io.to(boardId).emit(event, payload);
  io.to(boardId).emit('taskUpdated', payload);
};

const getCards = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { board, error, status } = await findBoardForUser(boardId, req.user);
    if (!board) return res.status(status).json({ message: error });

    const tasks = await populateTask(Task.find({ board: boardId }).sort({ status: 1, order: 1, createdAt: 1 }));
    res.json(tasks.map(serializeTask));
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTasks = async (req, res) => {
  try {
    const { boardId } = req.query;

    if (boardId) {
      req.params.boardId = boardId;
      return getCards(req, res);
    }

    const boardIds = await getAccessibleBoardIds(req.user);
    const tasks = await populateTask(Task.find({ board: { $in: boardIds } }).sort({ updatedAt: -1 }));

    res.json(tasks.map(serializeTask));
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createCard = async (req, res) => {
  try {
    const boardId = req.params.boardId || req.body.boardId;
    const { title, description, dueDate } = req.body;
    const status = normalizeStatus(req.body.status || req.body.columnId) || 'TODO';
    const priority = normalizePriority(req.body.priority) || 'MEDIUM';
    const assigneeId = req.body.assigneeId || req.body.assignee || null;

    if (!boardId) return res.status(400).json({ message: 'Board ID is required' });
    if (!title?.trim()) return res.status(400).json({ message: 'Card title is required' });
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    if (!VALID_PRIORITIES.includes(priority)) return res.status(400).json({ message: 'Invalid priority' });

    const { board, error, status: accessStatus } = await findBoardForUser(boardId, req.user);
    if (!board) return res.status(accessStatus).json({ message: error });

    const assigneeResult = await validateAssignee(board, assigneeId);
    if (assigneeResult?.error) {
      return res.status(assigneeResult.status).json({ message: assigneeResult.error });
    }

    const maxOrderTask = await Task.findOne({ board: boardId, status }).sort({ order: -1 }).select('order');
    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

    let task = await Task.create({
      board: boardId,
      title: title.trim(),
      description: description?.trim() || '',
      assignee: assigneeResult?.assignee?._id || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority,
      status,
      order,
      createdBy: req.user.id,
    });

    task = await populateTask(Task.findById(task._id));
    const serialized = serializeTask(task);

    emitTaskEvent(req, boardId, 'card:created', serialized);
    res.status(201).json(serialized);
  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: 'Card not found' });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Card not found' });

    const { board, error, status: accessStatus } = await findBoardForUser(toId(task.board), req.user);
    if (!board) return res.status(accessStatus).json({ message: error });

    if (req.user.role === 'MEMBER' && toId(task.createdBy) !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own cards' });
    }

    const nextStatus = normalizeStatus(req.body.status || req.body.columnId);
    const nextPriority = normalizePriority(req.body.priority);
    const assigneeId = req.body.assigneeId !== undefined ? req.body.assigneeId : req.body.assignee;

    if (nextStatus && !VALID_STATUSES.includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (nextPriority && !VALID_PRIORITIES.includes(nextPriority)) {
      return res.status(400).json({ message: 'Invalid priority' });
    }

    let assignee = task.assignee;
    if (assigneeId !== undefined) {
      const assigneeResult = await validateAssignee(board, assigneeId || null);
      if (assigneeResult?.error) {
        return res.status(assigneeResult.status).json({ message: assigneeResult.error });
      }
      assignee = assigneeResult?.assignee?._id || null;
    }

    if (req.body.title !== undefined) {
      if (!req.body.title?.trim()) return res.status(400).json({ message: 'Card title is required' });
      task.title = req.body.title.trim();
    }

    if (req.body.description !== undefined) task.description = req.body.description?.trim() || '';
    if (assigneeId !== undefined) task.assignee = assignee;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    if (nextPriority) task.priority = nextPriority;

    if (nextStatus && nextStatus !== task.status) {
      task.status = nextStatus;
      if (req.body.order === undefined) {
        const maxOrderTask = await Task.findOne({ board: task.board, status: nextStatus }).sort({ order: -1 }).select('order');
        task.order = maxOrderTask ? maxOrderTask.order + 1 : 0;
      }
    }

    if (req.body.order !== undefined) task.order = Number(req.body.order);

    await task.save();

    const updatedTask = await populateTask(Task.findById(id));
    const serialized = serializeTask(updatedTask);

    emitTaskEvent(req, serialized.boardId, 'card:updated', serialized);
    res.json(serialized);
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: 'Card not found' });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Card not found' });

    const { board, error, status } = await findBoardForUser(toId(task.board), req.user);
    if (!board) return res.status(status).json({ message: error });

    if (req.user.role === 'MEMBER' && toId(task.createdBy) !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own cards' });
    }

    const boardId = toId(task.board);
    await Task.findByIdAndDelete(id);

    emitTaskEvent(req, boardId, 'card:deleted', { id, boardId });
    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const reorderCards = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { cards, movedCardId } = req.body;

    if (!Array.isArray(cards)) {
      return res.status(400).json({ message: 'Cards array is required' });
    }

    const { board, error, status } = await findBoardForUser(boardId, req.user);
    if (!board) return res.status(status).json({ message: error });

    const ids = cards.map((card) => card.id).filter((id) => mongoose.isValidObjectId(id));
    if (ids.length !== cards.length) {
      return res.status(400).json({ message: 'Invalid card id in reorder payload' });
    }

    const existingTasks = await Task.find({ _id: { $in: ids }, board: boardId }).select('_id createdBy');
    if (existingTasks.length !== cards.length) {
      return res.status(400).json({ message: 'All reordered cards must belong to this board' });
    }

    if (req.user.role === 'MEMBER') {
      if (!movedCardId) {
        return res.status(400).json({ message: 'Moved card id is required' });
      }
      const movedTask = existingTasks.find((task) => toId(task) === movedCardId);
      if (!movedTask || toId(movedTask.createdBy) !== req.user.id) {
        return res.status(403).json({ message: 'You can only move your own cards' });
      }
    }

    const operations = cards.map((card) => {
      const nextStatus = normalizeStatus(card.status || card.columnId);
      if (!VALID_STATUSES.includes(nextStatus)) {
        throw new Error('Invalid status in reorder payload');
      }
      return {
        updateOne: {
          filter: { _id: card.id, board: boardId },
          update: { $set: { status: nextStatus, order: Number(card.order) || 0 } },
        },
      };
    });

    if (operations.length > 0) await Task.bulkWrite(operations);

    const payloadCards = cards.map((card) => {
      const status = normalizeStatus(card.status || card.columnId);
      return {
        id: card.id,
        status,
        columnId: status,
        order: Number(card.order) || 0,
      };
    });

    emitTaskEvent(req, boardId, 'card:reordered', { boardId, cards: payloadCards });
    res.json({ message: 'Cards reordered successfully' });
  } catch (error) {
    if (error.message === 'Invalid status in reorder payload') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Reorder cards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCards,
  getTasks,
  createCard,
  updateCard,
  deleteCard,
  reorderCards,
};
