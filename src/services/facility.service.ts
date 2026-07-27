import { facilityBookingRepository, maintenanceRequestRepository } from '../repositories/facility.repository';
import { roomRepository } from '../repositories/room.repository';
import { buildingRepository } from '../repositories/building.repository';
import { prisma } from './db.service';
import QRCode from 'qrcode';
import { auditService } from './audit.service';
import { notifyFacilityChange } from './socket.service';

export class FacilityBookingService {
  async getBookings(params: {
    search?: string;
    approvalStatus?: string;
    roomId?: number;
    bookedBy?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      facilityBookingRepository.findAll({
        search: params.search,
        approvalStatus: params.approvalStatus,
        roomId: params.roomId,
        bookedBy: params.bookedBy,
        skip,
        take: limit,
      }),
      facilityBookingRepository.count({
        search: params.search,
        approvalStatus: params.approvalStatus,
        roomId: params.roomId,
        bookedBy: params.bookedBy,
      }),
    ]);

    return {
      bookings,
      total,
      page,
      limit,
    };
  }

  async getBookingById(id: number) {
    const booking = await facilityBookingRepository.findById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }
    return booking;
  }

  async createBooking(
    data: {
      roomId: number;
      bookedBy: string;
      bookingPurpose: string;
      bookingDate: string;
      startTime: string;
      endTime: string;
      attendees?: number;
    },
    userId: number,
    userEmail: string
  ) {
    const room = await roomRepository.findById(data.roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Validate capacity
    const attendees = data.attendees || 0;
    if (attendees > room.capacity) {
      throw new Error(`Room capacity exceeded. Room maximum capacity is ${room.capacity}, but you requested ${attendees} attendees.`);
    }

    // Check if room is available / not under maintenance
    if (room.status === 'Maintenance') {
      throw new Error(`This room is currently under maintenance and cannot be booked.`);
    }

    // Parse booking date
    const parsedBookingDate = new Date(data.bookingDate);

    // Prevent double booking!
    // Query active bookings for the same room on the same day
    const existingBookings = await prisma.facilityBooking.findMany({
      where: {
        roomId: data.roomId,
        bookingDate: parsedBookingDate,
        approvalStatus: { in: ['Pending', 'Approved'] },
      },
    });

    const normalizeTime = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = normalizeTime(data.startTime);
    const newEnd = normalizeTime(data.endTime);

    if (newStart >= newEnd) {
      throw new Error('End time must be after start time.');
    }

    for (const eb of existingBookings) {
      const ebStart = normalizeTime(eb.startTime);
      const ebEnd = normalizeTime(eb.endTime);

      // Overlap condition: start of one is before end of other
      if (newStart < ebEnd && newEnd > ebStart) {
        throw new Error(`Double booking conflict. The room is already booked from ${eb.startTime} to ${eb.endTime} for "${eb.bookingPurpose}".`);
      }
    }

    // Also check if there is an active maintenance conflict
    const activeMaintenance = await prisma.maintenanceRequest.findFirst({
      where: {
        roomId: data.roomId,
        status: { in: ['Open', 'Assigned', 'In Progress'] },
      },
    });

    if (activeMaintenance) {
      throw new Error(`This room has an active maintenance request ("${activeMaintenance.issueDescription}") and cannot be booked.`);
    }

    const booking = await facilityBookingRepository.create({
      roomId: data.roomId,
      bookedBy: data.bookedBy,
      bookingPurpose: data.bookingPurpose,
      bookingDate: parsedBookingDate,
      startTime: data.startTime,
      endTime: data.endTime,
      attendees,
      approvalStatus: 'Pending',
    });

    // Track audit logs
    await auditService.log({
      action: 'BOOKING_CREATED',
      tableName: 'FacilityBooking',
      recordId: booking.id.toString(),
      newValue: booking,
      userId,
    });

    // Notify real-time
    notifyFacilityChange('New Booking', booking);

    return booking;
  }

  async updateBooking(
    id: number,
    data: {
      bookingPurpose?: string;
      bookingDate?: string;
      startTime?: string;
      endTime?: string;
      attendees?: number;
      approvalStatus?: string;
    },
    userId: number,
    userEmail: string
  ) {
    const existing = await facilityBookingRepository.findById(id);
    if (!existing) {
      throw new Error('Booking not found');
    }

    const updateData: any = { ...data };
    if (data.bookingDate) {
      updateData.bookingDate = new Date(data.bookingDate);
    }

    const updated = await facilityBookingRepository.update(id, updateData);

    // Track audit logs for approvals/cancellations
    let action = 'BOOKING_UPDATED';
    if (data.approvalStatus === 'Approved') {
      action = 'BOOKING_APPROVED';
      // Temporarily mark room as reserved during approval time, or let status update
      await prisma.room.update({
        where: { id: existing.roomId },
        data: { status: 'Reserved' },
      });
    } else if (data.approvalStatus === 'Cancelled' || data.approvalStatus === 'Rejected') {
      action = 'BOOKING_CANCELLED';
      // Reset room status to Available if it was Reserved/Occupied
      await prisma.room.update({
        where: { id: existing.roomId },
        data: { status: 'Available' },
      });
    }

    await auditService.log({
      action,
      tableName: 'FacilityBooking',
      recordId: updated.id.toString(),
      oldValue: existing,
      newValue: updated,
      userId,
    });

    // Notify real-time
    notifyFacilityChange(data.approvalStatus === 'Approved' ? 'Booking Approved' : 'Booking Cancelled', updated);

    return updated;
  }

  async deleteBooking(id: number, userId: number, userEmail: string) {
    const existing = await facilityBookingRepository.findById(id);
    if (!existing) {
      throw new Error('Booking not found');
    }

    await facilityBookingRepository.delete(id);

    // Restore room status
    await prisma.room.update({
      where: { id: existing.roomId },
      data: { status: 'Available' },
    });

    await auditService.log({
      action: 'BOOKING_CANCELLED',
      tableName: 'FacilityBooking',
      recordId: id.toString(),
      oldValue: existing,
      userId,
    });

    notifyFacilityChange('Booking Cancelled', { id });

    return true;
  }
}

