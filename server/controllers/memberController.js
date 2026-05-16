import Member from '../models/Member.js';
import Membership from '../models/Membership.js';

export const getMembers = async (req, res) => {
  try {
    const { search, status } = req.query;
    
    let query = { createdBy: req.user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'active' || status === 'expiring' || status === 'expired') {
      query.isActive = true;
      // Note: Full status filtering is complex because status is virtual.
      // In a real app we'd aggregate. For this simple app we'll fetch all and filter in JS 
      // if it's a small dataset, or we can write an aggregation pipeline.
      // Let's keep it simple and just return active members here.
    }

    const members = await Member.find(query).sort({ createdAt: -1 });
    
    // Fetch latest membership for each member to calculate status
    const membersWithStatus = await Promise.all(members.map(async (member) => {
      const latestMembership = await Membership.findOne({ member: member._id }).sort({ endDate: -1 });
      
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
        endDate: latestMembership ? latestMembership.endDate : null
      };
    }));

    // Filter by computed status if requested
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
    const member = await Member.findOne({ _id: req.params.id, createdBy: req.user._id });
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
    
    const memberExists = await Member.findOne({ phone, createdBy: req.user._id });
    if (memberExists) {
      return res.status(400).json({ message: 'Member with this phone already exists' });
    }

    const member = await Member.create({
      name, age, gender, phone, notes, createdBy: req.user._id
    });

    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMember = async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const { name, age, gender, phone, notes, isActive } = req.body;

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
