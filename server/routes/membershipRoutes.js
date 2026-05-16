import express from 'express';
import { createMembership, getMemberHistory } from '../controllers/membershipController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createMembership);
router.get('/member/:memberId', protect, getMemberHistory);

export default router;