export class MaintenanceRequestService {
  async getMaintenanceRequests(params: {
    search?: string;
    status?: string;
    priority?: string;
    buildingId?: number;
    roomId?: number;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      maintenanceRequestRepository.findAll({
        search: params.search,
        status: params.status,
        priority: params.priority,
        buildingId: params.buildingId,
        roomId: params.roomId,
        assignedTo: params.assignedTo,
        skip,
        take: limit,
      }),
      maintenanceRequestRepository.count({
        search: params.search,
        status: params.status,
        priority: params.priority,
        buildingId: params.buildingId,
        roomId: params.roomId,
        assignedTo: params.assignedTo,
      }),
    ]);

    return {
      requests,
      total,
      page,
      limit,
    };
  }

  async getMaintenanceRequestById(id: number) {
    const request = await maintenanceRequestRepository.findById(id);
    if (!request) {
      throw new Error('Maintenance request not found');
    }
    return request;
  }

  async createMaintenanceRequest(
    data: {
      buildingId: number;
      roomId?: number | null;
      requestedBy: string;
      issueCategory: string;
      issueDescription: string;
      priority: 'Low' | 'Medium' | 'High' | 'Critical';
    },
    userId: number,
    userEmail: string
  ) {
    const building = await buildingRepository.findById(data.buildingId);
    if (!building) {
      throw new Error('Building not found');
    }

    if (data.roomId) {
      const room = await roomRepository.findById(data.roomId);
      if (!room) {
        throw new Error('Room not found');
      }
    }

    const request = await maintenanceRequestRepository.create({
      buildingId: data.buildingId,
      roomId: data.roomId || null,
      requestedBy: data.requestedBy,
      issueCategory: data.issueCategory,
      issueDescription: data.issueDescription,
      priority: data.priority,
      status: 'Open',
    });

    // If critical/high, mark Room status as 'Maintenance' immediately to avoid new bookings
    if (data.roomId && (data.priority === 'Critical' || data.priority === 'High')) {
      await prisma.room.update({
        where: { id: data.roomId },
        data: { status: 'Maintenance' },
      });
    }

    await auditService.log({
      action: 'MAINTENANCE_REQUEST_CREATED',
      tableName: 'MaintenanceRequest',
      recordId: request.id.toString(),
      newValue: request,
      userId,
    });

    notifyFacilityChange('Maintenance Request Created', request);

    return request;
  }

  async updateMaintenanceRequest(
    id: number,
    data: {
      priority?: 'Low' | 'Medium' | 'High' | 'Critical';
      status?: 'Open' | 'Assigned' | 'In Progress' | 'Completed' | 'Closed';
      assignedTo?: string | null;
      issueDescription?: string;
    },
    userId: number,
    userEmail: string
  ) {
    const existing = await maintenanceRequestRepository.findById(id);
    if (!existing) {
      throw new Error('Maintenance request not found');
    }

    const updateData: any = { ...data };

    if (data.status === 'Completed' || data.status === 'Closed') {
      updateData.completionDate = new Date();
    }

    const updated = await maintenanceRequestRepository.update(id, updateData);

    // Business Rules: Handle Room Status transitions
    if (existing.roomId) {
      if (data.status === 'Completed' || data.status === 'Closed') {
        // Restore room status to Available when maintenance completes
        await prisma.room.update({
          where: { id: existing.roomId },
          data: { status: 'Available' },
        });
      } else if (data.status === 'In Progress' || data.status === 'Assigned') {
        // Mark room as Maintenance
        await prisma.room.update({
          where: { id: existing.roomId },
          data: { status: 'Maintenance' },
        });
      }
    }

    // Log specific events
    let action = 'MAINTENANCE_REQUEST_UPDATED';
    if (data.assignedTo && data.assignedTo !== existing.assignedTo) {
      action = 'WORK_ORDER_ASSIGNED';
      notifyFacilityChange('Technician Assigned', updated);
    } else if (data.status === 'Completed') {
      action = 'MAINTENANCE_COMPLETED';
      notifyFacilityChange('Maintenance Completed', updated);
    }

    await auditService.log({
      action,
      tableName: 'MaintenanceRequest',
      recordId: updated.id.toString(),
      oldValue: existing,
      newValue: updated,
      userId,
    });

    return updated;
  }
}

export const facilityBookingService = new FacilityBookingService();
export const maintenanceRequestService = new MaintenanceRequestService();
