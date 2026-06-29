import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/sendEmail.js';

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

    // Send notification email to the new staff member
    await sendEmail({
      to: email,
      subject: `🏋️ You've Been Added to ${req.user.gymName} on GymPulse!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #e62030, #ff4d5e); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">GymPulse</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Staff Account Created</p>
          </div>
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-top: 0;">Welcome, ${name}! 👋</h2>
            <p style="color: #555; line-height: 1.6;">
              You've been added as a <strong>Staff Member</strong> at <strong>${req.user.gymName}</strong> by ${req.user.name}.
            </p>
            <p style="color: #555;">Your login details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #f0f0f0;">
                <td style="padding: 12px; font-weight: bold; width: 40%;">Email</td>
                <td style="padding: 12px;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold;">Password</td>
                <td style="padding: 12px;">${password}</td>
              </tr>
              <tr style="background: #f0f0f0;">
                <td style="padding: 12px; font-weight: bold;">Gym</td>
                <td style="padding: 12px;">${req.user.gymName}</td>
              </tr>
            </table>
            <p style="color: #e62030; font-size: 13px;"><strong>⚠️ Please change your password after your first login.</strong></p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://gym-track-phi.vercel.app/login"
                 style="background: linear-gradient(135deg, #e62030, #ff4d5e); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                🔑 Login to GymPulse
              </a>
            </div>
          </div>
          <div style="padding: 20px; text-align: center; background: #f9f9f9; color: #aaa; font-size: 12px;">
            GymPulse Platform · Staff Portal
          </div>
        </div>
      `
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
