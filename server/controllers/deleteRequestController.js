import DeleteRequest from '../models/DeleteRequest.js';
import Member from '../models/Member.js';

// POST /api/delete-requests — Staff raises a delete request
export const createDeleteRequest = async (req, res) => {
  const { memberId, reason } = req.body;

  if (!memberId) {
    return res.status(400).json({ message: 'Member ID is required' });
  }

  try {
    // Make sure the member belongs to this gym
    const member = await Member.findOne({ _id: memberId, createdBy: req.gymOwnerId });
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Check if a pending request for this member already exists
    const existing = await DeleteRequest.findOne({ member: memberId, status: 'pending' });
    if (existing) {
      return res.status(400).json({ message: 'A pending delete request for this member already exists' });
    }

    const request = await DeleteRequest.create({
      member: memberId,
      requestedBy: req.user._id,
      gymOwnerId: req.gymOwnerId,
      reason: reason || '',
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

// PUT /api/delete-requests/:id/approve — Owner approves: actually deletes the member
export const approveDeleteRequest = async (req, res) => {
  try {
    const request = await DeleteRequest.findOne({ _id: req.params.id, gymOwnerId: req.user._id, status: 'pending' });
    if (!request) {
      return res.status(404).json({ message: 'Delete request not found or already resolved' });
    }

    // Soft-delete the member (mark inactive) or hard delete
    await Member.findByIdAndUpdate(request.member, { isActive: false });

    request.status = 'approved';
    request.resolvedBy = req.user._id;
    request.resolvedAt = new Date();
    await request.save();

    res.json({ message: 'Delete request approved. Member deactivated.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/delete-requests/:id/reject — Owner rejects the request
export const rejectDeleteRequest = async (req, res) => {
  try {
    const request = await DeleteRequest.findOne({ _id: req.params.id, gymOwnerId: req.user._id, status: 'pending' });
    if (!request) {
      return res.status(404).json({ message: 'Delete request not found or already resolved' });
    }

    request.status = 'rejected';
    request.resolvedBy = req.user._id;
    request.resolvedAt = new Date();
    await request.save();

    res.json({ message: 'Delete request rejected.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
