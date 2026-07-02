import Member from '../models/Member.js';
import Membership from '../models/Membership.js';
import Payment from '../models/Payment.js';
import DeleteRequest from '../models/DeleteRequest.js';

export const getDashboardStats = async (req, res) => {
  try {
    const gymOwnerId = req.gymOwnerId;
    const today = new Date();

    // Fetch all non-deleted members (isActive:true = both 'active' and 'inactive'/on-hold)
    const members = await Member.find({ createdBy: gymOwnerId, isActive: true });
    const totalMembers = members.length;

    let activeCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;
    const reminders = [];

    for (let member of members) {
      // Skip on-hold members from plan-status counting — their membership is paused
      if (member.memberStatus === 'inactive') continue;

      const latestMembership = await Membership.findOne({ member: member._id }).sort({ endDate: -1 });

      if (latestMembership) {
        const endDate = new Date(latestMembership.endDate);
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        let statusObj = null;
        if (daysLeft < 0) {
          expiredCount++;
          statusObj = { level: 'danger', days: Math.abs(daysLeft), text: 'Expired' };
        } else if (daysLeft <= 7) {
          expiringCount++;
          activeCount++;
          statusObj = { level: daysLeft <= 3 ? 'warning-urgent' : 'warning', days: daysLeft, text: `Expiring in ${daysLeft} days` };
        } else {
          activeCount++;
        }

        if (statusObj) {
          reminders.push({
            member: { _id: member._id, name: member.name, phone: member.phone },
            plan: latestMembership.planLabel,
            endDate: latestMembership.endDate,
            status: statusObj,
          });
        }
      }
    }

    // 2. Revenue This Month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const memberIds = members.map(m => m._id);

    const payments = await Payment.find({
      member: { $in: memberIds },
      status: 'paid',
      paidAt: { $gte: startOfMonth, $lte: endOfMonth },
    });
    const revenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

    // 3. Pending Payment Reminders (only for active/non-hold members)
    const pendingPayments = await Payment.find({
      member: { $in: memberIds },
      status: 'pending',
    }).populate('membership', 'planLabel startDate');

    for (let payment of pendingPayments) {
      const memberDetails = members.find(m => m._id.toString() === payment.member.toString());
      if (memberDetails && memberDetails.isActive && memberDetails.memberStatus !== 'inactive') {
        const startedText = payment.membership && payment.membership.startDate
          ? `(Started: ${new Date(payment.membership.startDate).toLocaleDateString()})`
          : '';

        reminders.push({
          member: { _id: memberDetails._id, name: memberDetails.name, phone: memberDetails.phone },
          plan: payment.membership ? `${payment.membership.planLabel} ${startedText}` : 'Unknown Plan',
          endDate: new Date(0),
          status: { level: 'danger', text: `Payment Due: ₹${payment.amount}` },
          paymentId: payment._id,
        });
      }
    }

    reminders.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

    // 4. Pending staff requests count (delete + inactive)
    const pendingDeleteRequests = await DeleteRequest.countDocuments({
      gymOwnerId,
      status: 'pending',
    });

    // 5. Members ON HOLD for more than 30 days — warn owner to review
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const longInactiveMembers = await Member.find({
      createdBy: gymOwnerId,
      isActive: true,                              // NOT deleted
      memberStatus: 'inactive',                    // ON HOLD
      inactiveSince: { $lte: thirtyDaysAgo },
    }).select('name phone inactiveSince');

    const inactiveWarnings = longInactiveMembers.map(m => {
      const daysInactive = Math.floor((today - new Date(m.inactiveSince)) / (1000 * 60 * 60 * 24));
      return {
        member: { _id: m._id, name: m.name, phone: m.phone },
        daysInactive,
        status: { level: 'inactive-30', text: `On hold for ${daysInactive} days — review needed` },
        isInactiveWarning: true,
      };
    });

    res.json({
      stats: {
        totalMembers,
        activeMembers: activeCount,
        expiringSoon: expiringCount,
        expired: expiredCount,
        revenue,
        pendingDeleteRequests,
      },
      reminders,
      inactiveWarnings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
