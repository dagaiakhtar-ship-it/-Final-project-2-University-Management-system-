import { Router } from 'express';
import { hostelController } from '../controllers/hostel.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const hostelRouter = Router();

// Secure all hostel routes with token authentication
hostelRouter.use(authenticate);

// =========================================================================
// HOSTEL ANALYTICS
// =========================================================================
hostelRouter.get(
  '/hostels/analytics',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN', 'STUDENT']),
  hostelController.getHostelAnalytics
);

// =========================================================================
// HOSTEL BUILDINGS
// =========================================================================
hostelRouter.get(
  '/hostels',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN', 'STUDENT', 'SECURITY_STAFF']),
  hostelController.getBuildings
);

hostelRouter.get(
  '/hostels/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN', 'STUDENT']),
  hostelController.getBuildingById
);

hostelRouter.post(
  '/hostels',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN']),
  hostelController.createBuilding
);

hostelRouter.put(
  '/hostels/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN']),
  hostelController.updateBuilding
);

hostelRouter.delete(
  '/hostels/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN']),
  hostelController.deleteBuilding
);

// =========================================================================
// HOSTEL ROOMS
// =========================================================================
hostelRouter.get(
  '/rooms',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN', 'STUDENT', 'SECURITY_STAFF']),
  hostelController.getRooms
);

hostelRouter.get(
  '/rooms/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN', 'STUDENT']),
  hostelController.getRoomById
);

hostelRouter.post(
  '/rooms',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN']),
  hostelController.createRoom
);

hostelRouter.put(
  '/rooms/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN']),
  hostelController.updateRoom
);

hostelRouter.delete(
  '/rooms/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN']),
  hostelController.deleteRoom
);

// =========================================================================
// HOSTEL ALLOCATIONS
// =========================================================================
hostelRouter.get(
  '/hostel-allocations',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN', 'STUDENT']),
  hostelController.getAllocations
);

hostelRouter.post(
  '/hostel-allocations',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN']),
  hostelController.createAllocation
);

hostelRouter.patch(
  '/hostel-allocations/:id/transfer',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN', 'STUDENT']),
  hostelController.transferAllocation
);

hostelRouter.post(
  '/hostel-allocations/:id/checkout',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN']),
  hostelController.checkoutAllocation
);

// =========================================================================
// VISITOR LOGGING
// =========================================================================
hostelRouter.get(
  '/visitors',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN', 'SECURITY_STAFF', 'STUDENT']),
  hostelController.getVisitorLogs
);

hostelRouter.post(
  '/visitors',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN', 'SECURITY_STAFF']),
  hostelController.logVisitor
);

hostelRouter.post(
  '/visitors/:id/checkout',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN', 'SECURITY_STAFF']),
  hostelController.checkoutVisitor
);

// =========================================================================
// COMPLAINT MANAGEMENT
// =========================================================================
hostelRouter.get(
  '/complaints',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN', 'STUDENT']),
  hostelController.getComplaints
);

hostelRouter.post(
  '/complaints',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']),
  hostelController.createComplaint
);

hostelRouter.put(
  '/complaints/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN']),
  hostelController.updateComplaint
);

// =========================================================================
// MAINTENANCE REQUESTS
// =========================================================================
hostelRouter.get(
  '/maintenance',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN', 'STUDENT']),
  hostelController.getMaintenances
);

hostelRouter.post(
  '/maintenance',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN']),
  hostelController.createMaintenance
);

hostelRouter.put(
  '/maintenance/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'HOSTEL_WARDEN']),
  hostelController.updateMaintenance
);

export default hostelRouter;
