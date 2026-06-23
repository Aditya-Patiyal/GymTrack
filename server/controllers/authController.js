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
      // Allow re-registration only if account is suspended or rejected
      if (userExists.status === 'suspended' || userExists.status === 'rejected') {
        // Update the existing record in-place with the new registration details.
        // This preserves the user's _id so existing gym data (members, payments) 
        // remains associated, and avoids the unique email constraint.
        userExists.name = name;
        userExists.gymName = gymName;
        userExists.password = password; // pre-save hook will re-hash
        userExists.status = 'pending';
        userExists.rejectionReason = '';
        await userExists.save();

        // Send notification email to super admin
        await sendEmail({
          to: process.env.EMAIL_USER,
          subject: '🏋️ Re-Registration Request — Action Required',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 10px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #6c63ff, #48cae4); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">GymPulse</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Super Admin Notification</p>
              </div>
              <div style="padding: 30px; background: white;">
                <h2 style="color: #333; margin-top: 0;">Re-Registration Request</h2>
                <p style="color: #e17055;"><strong>Note:</strong> This email was previously associated with a suspended or rejected account.</p>
                <p style="color: #555;">Details of the new request:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr style="background: #f0f0f0;">
                    <td style="padding: 12px; font-weight: bold; width: 40%;">Owner Name</td>
                    <td style="padding: 12px;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; font-weight: bold;">Email</td>
                    <td style="padding: 12px;">${email}</td>
                  </tr>
                  <tr style="background: #f0f0f0;">
                    <td style="padding: 12px; font-weight: bold;">Gym Name</td>
                    <td style="padding: 12px;">${gymName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; font-weight: bold;">Submitted At</td>
                    <td style="padding: 12px;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
                  </tr>
                </table>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://gym-track-phi.vercel.app/login"
                     style="background: linear-gradient(135deg, #6c63ff, #48cae4); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                    🔑 Login to Review Request
                  </a>
                </div>
              </div>
              <div style="padding: 20px; text-align: center; background: #f9f9f9; color: #aaa; font-size: 12px;">
                GymPulse Platform · Super Admin Portal
              </div>
            </div>
          `
        });

        return res.status(202).json({
          message: 'Registration submitted successfully. Please wait for super admin approval before logging in.',
          pending: true
        });
      }

      // Account is active or pending — block registration
      if (userExists.status === 'active') {
        return res.status(400).json({ message: 'An account with this email already exists. Please log in.' });
      }
      if (userExists.status === 'pending') {
        return res.status(400).json({ message: 'A registration with this email is already pending approval. Please wait for admin review.' });
      }
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
      // Send notification email to super admin BEFORE responding.
      // sendEmail has a built-in 10s timeout — safe to await in serverless.
      await sendEmail({
        to: process.env.EMAIL_USER,
        subject: '🏋️ New Gym Registration Request — Action Required',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 10px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #6c63ff, #48cae4); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">GymPulse</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Super Admin Notification</p>
            </div>
            <div style="padding: 30px; background: white;">
              <h2 style="color: #333; margin-top: 0;">New Gym Registration Request</h2>
              <p style="color: #555;">A new gym owner has registered and is awaiting your approval:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f0f0f0;">
                  <td style="padding: 12px; font-weight: bold; width: 40%;">Owner Name</td>
                  <td style="padding: 12px;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; font-weight: bold;">Email</td>
                  <td style="padding: 12px;">${email}</td>
                </tr>
                <tr style="background: #f0f0f0;">
                  <td style="padding: 12px; font-weight: bold;">Gym Name</td>
                  <td style="padding: 12px;">${gymName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; font-weight: bold;">Submitted At</td>
                  <td style="padding: 12px;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
                </tr>
              </table>
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://gym-track-phi.vercel.app/login" 
                   style="background: linear-gradient(135deg, #6c63ff, #48cae4); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                  🔑 Login to Review Request
                </a>
              </div>
            </div>
            <div style="padding: 20px; text-align: center; background: #f9f9f9; color: #aaa; font-size: 12px;">
              GymPulse Platform · Super Admin Portal
            </div>
          </div>
        `
      });

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
