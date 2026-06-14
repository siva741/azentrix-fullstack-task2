const DEFAULT_COLUMNS = [
  { id: 'TODO', name: 'To Do', order: 0, color: '#0c66e4' },
  { id: 'IN_PROGRESS', name: 'In Progress', order: 1, color: '#f59e0b' },
  { id: 'DONE', name: 'Done', order: 2, color: '#22a06b' },
];

const VALID_STATUSES = DEFAULT_COLUMNS.map((column) => column.id);
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const normalizeStatus = (value) => {
  if (!value) return undefined;
  const normalized = String(value).trim().toUpperCase().replace(/[\s-]+/g, '_');

  if (normalized === 'TO_DO') return 'TODO';
  if (normalized === 'INPROGRESS') return 'IN_PROGRESS';

  return normalized;
};

const normalizePriority = (value) => {
  if (!value) return undefined;
  return String(value).trim().toUpperCase();
};

module.exports = {
  DEFAULT_COLUMNS,
  VALID_STATUSES,
  VALID_PRIORITIES,
  normalizeStatus,
  normalizePriority,
};
