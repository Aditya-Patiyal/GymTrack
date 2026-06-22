import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Resolve gymOwnerId: owners use their own _id, staff use their ownerId
      req.gymOwnerId = req.user.role === 'owner' ? req.user._id : req.user.ownerId;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware: Owner-only actions
export const ownerOnly = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Access denied. Owner only.' });
  }
  next();
};
