import { Router } from 'express';
import { transportController } from '../controllers/transport.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const transportRouter = Router();

// Secure all transport routes with token authentication
transportRouter.use(authenticate);

// =========================================================================
// ANALYTICS & MONITORING
// =========================================================================
transportRouter.get(
  '/transport/analytics',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'SECURITY_STAFF']),
  transportController.getTransportAnalytics
);

// =========================================================================
// VEHICLES
// =========================================================================
transportRouter.get(
  '/vehicles',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'SECURITY_STAFF']),
  transportController.getVehicles
);

transportRouter.get(
  '/vehicles/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  transportController.getVehicleById
);

transportRouter.post(
  '/vehicles',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.createVehicle
);

transportRouter.put(
  '/vehicles/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.updateVehicle
);

transportRouter.delete(
  '/vehicles/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.deleteVehicle
);

// =========================================================================
// DRIVERS
// =========================================================================
transportRouter.get(
  '/drivers',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'SECURITY_STAFF']),
  transportController.getDrivers
);

transportRouter.get(
  '/drivers/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  transportController.getDriverById
);

transportRouter.post(
  '/drivers',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.createDriver
);

transportRouter.put(
  '/drivers/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.updateDriver
);

transportRouter.delete(
  '/drivers/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.deleteDriver
);

// =========================================================================
// ROUTES & STOPS
// =========================================================================
transportRouter.get(
  '/routes',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'SECURITY_STAFF']),
  transportController.getRoutes
);

transportRouter.get(
  '/routes/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  transportController.getRouteById
);

transportRouter.post(
  '/routes',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.createRoute
);

transportRouter.put(
  '/routes/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.updateRoute
);

transportRouter.delete(
  '/routes/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.deleteRoute
);

// =========================================================================
// PASS REGISTRATION (STUDENT & STAFF TRANSPORT REGISTRATION)
// =========================================================================
transportRouter.post(
  '/transport/register',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  transportController.registerTransport
);

transportRouter.get(
  '/transport/passes',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  transportController.getPasses
);

transportRouter.get(
  '/transport/passes/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  transportController.getPassById
);

transportRouter.patch(
  '/transport/passes/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.updatePassStatus
);

// =========================================================================
// ATTENDANCE (DAILY SMART ATTENDANCE)
// =========================================================================
transportRouter.post(
  '/transport/attendance',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'SECURITY_STAFF']),
  transportController.markAttendance
);

transportRouter.get(
  '/transport/attendance',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'SECURITY_STAFF', 'TEACHER', 'STUDENT']),
  transportController.getAttendanceHistory
);

// =========================================================================
// MAINTENANCE, FUEL, & TRIPS
// =========================================================================
transportRouter.get(
  '/vehicles/maintenances',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.getMaintenanceHistory
);

transportRouter.post(
  '/vehicles/maintenances',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.createMaintenance
);

transportRouter.put(
  '/vehicles/maintenances/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.updateMaintenance
);

transportRouter.get(
  '/vehicles/fuel',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.getFuelLogs
);

transportRouter.post(
  '/vehicles/fuel',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.createFuelLog
);

transportRouter.get(
  '/vehicles/trips',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.getTrips
);

transportRouter.post(
  '/vehicles/trips',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transportController.createTrip
);

export default transportRouter;
