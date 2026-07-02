import Member from '../models/Member.js';
import Membership from '../models/Membership.js';
import Payment from '../models/Payment.js';

export const getMembers = async (req, res) => {
  try {
    const { search, status } = req.query;

    // Deleted members (isActive: false) are never shown in any list view
    let query = { createdBy: req.gymOwnerId, isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Note: 'inactive' status is a membership plan state, not the isActive field.
    // Deleted members (isActive:false) are never returned.

    const members = await Member.find(query)
      .populate('addedBy', 'name role')
      .sort({ createdAt: -1 });

    const membersWithStatus = await Promise.all(members.map(async (member) => {
      const latestMembership = await Membership.findOne({ member: member._id })
        .populate('collectedBy', 'name role')
        .sort({ endDate: -1 });

      let memberStatus = '⚫ Inactive';
      let daysLeft = 0;

      if (member.isActive) {
        if (!latestMembership) {
          memberStatus = '⚫ No Plan';
        } else {
          const today = new Date();
          const endDate = new Date(latestMembership.endDate);
          daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

          if (daysLeft < 0) memberStatus = '🔴 Expired';
          else if (daysLeft <= 7) memberStatus = '🟡 Expiring Soon';
          else memberStatus = '🟢 Active';
        }
      }

      return {
        ...member._doc,
        status: memberStatus,
        daysLeft,
        currentPlan: latestMembership ? latestMembership.planLabel : 'None',
        endDate: latestMembership ? latestMembership.endDate : null,
      };
    }));

    let filteredMembers = membersWithStatus;
    if (status === 'active') filteredMembers = membersWithStatus.filter(m => m.status === '🟢 Active');
    if (status === 'expiring') filteredMembers = membersWithStatus.filter(m => m.status === '🟡 Expiring Soon');
    if (status === 'expired') filteredMembers = membersWithStatus.filter(m => m.status === '🔴 Expired');

    res.json(filteredMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMemberById = async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.params.id, createdBy: req.gymOwnerId })
      .populate('addedBy', 'name role');
    if (!member) {
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
      createdBy: req.gymOwnerId,  // Always scoped to the gym owner
      addedBy: req.user._id,      // Who actually added (owner or staff)
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

    const { name, age, gender, phone, notes, isActive } = req.body;

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
    member.isActive = isActive !== undefined ? isActive : member.isActive;

    const updatedMember = await member.save();
    res.json(updatedMember);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner-only: hard deactivate a member directly
export const deactivateMember = async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.params.id, createdBy: req.gymOwnerId });
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    member.isActive = false;
    await member.save();
    res.json({ message: 'Member deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
