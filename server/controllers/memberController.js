import Member from '../models/Member.js';
import Membership from '../models/Membership.js';
import Payment from '../models/Payment.js';

export const getMembers = async (req, res) => {
  try {
    const { search, status } = req.query;

    // isActive:false = DELETED → never shown. isActive:true = visible (active OR inactive/on-hold)
    let query = { createdBy: req.gymOwnerId, isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // 'inactive-member' tab: show only on-hold members (memberStatus:'inactive')
    // These are STILL isActive:true — they are NOT deleted, just paused
    if (status === 'inactive-member') {
      query.memberStatus = 'inactive';
    }
    // For all other filters, only look at memberStatus:'active' members
    // (inactive/on-hold members shouldn't show up in Active/Expiring/Expired tabs)
    else if (['active', 'expiring', 'expired'].includes(status)) {
      query.memberStatus = 'active';
    }

    const members = await Member.find(query)
      .populate('addedBy', 'name role')
      .sort({ createdAt: -1 });

    const membersWithStatus = await Promise.all(members.map(async (member) => {
      const latestMembership = await Membership.findOne({ member: member._id })
        .populate('collectedBy', 'name role')
        .sort({ endDate: -1 });

      // If member is on hold, always show as On Hold regardless of plan
      if (member.memberStatus === 'inactive') {
        return {
          ...member._doc,
          status: '⏸️ On Hold',
          daysLeft: 0,
          currentPlan: latestMembership ? latestMembership.planLabel : 'None',
          endDate: latestMembership ? latestMembership.endDate : null,
        };
      }

      // Active member — compute membership plan status
      let memberStatusLabel = '⚫ No Plan';
      let daysLeft = 0;

      if (latestMembership) {
        const today = new Date();
        const endDate = new Date(latestMembership.endDate);
        daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) memberStatusLabel = '🔴 Expired';
        else if (daysLeft <= 7) memberStatusLabel = '🟡 Expiring Soon';
        else memberStatusLabel = '🟢 Active';
      }

      return {
        ...member._doc,
        status: memberStatusLabel,
        daysLeft,
        currentPlan: latestMembership ? latestMembership.planLabel : 'None',
        endDate: latestMembership ? latestMembership.endDate : null,
      };
    }));

    let filteredMembers = membersWithStatus;
    if (status === 'active')   filteredMembers = membersWithStatus.filter(m => m.status === '🟢 Active');
    if (status === 'expiring') filteredMembers = membersWithStatus.filter(m => m.status === '🟡 Expiring Soon');
    if (status === 'expired')  filteredMembers = membersWithStatus.filter(m => m.status === '🔴 Expired');

    res.json(filteredMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMemberById = async (req, res) => {
  try {
    // isActive:true check removed here so owner can still view on-hold member details
    const member = await Member.findOne({ _id: req.params.id, createdBy: req.gymOwnerId })
      .populate('addedBy', 'name role');
    if (!member || !member.isActive) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMember = async (req, res) => {
  try {
    const { name, age, gender, phone, notes } = req.body;

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone format. Must be exactly 10 digits.' });
    }

    const memberExists = await Member.findOne({ phone, createdBy: req.gymOwnerId });
    if (memberExists) {
      return res.status(400).json({ message: 'Member with this phone already exists' });
    }

    const member = await Member.create({
      name, age, gender, phone, notes,
      createdBy: req.gymOwnerId,
      addedBy: req.user._id,
    });

    await member.populate('addedBy', 'name role');
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMember = async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.params.id, createdBy: req.gymOwnerId });
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const { name, age, gender, phone, notes } = req.body;

    if (phone) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: 'Invalid phone format. Must be exactly 10 digits.' });
      }
    }

    member.name = name || member.name;
    member.age = age || member.age;
    member.gender = gender || member.gender;
    member.phone = phone || member.phone;
    member.notes = notes !== undefined ? notes : member.notes;

    const updatedMember = await member.save();
    res.json(updatedMember);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner-only: put member ON HOLD — all data preserved, still visible, just paused
export const setInactive = async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.params.id, createdBy: req.gymOwnerId });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    if (!member.isActive) return res.status(400).json({ message: 'Member is deleted' });
    member.memberStatus = 'inactive';          // ON HOLD — NOT deleted
    member.inactiveSince = new Date();
    await member.save();
    res.json({ message: 'Member put on hold (inactive)', member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner-only: lift the hold — member becomes fully active again
export const reactivateMember = async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.params.id, createdBy: req.gymOwnerId });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    member.memberStatus = 'active';
    member.inactiveSince = null;
    await member.save();
    res.json({ message: 'Member reactivated', member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner-only: permanently delete — sets isActive:false, member disappears from all views
export const deactivateMember = async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.params.id, createdBy: req.gymOwnerId });
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    member.isActive = false;   // DELETED — hidden from all views
    await member.save();
    res.json({ message: 'Member permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
