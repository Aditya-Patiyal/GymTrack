import User from '../models/User.js';
import Member from '../models/Member.js';
import { sendEmail } from '../utils/sendEmail.js';

// GET /api/admin/registrations (Pending owners)
export const getPendingRegistrations = async (req, res) => {
  try {
    const pendingOwners = await User.find({ role: 'owner', status: 'pending' }).select('-password').sort({ createdAt: -1 });
    res.json(pendingOwners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/registrations/:id/approve
export const approveRegistration = async (req, res) => {
  try {
    const owner = await User.findById(req.params.id);
    if (!owner || owner.role !== 'owner') {
      return res.status(404).json({ message: 'Owner not found' });
    }

    owner.status = 'active';
    owner.rejectionReason = '';
    owner.approvedAt = new Date();
    owner.suspendedAt = null;
    await owner.save();

    // Send approval email BEFORE responding (has 10s timeout in sendEmail)
    await sendEmail({
      to: owner.email,
      subject: '🎉 Your GymPulse Account Has Been Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #6c63ff, #48cae4); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">GymPulse</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Account Approved</p>
          </div>
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-top: 0;">Welcome aboard, ${owner.name}! 🏋️</h2>
            <p style="color: #555; line-height: 1.6;">
              We're excited to let you know that your gym <strong>${owner.gymName}</strong> has been approved by our admin team.
              Your account is now fully active and ready to use.
            </p>
            <p style="color: #555;">You can now:</p>
            <ul style="color: #555; line-height: 2;">
              <li>Add and manage your gym members</li>
              <li>Track payments and memberships</li>
              <li>Invite your staff to the platform</li>
            </ul>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://gym-track-phi.vercel.app/login"
                 style="background: linear-gradient(135deg, #6c63ff, #48cae4); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                🔑 Login to Your Dashboard
              </a>
            </div>
          </div>
          <div style="padding: 20px; text-align: center; background: #f9f9f9; color: #aaa; font-size: 12px;">
            GymPulse Platform · If you have any questions, reply to this email.
          </div>
        </div>
      `
    });

    res.json({ message: 'Owner approved successfully', owner });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/registrations/:id/reject
export const rejectRegistration = async (req, res) => {
  try {
    const { reason } = req.body;
    const owner = await User.findById(req.params.id);
    
    if (!owner || owner.role !== 'owner') {
      return res.status(404).json({ message: 'Owner not found' });
    }

    owner.status = 'rejected';
    owner.rejectionReason = reason || 'No reason provided by admin.';
    await owner.save();

    // Send rejection email BEFORE responding (has 10s timeout in sendEmail)
    await sendEmail({
      to: owner.email,
      subject: 'Update on Your GymPulse Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 10px; overflow: hidden;">
          <div style="background: #444; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">GymPulse</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0;">Registration Update</p>
          </div>
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-top: 0;">Hi ${owner.name},</h2>
            <p style="color: #555; line-height: 1.6;">
              Thank you for registering <strong>${owner.gymName}</strong> on GymPulse. After review, 
              we were unable to approve your registration at this time.
            </p>
            <div style="background: #fff3f3; border-left: 4px solid #e17055; padding: 16px; border-radius: 4px; margin: 20px 0;">
              <strong style="color: #c0392b;">Reason:</strong>
              <p style="color: #555; margin: 8px 0 0;">${owner.rejectionReason}</p>
            </div>
            <p style="color: #555;">If you believe this is a mistake or would like to re-apply with updated information, you can register again on our platform.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://gym-track-phi.vercel.app/login"
                 style="background: #444; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                Go to GymPulse
              </a>
            </div>
          </div>
          <div style="padding: 20px; text-align: center; background: #f9f9f9; color: #aaa; font-size: 12px;">
            GymPulse Platform · If you have any questions, reply to this email.
          </div>
        </div>
      `
    });

    res.json({ message: 'Owner rejected successfully', owner });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/owners (All active/suspended owners)
export const getOwners = async (req, res) => {
  try {
    const owners = await User.find({ role: 'owner', status: { $in: ['active', 'suspended'] } }).select('-password').sort({ createdAt: -1 });
    
    // Attach member count for each gym
    const ownersWithStats = await Promise.all(owners.map(async (owner) => {
      const memberCount = await Member.countDocuments({ createdBy: owner._id });
      const staffCount = await User.countDocuments({ ownerId: owner._id, role: 'staff' });
      return { ...owner._doc, memberCount, staffCount };
    }));

    res.json(ownersWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/owners/:id/suspend
export const suspendOwner = async (req, res) => {
  try {
    const owner = await User.findById(req.params.id);
    if (!owner || owner.role !== 'owner') {
      return res.status(404).json({ message: 'Owner not found' });
    }
    
    owner.status = 'suspended';
    owner.suspendedAt = new Date();
    await owner.save();

    // Also suspend all their staff (optional, but they are implicitly blocked if we check owner status, 
    // but easier to just let authMiddleware check staff's own status)
    await User.updateMany({ ownerId: owner._id }, { status: 'suspended' });

    res.json({ message: 'Owner and associated staff suspended', owner });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/owners/:id/reactivate
export const reactivateOwner = async (req, res) => {
  try {
    const owner = await User.findById(req.params.id);
    if (!owner || owner.role !== 'owner') {
      return res.status(404).json({ message: 'Owner not found' });
    }
    
    owner.status = 'active';
    owner.suspendedAt = null;
    await owner.save();

    // Reactivate staff
    await User.updateMany({ ownerId: owner._id }, { status: 'active' });

    res.json({ message: 'Owner and associated staff reactivated', owner });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/stats
export const getAdminStats = async (req, res) => {
  try {
    const totalGyms = await User.countDocuments({ role: 'owner', status: 'active' });
    const pendingRequests = await User.countDocuments({ role: 'owner', status: 'pending' });
    const totalMembers = await Member.countDocuments();
    
    res.json({
      totalGyms,
      pendingRequests,
      totalMembers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
