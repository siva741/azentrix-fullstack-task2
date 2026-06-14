const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { serializeUser } = require('../utils/serializers');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId)
      .select('name email role createdAt updatedAt')
      .lean();

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = serializeUser(user);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
