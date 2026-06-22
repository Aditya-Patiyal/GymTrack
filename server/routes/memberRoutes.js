import express from 'express';
import { getMembers, getMemberById, createMember, updateMember, deactivateMember } from '../controllers/memberController.js';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getMembers)
  .post(protect, createMember);

router.route('/:id')
  .get(protect, getMemberById)
  .put(protect, updateMember)
  .delete(protect, ownerOnly, deactivateMember);

export default router;
