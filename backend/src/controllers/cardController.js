const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const canAccessBoard = async (boardId, userId, userRole) => {
  if (userRole === 'ADMIN') return true;
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { members: { where: { userId } } },
  });
  return board && (board.ownerId === userId || board.members.length > 0);
};

// GET /api/boards/:boardId/cards
const getCards = async (req, res) => {
  try {
    const { boardId } = req.params;
    const hasAccess = await canAccessBoard(boardId, req.user.id, req.user.role);
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    const cards = await prisma.card.findMany({
      where: { column: { boardId } },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        column: { select: { id: true, name: true } },
      },
      orderBy: [{ columnId: 'asc' }, { order: 'asc' }],
    });

    res.json(cards);
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/boards/:boardId/cards
const createCard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title, description, columnId, assigneeId, dueDate, priority } = req.body;

    if (!title) return res.status(400).json({ message: 'Card title is required' });
    if (!columnId) return res.status(400).json({ message: 'Column ID is required' });

    const hasAccess = await canAccessBoard(boardId, req.user.id, req.user.role);
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    // Verify column belongs to board
    const column = await prisma.column.findFirst({ where: { id: columnId, boardId } });
    if (!column) return res.status(404).json({ message: 'Column not found on this board' });

    // Get max order in column
    const maxOrderCard = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { order: 'desc' },
    });
    const order = maxOrderCard ? maxOrderCard.order + 1 : 0;

    const card = await prisma.card.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        order,
        columnId,
        assigneeId: assigneeId || null,
        createdById: req.user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        column: { select: { id: true, name: true, boardId: true } },
      },
    });

    const io = req.app.get('io');
    if (io) io.to(boardId).emit('card:created', card);

    res.status(201).json(card);
  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/cards/:id
const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, columnId, assigneeId, dueDate, priority, order } = req.body;

    const card = await prisma.card.findUnique({
      where: { id },
      include: { column: { select: { boardId: true } } },
    });

    if (!card) return res.status(404).json({ message: 'Card not found' });

    const boardId = card.column.boardId;
    const hasAccess = await canAccessBoard(boardId, req.user.id, req.user.role);
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    // Members can only edit cards they created
    if (req.user.role === 'MEMBER' && card.createdById !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own cards' });
    }

    const updatedCard = await prisma.card.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(columnId !== undefined && { columnId }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(priority !== undefined && { priority }),
        ...(order !== undefined && { order }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        column: { select: { id: true, name: true, boardId: true } },
      },
    });

    const io = req.app.get('io');
    if (io) io.to(boardId).emit('card:updated', updatedCard);

    res.json(updatedCard);
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/cards/:id
const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await prisma.card.findUnique({
      where: { id },
      include: { column: { select: { boardId: true } } },
    });

    if (!card) return res.status(404).json({ message: 'Card not found' });

    const boardId = card.column.boardId;

    // Members can only delete their own cards; Admins can delete any
    if (req.user.role === 'MEMBER' && card.createdById !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own cards' });
    }

    await prisma.card.delete({ where: { id } });

    const io = req.app.get('io');
    if (io) io.to(boardId).emit('card:deleted', { id, boardId });

    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/boards/:boardId/cards/reorder
const reorderCards = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { cards } = req.body; // [{ id, columnId, order }]

    const hasAccess = await canAccessBoard(boardId, req.user.id, req.user.role);
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    // Batch update using transaction
    await prisma.$transaction(
      cards.map(({ id, columnId, order }) =>
        prisma.card.update({ where: { id }, data: { columnId, order } })
      )
    );

    const io = req.app.get('io');
    if (io) io.to(boardId).emit('card:reordered', { boardId, cards });

    res.json({ message: 'Cards reordered successfully' });
  } catch (error) {
    console.error('Reorder cards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getCards, createCard, updateCard, deleteCard, reorderCards };
