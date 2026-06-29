import express from 'express';
import {
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  getOwners,
  suspendOwner,
  reactivateOwner,
  getAdminStats,
  bulkApprove,
  bulkReject,
  bulkSuspend,
  bulkReactivate,
  bulkDelete,
} from '../controllers/superAdminController.js';
import { protect, superAdminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, superAdminOnly);

// Stats
router.get('/stats', getAdminStats);

// Registrations
router.get('/registrations', getPendingRegistrations);
router.put('/registrations/:id/approve', approveRegistration);
router.put('/registrations/:id/reject', rejectRegistration);

// Owners
router.get('/owners', getOwners);
router.put('/owners/:id/suspend', suspendOwner);
router.put('/owners/:id/reactivate', reactivateOwner);

// Bulk actions
router.put('/bulk/approve', bulkApprove);
router.put('/bulk/reject', bulkReject);
router.put('/bulk/suspend', bulkSuspend);
router.put('/bulk/reactivate', bulkReactivate);
router.delete('/bulk/delete', bulkDelete);

export default router;
