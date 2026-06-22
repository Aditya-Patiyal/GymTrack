import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d',
  });
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// Public registration — always creates an OWNER account
export const registerUser = async (req, res) => {
  const { name, email, password, gymName } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (!gymName) {
    return res.status(400).json({ message: 'Gym name is required for owner registration' });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      gymName,
      role: 'owner', // Enforced — public registration is always owner
      ownerId: null,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        gymName: user.gymName,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        gymName: user.gymName,
        role: user.role,
        ownerId: user.ownerId,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
