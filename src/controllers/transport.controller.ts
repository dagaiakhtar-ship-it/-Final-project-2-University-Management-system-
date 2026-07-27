import { Request, Response, NextFunction } from 'express';
import { transportService } from '../services/transport.service';
import { prisma } from '../services/db.service';
import {
  createVehicleSchema,
  updateVehicleSchema,
  createDriverSchema,
  updateDriverSchema,
  createRouteSchema,
  updateRouteSchema,
  registerTransportSchema,
  createMaintenanceSchema,
  updateMaintenanceSchema,
  createFuelLogSchema,
  createTripLogSchema,
  markAttendanceSchema,
} from '../validators/transport.validators';

export class TransportController {
  // =========================================================================
  // VEHICLES
  // =========================================================================
  async getVehicles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicles = await transportService.getVehicles();
      res.status(200).json({ status: 'success', data: vehicles });
    } catch (error) {
      next(error);
    }
  }

  async getVehicleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid vehicle ID' });
        return;
      }
      const vehicle = await transportService.getVehicleById(id);
      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: vehicle });
    } catch (error) {
      next(error);
    }
  }

  async createVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createVehicleSchema.parse(req.body);
      const vehicle = await transportService.createVehicle(validated, req.user?.userId);
      res.status(201).json({ status: 'success', data: vehicle });
    } catch (error) {
      next(error);
    }
  }

  async updateVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid vehicle ID' });
        return;
      }
      const validated = updateVehicleSchema.parse(req.body);
      const vehicle = await transportService.updateVehicle(id, validated, req.user?.userId);
      res.status(200).json({ status: 'success', data: vehicle });
    } catch (error) {
      next(error);
    }
  }

  async deleteVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid vehicle ID' });
        return;
      }
      await transportService.deleteVehicle(id, req.user?.userId);
      res.status(200).json({ status: 'success', data: { message: 'Vehicle deleted successfully' } });
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // DRIVERS
  // =========================================================================
  async getDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const drivers = await transportService.getDrivers();
      res.status(200).json({ status: 'success', data: drivers });
    } catch (error) {
      next(error);
    }
  }

  async getDriverById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid driver ID' });
        return;
      }
      const driver = await transportService.getDriverById(id);
      if (!driver) {
        res.status(404).json({ error: 'Driver not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: driver });
    } catch (error) {
      next(error);
    }
  }

  async createDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createDriverSchema.parse(req.body);
      const driver = await transportService.createDriver(validated, req.user?.userId);
      res.status(201).json({ status: 'success', data: driver });
    } catch (error) {
      next(error);
    }
  }

  async updateDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid driver ID' });
        return;
      }
      const validated = updateDriverSchema.parse(req.body);
      const driver = await transportService.updateDriver(id, validated, req.user?.userId);
      res.status(200).json({ status: 'success', data: driver });
    } catch (error) {
      next(error);
    }
  }

  async deleteDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid driver ID' });
        return;
      }
      await transportService.deleteDriver(id, req.user?.userId);
      res.status(200).json({ status: 'success', data: { message: 'Driver deleted successfully' } });
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // ROUTES & STOPS
  // =========================================================================
  async getRoutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const routes = await transportService.getRoutes();
      res.status(200).json({ status: 'success', data: routes });
    } catch (error) {
      next(error);
    }
  }

  async getRouteById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid route ID' });
        return;
      }
      const route = await transportService.getRouteById(id);
      if (!route) {
        res.status(404).json({ error: 'Route not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: route });
    } catch (error) {
      next(error);
    }
  }

  async createRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createRouteSchema.parse(req.body);
      const route = await transportService.createRoute(validated, req.user?.userId);
      res.status(201).json({ status: 'success', data: route });
    } catch (error) {
      next(error);
    }
  }

  async updateRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid route ID' });
        return;
      }
      const validated = updateRouteSchema.parse(req.body);
      const route = await transportService.updateRoute(id, validated, req.user?.userId);
      res.status(200).json({ status: 'success', data: route });
    } catch (error) {
      next(error);
    }
  }

  async deleteRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid route ID' });
        return;
      }
      await transportService.deleteRoute(id, req.user?.userId);
      res.status(200).json({ status: 'success', data: { message: 'Route deleted successfully' } });
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // PASS REGISTRATION
  // =========================================================================
  async registerTransport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = registerTransportSchema.parse(req.body);
      const finalData = { ...validated };

      // Role-Based Enforcements for registration
      if (req.user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({ where: { userId: req.user.userId } });
        if (!student) {
          res.status(403).json({ error: 'Student profile not found.' });
          return;
        }
        finalData.studentId = student.id;
        finalData.employeeId = null;
      } else if (req.user?.role === 'TEACHER') {
        const teacher = await prisma.teacher.findFirst({ where: { userId: req.user.userId } });
        if (!teacher) {
          res.status(403).json({ error: 'Teacher profile not found.' });
          return;
        }
        finalData.employeeId = teacher.id;
        finalData.studentId = null;
      }

      const registration = await transportService.registerTransport(finalData, req.user?.userId);
      res.status(201).json({
        status: 'success',
        data: {
          ...registration,
          status: registration.transportStatus
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getPasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string;
      const filters: any = {};
      if (status) {
        filters.status = status;
      }

      // Role-Based Filtering
      if (req.user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({ where: { userId: req.user.userId } });
        if (student) {
          filters.studentId = student.id;
        } else {
          res.status(403).json({ error: 'Student profile not found.' });
          return;
        }
      } else if (req.user?.role === 'TEACHER') {
        const teacher = await prisma.teacher.findFirst({ where: { userId: req.user.userId } });
        if (teacher) {
          filters.employeeId = teacher.id;
        } else {
          res.status(403).json({ error: 'Teacher profile not found.' });
          return;
        }
      }

      const passes = await transportService.getPasses(filters);
      const mappedPasses = passes.map(p => ({
        ...p,
        status: p.transportStatus
      }));
      res.status(200).json({ status: 'success', data: mappedPasses });
    } catch (error) {
      next(error);
    }
  }

  async getPassById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid registration ID' });
        return;
      }
      const pass = await transportService.getPassById(id);
      if (!pass) {
        res.status(404).json({ error: 'Registration record not found' });
        return;
      }

      // Enforce data privacy for students/employees
      if (req.user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({ where: { userId: req.user.userId } });
        if (!student || pass.studentId !== student.id) {
          res.status(403).json({ error: 'Access Denied: You cannot view another passenger\'s pass details.' });
          return;
        }
      } else if (req.user?.role === 'TEACHER') {
        const teacher = await prisma.teacher.findFirst({ where: { userId: req.user.userId } });
        if (!teacher || pass.employeeId !== teacher.id) {
          res.status(403).json({ error: 'Access Denied: You cannot view another passenger\'s pass details.' });
          return;
        }
      }

      res.status(200).json({
        status: 'success',
        data: {
          ...pass,
          status: pass.transportStatus
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePassStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid registration ID' });
        return;
      }
      const { status } = req.body;
      if (!status || !['Active', 'Pending', 'Suspended', 'Expired', 'Rejected'].includes(status)) {
        res.status(400).json({ error: 'Invalid or missing transport status.' });
        return;
      }
      const pass = await transportService.updatePassStatus(id, status, req.user?.userId);
      res.status(200).json({
        status: 'success',
        data: {
          ...pass,
          status: pass.transportStatus
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // ATTENDANCE
  // =========================================================================
  async markAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = markAttendanceSchema.parse(req.body);
      const attendance = await transportService.markAttendance(validated, req.user?.userId);
      res.status(201).json({ status: 'success', data: attendance });
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const registrationId = req.query.registrationId ? Number(req.query.registrationId) : undefined;
      const routeId = req.query.routeId ? Number(req.query.routeId) : undefined;
      const date = req.query.date as string;

      const filters: any = { registrationId, routeId, date };

      // Role-Based Filtering
      if (req.user?.role === 'STUDENT') {
        const student = await prisma.student.findFirst({ where: { userId: req.user.userId } });
        if (student) {
          filters.studentId = student.id;
        } else {
          res.status(403).json({ error: 'Student profile not found.' });
          return;
        }
      } else if (req.user?.role === 'TEACHER') {
        const teacher = await prisma.teacher.findFirst({ where: { userId: req.user.userId } });
        if (teacher) {
          filters.employeeId = teacher.id;
        } else {
          res.status(403).json({ error: 'Teacher profile not found.' });
          return;
        }
      }

      const history = await transportService.getAttendanceHistory(filters);
      res.status(200).json({ status: 'success', data: history });
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // VEHICLE MAINTENANCE & FUEL LOGS & TRIPS
  // =========================================================================
  async getMaintenanceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : undefined;
      const history = await transportService.getMaintenanceHistory(vehicleId);
      res.status(200).json({ status: 'success', data: history });
    } catch (error) {
      next(error);
    }
  }

  async createMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createMaintenanceSchema.parse(req.body);
      const record = await transportService.createMaintenance(validated, req.user?.userId);
      res.status(201).json({ status: 'success', data: record });
    } catch (error) {
      next(error);
    }
  }

  async updateMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid maintenance record ID' });
        return;
      }
      const validated = updateMaintenanceSchema.parse(req.body);
      const record = await transportService.updateMaintenance(id, validated, req.user?.userId);
      res.status(200).json({ status: 'success', data: record });
    } catch (error) {
      next(error);
    }
  }

  async getFuelLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : undefined;
      const logs = await transportService.getFuelLogs(vehicleId);
      res.status(200).json({ status: 'success', data: logs });
    } catch (error) {
      next(error);
    }
  }

  async createFuelLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createFuelLogSchema.parse(req.body);
      const log = await transportService.createFuelLog(validated);
      res.status(201).json({ status: 'success', data: log });
    } catch (error) {
      next(error);
    }
  }

  async getTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trips = await transportService.getTrips();
      res.status(200).json({ status: 'success', data: trips });
    } catch (error) {
      next(error);
    }
  }

  async createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createTripLogSchema.parse(req.body);
      const trip = await transportService.createTrip(validated);
      res.status(201).json({ status: 'success', data: trip });
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // ANALYTICS & MONITORING
  // =========================================================================
  async getTransportAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await transportService.getTransportAnalytics();
      res.status(200).json({ status: 'success', data: analytics });
    } catch (error) {
      next(error);
    }
  }
}

export const transportController = new TransportController();
export default transportController;
