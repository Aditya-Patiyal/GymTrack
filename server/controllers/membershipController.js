import Membership from '../models/Membership.js';
import Member from '../models/Member.js';
import Payment from '../models/Payment.js';

const getMonthsForPlan = (plan) => {
  const durations = { '1_month': 1, '2_month': 2, '4_month': 4, 'yearly': 12 };
  return durations[plan] || 1;
};

export const createMembership = async (req, res) => {
  try {
    const { memberId, plan, planLabel, price, startDate } = req.body;

    // Allow access for both owner and staff (scoped to the gym owner's members)
    const member = await Member.findOne({ _id: memberId, createdBy: req.gymOwnerId });
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + getMonthsForPlan(plan));

    const membership = await Membership.create({
      member: memberId,
      plan,
      planLabel,
      price,
      startDate: start,
      endDate: end,
      collectedBy: req.user._id, // Track who created/renewed the plan
    });

    // Auto-create pending payment
    await Payment.create({
      member: memberId,
      membership: membership._id,
      amount: price,
      status: 'pending',
    });

    await membership.populate('collectedBy', 'name role');
    res.status(201).json(membership);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMemberHistory = async (req, res) => {
  try {
    const memberships = await Membership.find({ member: req.params.memberId })
      .populate('collectedBy', 'name role')
      .sort({ startDate: -1 });
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
