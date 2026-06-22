import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// GET /api/staff — List all staff under this owner
export const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ ownerId: req.user._id, role: 'staff' }).select('-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/staff — Create a new staff account (owner only)
export const createStaff = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const staff = await User.create({
      name,
      email,
      password,
      role: 'staff',
      ownerId: req.user._id,
      gymName: req.user.gymName, // inherit gym name from owner
    });

    res.status(201).json({
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      gymName: staff.gymName,
      createdAt: staff.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/staff/:id — Remove a staff account (owner only)
export const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.id, ownerId: req.user._id, role: 'staff' });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    await staff.deleteOne();
    res.json({ message: 'Staff member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
