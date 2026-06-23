import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';

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
      role: 'owner',
      status: 'pending', // Pending approval from super admin
      ownerId: null,
    });

    if (user) {
      // Send notification email to super admin
      try {
        await sendEmail({
          to: process.env.EMAIL_USER,
          subject: 'New Gym Registration Request',
          html: `<p>A new gym owner has registered and is awaiting approval:</p>
                 <ul>
                   <li><strong>Name:</strong> ${name}</li>
                   <li><strong>Email:</strong> ${email}</li>
                   <li><strong>Gym Name:</strong> ${gymName}</li>
                 </ul>
                 <p>Log in to your super admin dashboard to approve or reject this request.</p>`
        });
      } catch (emailErr) {
        console.error('Failed to send admin notification email:', emailErr);
      }

      res.status(202).json({
        message: 'Registration submitted successfully. Please wait for super admin approval before logging in.',
        pending: true
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
      if (user.status === 'pending') {
        return res.status(403).json({ message: 'Your account is currently pending approval by the admin.' });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({ message: 'Your account has been suspended by the admin.' });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({ message: `Your registration was rejected. Reason: ${user.rejectionReason || 'No reason provided.'}` });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        gymName: user.gymName,
        role: user.role,
        status: user.status,
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
