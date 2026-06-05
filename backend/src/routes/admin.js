const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { getUsers, updateUser, deleteUser } = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
