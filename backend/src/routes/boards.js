const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember,
} = require('../controllers/boardController');
const { getCards, createCard, reorderCards } = require('../controllers/cardController');

const router = express.Router();

router.use(authenticate);

router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:id', getBoard);
router.put('/:id', updateBoard);
router.patch('/:id', updateBoard);
router.delete('/:id', deleteBoard);

router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

router.get('/:boardId/cards', getCards);
router.post('/:boardId/cards', createCard);
router.patch('/:boardId/cards/reorder', reorderCards);

module.exports = router;
