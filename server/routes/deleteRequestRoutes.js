import express from 'express';
import {
  createDeleteRequest,
  getDeleteRequests,
  getPendingDeleteCount,
  approveDeleteRequest,
  rejectDeleteRequest,
} from '../controllers/deleteRequestController.js';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Staff: raise a request | Owner: view all requests
router.route('/')
  .post(protect, createDeleteRequest)
  .get(protect, ownerOnly, getDeleteRequests);

// Badge count — owner only
router.get('/pending-count', protect, ownerOnly, getPendingDeleteCount);

// Owner actions on individual requests
router.put('/:id/approve', protect, ownerOnly, approveDeleteRequest);
router.put('/:id/reject', protect, ownerOnly, rejectDeleteRequest);

export default router;
