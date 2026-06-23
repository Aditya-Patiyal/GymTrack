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

      if (req.user.status === 'pending') {
        return res.status(403).json({ message: 'Your account is pending approval by the admin.' });
      }
      if (req.user.status === 'suspended') {
        return res.status(403).json({ message: 'Your account has been suspended.' });
      }

      // Resolve gymOwnerId: owners use their own _id, staff use their ownerId
      // Super admin can impersonate by passing X-Gym-Id header
      if (req.user.role === 'super_admin') {
        req.gymOwnerId = req.headers['x-gym-id'] || null;
      } else {
        req.gymOwnerId = req.user.role === 'owner' ? req.user._id : req.user.ownerId;
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware: Owner or Super Admin
export const ownerOnly = (req, res, next) => {
  if (req.user.role !== 'owner' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Access denied. Owner only.' });
  }
  next();
};

// Middleware: Super Admin only
export const superAdminOnly = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Access denied. Super Admin only.' });
  }
  next();
};
