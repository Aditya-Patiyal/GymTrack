import express from 'express';
import { getStaff, createStaff, deleteStaff } from '../controllers/staffController.js';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, ownerOnly, getStaff)
  .post(protect, ownerOnly, createStaff);

router.route('/:id')
  .delete(protect, ownerOnly, deleteStaff);

export default router;
