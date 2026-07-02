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
      const memberCount = await Member.countDocuments({ createdBy: owner._id, isActive: true });
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
    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ message: 'A reason for suspension is required.' });
    }

    const owner = await User.findById(req.params.id);
    if (!owner || owner.role !== 'owner') {
      return res.status(404).json({ message: 'Owner not found' });
    }

    owner.status = 'suspended';
    owner.suspendedAt = new Date();
    owner.suspensionReason = reason.trim();
    await owner.save();

    await User.updateMany({ ownerId: owner._id }, { status: 'suspended' });

    // Send suspension notification email
    await sendEmail({
      to: owner.email,
      subject: '⚠️ Your GymPulse Account Has Been Suspended',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a1a1a, #2d2d2d); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">GymPulse</h1>
            <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0;">Account Suspension Notice</p>
          </div>
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-top: 0;">Hi ${owner.name},</h2>
            <p style="color: #555; line-height: 1.6;">
              We're writing to inform you that your gym <strong>${owner.gymName}</strong> on GymPulse has been <strong style="color: #e62030;">suspended</strong> by the platform administrator.
            </p>
            <div style="background: #fff3f3; border-left: 4px solid #e62030; padding: 16px; border-radius: 4px; margin: 20px 0;">
              <strong style="color: #c0392b;">Reason for Suspension:</strong>
              <p style="color: #555; margin: 8px 0 0;">${reason.trim()}</p>
            </div>
            <p style="color: #555;">During the suspension period, you and your staff will not be able to log in to the platform.</p>
            <p style="color: #555;">If you believe this is a mistake or wish to appeal, please contact support and reference your gym name: <strong>${owner.gymName}</strong>.</p>
          </div>
          <div style="padding: 20px; text-align: center; background: #f9f9f9; color: #aaa; font-size: 12px;">
            GymPulse Platform · This is an automated notification.
          </div>
        </div>
      `
    });

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
    owner.suspensionReason = '';
    await owner.save();

    // Reactivate staff
    await User.updateMany({ ownerId: owner._id }, { status: 'active' });

    // Send reactivation notification email
    await sendEmail({
      to: owner.email,
      subject: '\u2705 Your GymPulse Account Has Been Reactivated!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a6b3a, #27ae60); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">GymPulse</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Account Reactivated ✅</p>
          </div>
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-top: 0;">Great news, ${owner.name}! 🎉</h2>
            <p style="color: #555; line-height: 1.6;">
              Your gym <strong>${owner.gymName}</strong> on GymPulse has been <strong style="color: #27ae60;">reactivated</strong> by the platform administrator.
              Your account is fully active again and you can resume all operations immediately.
            </p>
            <p style="color: #555;">You and your staff can now log back in to the platform:</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://gym-track-phi.vercel.app/login"
                 style="background: linear-gradient(135deg, #1a6b3a, #27ae60); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                \uD83D\uDD11 Login to Your Dashboard
              </a>
            </div>
          </div>
          <div style="padding: 20px; text-align: center; background: #f9f9f9; color: #aaa; font-size: 12px;">
            GymPulse Platform &middot; This is an automated notification.
          </div>
        </div>
      `
    });

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

    // Only count members that belong to currently active gym owners
    const activeOwners = await User.find({ role: 'owner', status: 'active' }).select('_id');
    const activeOwnerIds = activeOwners.map(o => o._id);
    const totalMembers = await Member.countDocuments({ createdBy: { $in: activeOwnerIds }, isActive: true });

    res.json({
      totalGyms,
      pendingRequests,
      totalMembers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── BULK ACTIONS ─────────────────────────────────────────────────────────────

// PUT /api/admin/bulk/approve
export const bulkApprove = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ message: 'No IDs provided' });
    const now = new Date();
    await User.updateMany(
      { _id: { $in: ids }, role: 'owner', status: 'pending' },
      { status: 'active', approvedAt: now, suspendedAt: null, rejectionReason: '' }
    );
    res.json({ message: `${ids.length} registration(s) approved` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/bulk/reject
export const bulkReject = async (req, res) => {
  try {
    const { ids, reason } = req.body;
    if (!ids?.length) return res.status(400).json({ message: 'No IDs provided' });
    await User.updateMany(
      { _id: { $in: ids }, role: 'owner', status: 'pending' },
      { status: 'rejected', rejectionReason: reason || 'Rejected by admin.' }
    );
    res.json({ message: `${ids.length} registration(s) rejected` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/bulk/suspend
export const bulkSuspend = async (req, res) => {
  try {
    const { ids, reason } = req.body;
    if (!ids?.length) return res.status(400).json({ message: 'No IDs provided' });
    if (!reason?.trim()) return res.status(400).json({ message: 'A reason for suspension is required.' });

    const now = new Date();
    const trimmedReason = reason.trim();

    // Fetch owners to send emails
    const ownerDocs = await User.find({ _id: { $in: ids }, role: 'owner' });

    // Update all owners
    await User.updateMany(
      { _id: { $in: ids }, role: 'owner' },
      { status: 'suspended', suspendedAt: now, suspensionReason: trimmedReason }
    );
    await User.updateMany({ ownerId: { $in: ids } }, { status: 'suspended' });

    // Send emails in parallel (non-blocking for response speed)
    await Promise.allSettled(ownerDocs.map(owner =>
      sendEmail({
        to: owner.email,
        subject: '\u26a0\ufe0f Your GymPulse Account Has Been Suspended',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 10px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1a1a1a, #2d2d2d); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">GymPulse</h1>
              <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0;">Account Suspension Notice</p>
            </div>
            <div style="padding: 30px; background: white;">
              <h2 style="color: #333; margin-top: 0;">Hi ${owner.name},</h2>
              <p style="color: #555; line-height: 1.6;">
                Your gym <strong>${owner.gymName}</strong> on GymPulse has been <strong style="color: #e62030;">suspended</strong> by the platform administrator.
              </p>
              <div style="background: #fff3f3; border-left: 4px solid #e62030; padding: 16px; border-radius: 4px; margin: 20px 0;">
                <strong style="color: #c0392b;">Reason for Suspension:</strong>
                <p style="color: #555; margin: 8px 0 0;">${trimmedReason}</p>
              </div>
              <p style="color: #555;">During the suspension period, you and your staff will not be able to log in. If you believe this is a mistake, please contact support and reference: <strong>${owner.gymName}</strong>.</p>
            </div>
            <div style="padding: 20px; text-align: center; background: #f9f9f9; color: #aaa; font-size: 12px;">
              GymPulse Platform · Automated notification.
            </div>
          </div>
        `
      })
    ));

    res.json({ message: `${ids.length} owner(s) suspended` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/bulk/reactivate
export const bulkReactivate = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ message: 'No IDs provided' });

    // Fetch owners before updating so we have their email/name for notifications
    const ownerDocs = await User.find({ _id: { $in: ids }, role: 'owner' });

    await User.updateMany({ _id: { $in: ids }, role: 'owner' }, { status: 'active', suspendedAt: null, suspensionReason: '' });
    await User.updateMany({ ownerId: { $in: ids } }, { status: 'active' });

    // Send reactivation emails in parallel
    await Promise.allSettled(ownerDocs.map(owner =>
      sendEmail({
        to: owner.email,
        subject: '\u2705 Your GymPulse Account Has Been Reactivated!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 10px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1a6b3a, #27ae60); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">GymPulse</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Account Reactivated \u2705</p>
            </div>
            <div style="padding: 30px; background: white;">
              <h2 style="color: #333; margin-top: 0;">Great news, ${owner.name}! \uD83C\uDF89</h2>
              <p style="color: #555; line-height: 1.6;">
                Your gym <strong>${owner.gymName}</strong> on GymPulse has been <strong style="color: #27ae60;">reactivated</strong> by the platform administrator.
                Your account is fully active again and you can resume all operations immediately.
              </p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://gym-track-phi.vercel.app/login"
                   style="background: linear-gradient(135deg, #1a6b3a, #27ae60); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                  \uD83D\uDD11 Login to Your Dashboard
                </a>
              </div>
            </div>
            <div style="padding: 20px; text-align: center; background: #f9f9f9; color: #aaa; font-size: 12px;">
              GymPulse Platform &middot; Automated notification.
            </div>
          </div>
        `
      })
    ));

    res.json({ message: `${ids.length} owner(s) reactivated` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/bulk/delete
export const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ message: 'No IDs provided' });
    await User.deleteMany({ ownerId: { $in: ids } });
    await Member.deleteMany({ createdBy: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids }, role: 'owner' });
    res.json({ message: `${ids.length} gym(s) permanently deleted` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
