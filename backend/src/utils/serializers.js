const { DEFAULT_COLUMNS } = require('./kanban');

const toId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value._id) return value._id.toString();
  if (value.id) return value.id.toString();
  return value.toString();
};

const serializeUser = (user) => {
  if (!user || typeof user !== 'object' || !user.email) return null;

  const serialized = {
    id: toId(user),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (user._count) serialized._count = user._count;

  return serialized;
};

const serializeTask = (task) => {
  const assignee = serializeUser(task.assignee);
  const createdBy = serializeUser(task.createdBy);
  const status = task.status || 'TODO';

  return {
    id: toId(task),
    title: task.title,
    description: task.description || '',
    assigneeId: toId(task.assignee),
    assignee,
    dueDate: task.dueDate,
    priority: task.priority || 'MEDIUM',
    status,
    columnId: status,
    order: task.order || 0,
    boardId: toId(task.board),
    createdById: toId(task.createdBy),
    createdBy,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};

const serializeBoard = (board) => {
  const owner = serializeUser(board.owner);
  const members = (board.members || [])
    .map((member) => ({ user: serializeUser(member) }))
    .filter((member) => member.user);

  return {
    id: toId(board),
    name: board.name,
    description: board.description || '',
    ownerId: toId(board.owner),
    owner,
    members,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
};

const buildBoardPayload = (board, tasks = []) => {
  const serializedTasks = tasks.map(serializeTask);

  return {
    ...serializeBoard(board),
    columns: DEFAULT_COLUMNS.map((column) => ({
      ...column,
      cards: serializedTasks
        .filter((task) => task.status === column.id)
        .sort((a, b) => a.order - b.order),
    })),
  };
};

module.exports = {
  toId,
  serializeUser,
  serializeTask,
  serializeBoard,
  buildBoardPayload,
};
