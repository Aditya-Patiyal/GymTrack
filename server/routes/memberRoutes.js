import express from 'express';
import { getMembers, getMemberById, createMember, updateMember } from '../controllers/memberController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getMembers)
  .post(protect, createMember);

router.route('/:id')
  .get(protect, getMemberById)
  .put(protect, updateMember);

export default router;
