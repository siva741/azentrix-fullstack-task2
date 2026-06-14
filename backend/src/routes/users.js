const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { createUser, getUsers, updateUser, deleteUser } = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
