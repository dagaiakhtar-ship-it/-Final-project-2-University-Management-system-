import { Request, Response, NextFunction } from 'express';
import { hostelService } from '../services/hostel.service';
import { notifyHostelChange } from '../services/socket.service';
import {
  createBuildingSchema,
  updateBuildingSchema,
  createRoomSchema,
  updateRoomSchema,
  createAllocationSchema,
  transferAllocationSchema,
  createVisitorSchema,
  createComplaintSchema,
  updateComplaintSchema,
  createMaintenanceSchema,
  updateMaintenanceSchema,
} from '../validators/hostel.validators';

export class HostelController {
  // =========================================================================
  // HOSTEL BUILDINGS
  // =========================================================================
  async getBuildings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const gender = req.query.gender as string;
      const status = req.query.status as string;
      const buildings = await hostelService.getBuildings({ gender, status });
      res.status(200).json(buildings);
    } catch (error: any) {
      next(error);
    }
  }

  async getBuildingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid building ID.' });
        return;
      }
      const building = await hostelService.getBuildingById(id);
      if (!building) {
        res.status(404).json({ error: 'Building not found' });
        return;
      }
      res.status(200).json(building);
    } catch (error: any) {
      next(error);
    }
  }

  async createBuilding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const validatedBody = createBuildingSchema.parse(req.body);
      const building = await hostelService.createBuilding(validatedBody, userId);
      res.status(201).json(building);
    } catch (error: any) {
      next(error);
    }
  }

  async updateBuilding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid building ID.' });
        return;
      }
      const userId = (req as any).user?.userId;
      const validatedBody = updateBuildingSchema.parse(req.body);
      const building = await hostelService.updateBuilding(id, validatedBody, userId);
      res.status(200).json(building);
    } catch (error: any) {
      next(error);
    }
  }

  async deleteBuilding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid building ID.' });
        return;
      }
      const userId = (req as any).user?.userId;
      await hostelService.deleteBuilding(id, userId);
      res.status(200).json({ success: true, message: 'Building deleted successfully.' });
    } catch (error: any) {
      next(error);
    }
  }

  // =========================================================================
  // HOSTEL ROOMS
  // =========================================================================
  async getRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const buildingId = req.query.buildingId ? Number(req.query.buildingId) : undefined;
      const floorNumber = req.query.floorNumber ? Number(req.query.floorNumber) : undefined;
      const roomType = req.query.roomType as string;
      const status = req.query.status as string;

      const rooms = await hostelService.getRooms({ buildingId, floorNumber, roomType, status });
      res.status(200).json(rooms);
    } catch (error: any) {
      next(error);
    }
  }

  async getRoomById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid room ID.' });
        return;
      }
      const room = await hostelService.getRoomById(id);
      if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
      }
      res.status(200).json(room);
    } catch (error: any) {
      next(error);
    }
  }

  async createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const validatedBody = createRoomSchema.parse(req.body);
      const room = await hostelService.createRoom(validatedBody, userId);
      res.status(201).json(room);
    } catch (error: any) {
      next(error);
    }
  }

  async updateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid room ID.' });
        return;
      }
      const userId = (req as any).user?.userId;
      const validatedBody = updateRoomSchema.parse(req.body);
      const room = await hostelService.updateRoom(id, validatedBody, userId);
      res.status(200).json(room);
    } catch (error: any) {
      next(error);
    }
  }

  async deleteRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid room ID.' });
        return;
      }
      const userId = (req as any).user?.userId;
      await hostelService.deleteRoom(id, userId);
      res.status(200).json({ success: true, message: 'Room deleted successfully.' });
    } catch (error: any) {
      next(error);
    }
  }

  // =========================================================================
  // HOSTEL ALLOCATIONS
  // =========================================================================
  async getAllocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
      const buildingId = req.query.buildingId ? Number(req.query.buildingId) : undefined;
      const roomId = req.query.roomId ? Number(req.query.roomId) : undefined;
      const status = req.query.status as string;

      const allocations = await hostelService.getAllocations({ studentId, buildingId, roomId, status });
      res.status(200).json(allocations);
    } catch (error: any) {
      next(error);
    }
  }

  async createAllocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const validatedBody = createAllocationSchema.parse(req.body);
      const allocation = await hostelService.createAllocation(validatedBody, userId);

      // Trigger socket notification
      notifyHostelChange('ROOM_ALLOCATED', {
        studentId: allocation.studentId,
        allocationId: allocation.id,
        buildingId: allocation.buildingId,
        roomId: allocation.roomId,
        bedNumber: allocation.bedNumber,
      });

      res.status(201).json(allocation);
    } catch (error: any) {
      next(error);
    }
  }

  async transferAllocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid allocation ID.' });
        return;
      }
      const userId = (req as any).user?.userId;
      const validatedBody = transferAllocationSchema.parse(req.body);
      const allocation = await hostelService.transferAllocation(id, validatedBody, userId);

      // Trigger socket notification
      notifyHostelChange('ROOM_TRANSFERRED', {
        studentId: allocation.studentId,
        allocationId: allocation.id,
        buildingId: allocation.buildingId,
        roomId: allocation.roomId,
        bedNumber: allocation.bedNumber,
      });

      res.status(200).json(allocation);
    } catch (error: any) {
      next(error);
    }
  }

  async checkoutAllocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid allocation ID.' });
        return;
      }
      const userId = (req as any).user?.userId;
      const allocation = await hostelService.checkoutAllocation(id, userId);

      notifyHostelChange('ROOM_TRANSFERRED', {
        studentId: allocation.studentId,
        allocationId: allocation.id,
        status: 'Completed',
      });

      res.status(200).json(allocation);
    } catch (error: any) {
      next(error);
    }
  }

  // =========================================================================
  // VISITORS
  // =========================================================================
  async getVisitorLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
      const logs = await hostelService.getVisitorLogs({ studentId });
      res.status(200).json(logs);
    } catch (error: any) {
      next(error);
    }
  }

  async logVisitor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const validatedBody = createVisitorSchema.parse(req.body);
      const log = await hostelService.logVisitor(validatedBody, userId);

      // Trigger socket notification
      notifyHostelChange('VISITOR_APPROVED', {
        studentId: log.studentId,
        visitorId: log.id,
        visitorName: log.visitorName,
        checkIn: log.checkIn,
      });

      res.status(201).json(log);
    } catch (error: any) {
      next(error);
    }
  }

  async checkoutVisitor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid visitor log ID.' });
        return;
      }
      const userId = (req as any).user?.userId;
      const log = await hostelService.checkoutVisitor(id, userId);
      res.status(200).json(log);
    } catch (error: any) {
      next(error);
    }
  }

  // =========================================================================
  // COMPLAINTS
  // =========================================================================
  async getComplaints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
      const status = req.query.status as string;
      const complaints = await hostelService.getComplaints({ studentId, status });
      res.status(200).json(complaints);
    } catch (error: any) {
      next(error);
    }
  }

  async createComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const validatedBody = createComplaintSchema.parse(req.body);
      const complaint = await hostelService.createComplaint(validatedBody, userId);

      // Trigger socket notification
      notifyHostelChange('COMPLAINT_SUBMITTED', {
        studentId: complaint.studentId,
        complaintId: complaint.id,
        title: complaint.title,
      });

      res.status(201).json(complaint);
    } catch (error: any) {
      next(error);
    }
  }

  async updateComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid complaint ID.' });
        return;
      }
      const userId = (req as any).user?.userId;
      const validatedBody = updateComplaintSchema.parse(req.body);
      const complaint = await hostelService.updateComplaint(id, validatedBody, userId);

      // Trigger socket notification
      notifyHostelChange('COMPLAINT_UPDATED', {
        studentId: complaint.studentId,
        complaintId: complaint.id,
        status: complaint.status,
      });

      res.status(200).json(complaint);
    } catch (error: any) {
      next(error);
    }
  }

  // =========================================================================
  // MAINTENANCE
  // =========================================================================
  async getMaintenances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roomId = req.query.roomId ? Number(req.query.roomId) : undefined;
      const status = req.query.status as string;
      const records = await hostelService.getMaintenances({ roomId, status });
      res.status(200).json(records);
    } catch (error: any) {
      next(error);
    }
  }

  async createMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const validatedBody = createMaintenanceSchema.parse(req.body);
      const record = await hostelService.createMaintenance(validatedBody, userId);

      notifyHostelChange('MAINTENANCE_SUBMITTED' as any, {
        roomId: record.roomId,
        maintenanceId: record.id,
        title: record.title,
      });

      res.status(201).json(record);
    } catch (error: any) {
      next(error);
    }
  }

  async updateMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid maintenance record ID.' });
        return;
      }
      const userId = (req as any).user?.userId;
      const validatedBody = updateMaintenanceSchema.parse(req.body);
      const record = await hostelService.updateMaintenance(id, validatedBody, userId);

      // Trigger socket notification
      notifyHostelChange('MAINTENANCE_STATUS_CHANGED', {
        roomId: record.roomId,
        maintenanceId: record.id,
        status: record.status,
      });

      res.status(200).json(record);
    } catch (error: any) {
      next(error);
    }
  }

  // =========================================================================
  // ANALYTICS
  // =========================================================================
  async getHostelAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await hostelService.getHostelAnalytics();
      res.status(200).json(analytics);
    } catch (error: any) {
      next(error);
    }
  }
}

export const hostelController = new HostelController();
export default hostelController;
