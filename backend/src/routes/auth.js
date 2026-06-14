const express = require('express');
const { register, login, getMe, resetDb } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/reset-db', resetDb);

module.exports = router;
