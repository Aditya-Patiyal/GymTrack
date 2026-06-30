import express from 'express';
import { getPendingPayments, getPaymentHistory, markAsPaid, getPaymentsByMember } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/pending', protect, getPendingPayments);
router.get('/history', protect, getPaymentHistory);
router.get('/member/:memberId', protect, getPaymentsByMember);
router.put('/:id/mark-paid', protect, markAsPaid);

export default router;
