const express = require('express');
const { authenticate } = require('../middleware/auth');
const { updateCard, deleteCard } = require('../controllers/cardController');

const router = express.Router();

router.use(authenticate);

router.patch('/:id', updateCard);
router.delete('/:id', deleteCard);

module.exports = router;
