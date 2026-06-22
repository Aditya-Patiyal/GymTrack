import Payment from '../models/Payment.js';
import Member from '../models/Member.js';

export const getPendingPayments = async (req, res) => {
  try {
    const members = await Member.find({ createdBy: req.gymOwnerId }).select('_id');
    const memberIds = members.map(m => m._id);

    const payments = await Payment.find({ member: { $in: memberIds }, status: 'pending' })
      .populate('member', 'name phone')
      .populate('membership', 'planLabel')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const members = await Member.find({ createdBy: req.gymOwnerId }).select('_id');
    const memberIds = members.map(m => m._id);

    const payments = await Payment.find({ member: { $in: memberIds }, status: 'paid' })
      .populate('member', 'name phone')
      .populate('membership', 'planLabel')
      .populate('markedPaidBy', 'name role')
      .sort({ paidAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsPaid = async (req, res) => {
  try {
    const { method, paidAt } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = 'paid';
    payment.method = method;
    payment.paidAt = paidAt ? new Date(paidAt) : new Date();
    payment.markedPaidBy = req.user._id;

    await payment.save();
    await payment.populate('markedPaidBy', 'name role');
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
