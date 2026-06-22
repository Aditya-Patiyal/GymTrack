import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  plan: {
    type: String,
    required: true,
    enum: ['1_month', '2_month', '4_month', 'yearly'],
  },
  planLabel: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

const Membership = mongoose.model('Membership', membershipSchema);
export default Membership;
