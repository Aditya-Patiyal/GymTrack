import express from 'express';
import { getMembers, getMemberById, createMember, updateMember, deactivateMember, setInactive, reactivateMember } from '../controllers/memberController.js';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getMembers)
  .post(protect, createMember);

router.route('/:id')
  .get(protect, getMemberById)
  .put(protect, updateMember)
  .delete(protect, ownerOnly, deactivateMember);

// Owner-only status actions
router.put('/:id/set-inactive', protect, ownerOnly, setInactive);
router.put('/:id/reactivate', protect, ownerOnly, reactivateMember);

export default router;
