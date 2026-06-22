import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other'],
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  notes: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

const Member = mongoose.model('Member', memberSchema);
export default Member;
