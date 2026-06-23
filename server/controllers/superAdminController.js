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
    await owner.save();

    // Send email to owner
    try {
      await sendEmail({
        to: owner.email,
        subject: 'GymPulse Account Approved!',
        html: `<p>Hi ${owner.name},</p>
               <p>Your registration for <strong>${owner.gymName}</strong> has been approved by the admin team.</p>
               <p>You can now log in to your dashboard and start managing your gym.</p>`
      });
    } catch (e) {
      console.error('Email failed to send, but owner approved.');
    }

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

    // Send email to owner
    try {
      await sendEmail({
        to: owner.email,
        subject: 'GymPulse Registration Update',
        html: `<p>Hi ${owner.name},</p>
               <p>Unfortunately, your registration for <strong>${owner.gymName}</strong> has been rejected by the admin team.</p>
               <p><strong>Reason:</strong> ${owner.rejectionReason}</p>
               <p>If you believe this is a mistake, please contact support.</p>`
      });
    } catch (e) {
      console.error('Email failed to send, but owner rejected.');
    }

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
