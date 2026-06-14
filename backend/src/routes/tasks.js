const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getTasks, createCard, updateCard, deleteCard } = require('../controllers/cardController');

const router = express.Router();

router.use(authenticate);

router.get('/', getTasks);
router.post('/', createCard);
router.put('/:id', updateCard);
router.patch('/:id', updateCard);
router.delete('/:id', deleteCard);

module.exports = router;
