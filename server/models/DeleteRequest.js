import mongoose from 'mongoose';

const deleteRequestSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  gymOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['delete', 'inactive'],
    default: 'delete',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedAt: {
    type: Date,
  },
}, { timestamps: true });

const DeleteRequest = mongoose.model('DeleteRequest', deleteRequestSchema);
export default DeleteRequest;
