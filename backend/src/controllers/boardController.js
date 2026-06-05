const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_COLUMNS = [
  { name: 'To Do', order: 0, color: '#6366f1' },
  { name: 'In Progress', order: 1, color: '#f59e0b' },
  { name: 'Done', order: 2, color: '#10b981' },
];

// GET /api/boards
const getBoards = async (req, res) => {
  try {
    const userId = req.user.id;

    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
        _count: { select: { columns: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(boards);
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/boards
const createBoard = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Board name is required' });

    const board = await prisma.board.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        columns: {
          create: DEFAULT_COLUMNS,
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        columns: { orderBy: { order: 'asc' } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
      },
    });

    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) io.emit('board:created', board);

    res.status(201).json(board);
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/boards/:id
const getBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
              include: {
                assignee: { select: { id: true, name: true, email: true } },
                createdBy: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
      },
    });

    if (!board) return res.status(404).json({ message: 'Board not found' });

    const isMember = board.ownerId === userId || board.members.some((m) => m.userId === userId);
    if (!isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(board);
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/boards/:id
const deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const board = await prisma.board.findUnique({ where: { id } });

    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (board.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only the board owner can delete it' });
    }

    await prisma.board.delete({ where: { id } });

    const io = req.app.get('io');
    if (io) io.emit('board:deleted', { id });

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/boards/:id/members
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const board = await prisma.board.findUnique({ where: { id } });
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (board.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only the board owner can add members' });
    }

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return res.status(404).json({ message: 'User not found' });

    if (board.ownerId === userToAdd.id) {
      return res.status(400).json({ message: 'User is already the board owner' });
    }

    const existing = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId: id, userId: userToAdd.id } },
    });
    if (existing) return res.status(400).json({ message: 'User is already a member' });

    await prisma.boardMember.create({ data: { boardId: id, userId: userToAdd.id } });

    const updatedBoard = await prisma.board.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
      },
    });

    const io = req.app.get('io');
    if (io) io.to(id).emit('board:memberAdded', { boardId: id, user: userToAdd });

    res.status(201).json(updatedBoard);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/boards/:id/members/:userId
const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const board = await prisma.board.findUnique({ where: { id } });
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (board.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only the board owner can remove members' });
    }

    await prisma.boardMember.deleteMany({ where: { boardId: id, userId } });

    const io = req.app.get('io');
    if (io) io.to(id).emit('board:memberRemoved', { boardId: id, userId });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getBoards, createBoard, getBoard, deleteBoard, addMember, removeMember };
