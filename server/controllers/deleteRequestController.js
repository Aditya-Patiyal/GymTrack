import DeleteRequest from '../models/DeleteRequest.js';
import Member from '../models/Member.js';

// POST /api/delete-requests — Staff raises a delete OR inactive request
export const createDeleteRequest = async (req, res) => {
  const { memberId, reason, type = 'delete' } = req.body;

  if (!memberId) {
    return res.status(400).json({ message: 'Member ID is required' });
  }

  if (!['delete', 'inactive'].includes(type)) {
    return res.status(400).json({ message: 'Invalid request type' });
  }

  try {
    const member = await Member.findOne({ _id: memberId, createdBy: req.gymOwnerId });
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Check if a pending request of the same type already exists
    const existing = await DeleteRequest.findOne({ member: memberId, type, status: 'pending' });
    if (existing) {
      return res.status(400).json({ message: `A pending ${type} request for this member already exists` });
    }

    const request = await DeleteRequest.create({
      member: memberId,
      requestedBy: req.user._id,
      gymOwnerId: req.gymOwnerId,
      reason: reason || '',
      type,
    });

    await request.populate([
      { path: 'member', select: 'name phone' },
      { path: 'requestedBy', select: 'name role' },
    ]);

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/delete-requests — Owner views all requests for their gym
export const getDeleteRequests = async (req, res) => {
  try {
    const requests = await DeleteRequest.find({ gymOwnerId: req.gymOwnerId })
      .populate('member', 'name phone')
      .populate('requestedBy', 'name role')
      .populate('resolvedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/delete-requests/pending-count — For badge notification
export const getPendingDeleteCount = async (req, res) => {
  try {
    const count = await DeleteRequest.countDocuments({ gymOwnerId: req.gymOwnerId, status: 'pending' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/delete-requests/:id/approve — Owner approves
export const approveDeleteRequest = async (req, res) => {
  try {
    const request = await DeleteRequest.findOne({ _id: req.params.id, gymOwnerId: req.user._id, status: 'pending' });
    if (!request) {
      return res.status(404).json({ message: 'Request not found or already resolved' });
    }

    if (request.type === 'inactive') {
      // ON HOLD — member stays visible, all data intact, just paused
      await Member.findByIdAndUpdate(request.member, {
        memberStatus: 'inactive',
        inactiveSince: new Date(),
      });
    } else {
      // DELETED — member is hidden from all views
      await Member.findByIdAndUpdate(request.member, {
        isActive: false,
      });
    }

    request.status = 'approved';
    request.resolvedBy = req.user._id;
    request.resolvedAt = new Date();
    await request.save();

    const label = request.type === 'inactive' ? 'set to inactive' : 'deactivated';
    res.json({ message: `Request approved. Member ${label}.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/delete-requests/:id/reject — Owner rejects the request
export const rejectDeleteRequest = async (req, res) => {
  try {
    const request = await DeleteRequest.findOne({ _id: req.params.id, gymOwnerId: req.user._id, status: 'pending' });
    if (!request) {
      return res.status(404).json({ message: 'Request not found or already resolved' });
    }

    request.status = 'rejected';
    request.resolvedBy = req.user._id;
    request.resolvedAt = new Date();
    await request.save();

    res.json({ message: 'Request rejected.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
