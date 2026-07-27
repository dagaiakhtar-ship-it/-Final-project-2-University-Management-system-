import { prisma } from './db.service';
import { auditService } from './audit.service';

export class HostelService {
  // =========================================================================
  // HOSTEL BUILDING CRUD
  // =========================================================================
  async getBuildings(filters?: { gender?: string; status?: string }) {
    const where: any = {};
    if (filters?.gender) {
      where.gender = filters.gender;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.hostelBuilding.findMany({
      where,
      include: {
        warden: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        rooms: true,
      },
      orderBy: { buildingCode: 'asc' },
    });
  }

  async getBuildingById(id: number) {
    return prisma.hostelBuilding.findUnique({
      where: { id },
      include: {
        warden: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        rooms: true,
      }
    });
  }

  async createBuilding(data: {
    buildingCode: string;
    buildingName: string;
    gender: string;
    address?: string;
    totalFloors: number;
    wardenId?: number;
    status?: string;
  }, userId?: number) {
    // Check duplicate code
    const existing = await prisma.hostelBuilding.findUnique({
      where: { buildingCode: data.buildingCode },
    });
    if (existing) {
      throw new Error(`Building with code '${data.buildingCode}' already exists.`);
    }

    const building = await prisma.hostelBuilding.create({
      data: {
        buildingCode: data.buildingCode,
        buildingName: data.buildingName,
        gender: data.gender,
        address: data.address,
        totalFloors: data.totalFloors,
        wardenId: data.wardenId,
        status: data.status || 'Active',
      },
    });

    await auditService.log({
      action: 'Hostel Created',
      tableName: 'HostelBuilding',
      recordId: String(building.id),
      newValue: building,
      userId,
    });

    return building;
  }

  async updateBuilding(id: number, data: {
    buildingCode?: string;
    buildingName?: string;
    gender?: string;
    address?: string;
    totalFloors?: number;
    wardenId?: number;
    status?: string;
  }, userId?: number) {
    const original = await prisma.hostelBuilding.findUnique({ where: { id } });
    if (!original) {
      throw new Error('Building not found');
    }

    if (data.buildingCode && data.buildingCode !== original.buildingCode) {
      const existing = await prisma.hostelBuilding.findUnique({
        where: { buildingCode: data.buildingCode },
      });
      if (existing) {
        throw new Error(`Building with code '${data.buildingCode}' already exists.`);
      }
    }

    const building = await prisma.hostelBuilding.update({
      where: { id },
      data,
    });

    await auditService.log({
      action: 'Hostel Updated',
      tableName: 'HostelBuilding',
      recordId: String(building.id),
      oldValue: original,
      newValue: building,
      userId,
    });

    return building;
  }

  async deleteBuilding(id: number, userId?: number) {
    const original = await prisma.hostelBuilding.findUnique({ where: { id } });
    if (!original) {
      throw new Error('Building not found');
    }

    // Prevent deletion if rooms or allocations exist
    const roomCount = await prisma.hostelRoom.count({ where: { buildingId: id } });
    if (roomCount > 0) {
      throw new Error('Cannot delete building because it contains active rooms.');
    }

    const building = await prisma.hostelBuilding.delete({
      where: { id },
    });

    await auditService.log({
      action: 'Hostel Deleted',
      tableName: 'HostelBuilding',
      recordId: String(id),
      oldValue: original,
      userId,
    });

    return building;
  }

  // =========================================================================
  // HOSTEL ROOM CRUD
  // =========================================================================
  async getRooms(filters?: { buildingId?: number; floorNumber?: number; roomType?: string; status?: string }) {
    const where: any = {};
    if (filters?.buildingId) where.buildingId = filters.buildingId;
    if (filters?.floorNumber) where.floorNumber = filters.floorNumber;
    if (filters?.roomType) where.roomType = filters.roomType;
    if (filters?.status) where.status = filters.status;

    return prisma.hostelRoom.findMany({
      where,
      include: {
        building: true,
      },
      orderBy: [
        { buildingId: 'asc' },
        { floorNumber: 'asc' },
        { roomNumber: 'asc' },
      ],
    });
  }

  async getRoomById(id: number) {
    return prisma.hostelRoom.findUnique({
      where: { id },
      include: {
        building: true,
        allocations: {
          where: { status: 'Active' },
          include: {
            student: {
              include: {
                user: true,
                department: true,
              },
            },
          },
        },
      },
    });
  }

  private async updateBuildingStats(buildingId: number) {
    const rooms = await prisma.hostelRoom.findMany({
      where: { buildingId },
    });
    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0);

    await prisma.hostelBuilding.update({
      where: { id: buildingId },
      data: { totalRooms, totalBeds },
    });
  }

  async createRoom(data: {
    buildingId: number;
    floorNumber: number;
    roomNumber: string;
    roomType: string;
    capacity: number;
    monthlyFee?: number;
    status?: string;
  }, userId?: number) {
    // Validate building exists
    const building = await prisma.hostelBuilding.findUnique({ where: { id: data.buildingId } });
    if (!building) {
      throw new Error('Hostel Building not found');
    }

    // Check unique room number inside building
    const existing = await prisma.hostelRoom.findUnique({
      where: {
        buildingId_roomNumber: {
          buildingId: data.buildingId,
          roomNumber: data.roomNumber,
        },
      },
    });
    if (existing) {
      throw new Error(`Room '${data.roomNumber}' already exists in this building.`);
    }

    const room = await prisma.hostelRoom.create({
      data: {
        buildingId: data.buildingId,
        floorNumber: data.floorNumber,
        roomNumber: data.roomNumber,
        roomType: data.roomType,
        capacity: data.capacity,
        monthlyFee: data.monthlyFee || 0.0,
        status: data.status || 'Available',
        occupiedBeds: 0,
        availableBeds: data.capacity,
      },
    });

    await this.updateBuildingStats(data.buildingId);

    await auditService.log({
      action: 'Room Created',
      tableName: 'HostelRoom',
      recordId: String(room.id),
      newValue: room,
      userId,
    });

    return room;
  }

  async updateRoom(id: number, data: {
    buildingId?: number;
    floorNumber?: number;
    roomNumber?: string;
    roomType?: string;
    capacity?: number;
    monthlyFee?: number;
    status?: string;
  }, userId?: number) {
    const original = await prisma.hostelRoom.findUnique({ where: { id } });
    if (!original) {
      throw new Error('Room not found');
    }

    const updatedBuildingId = data.buildingId || original.buildingId;

    if (data.roomNumber && (data.roomNumber !== original.roomNumber || (data.buildingId && data.buildingId !== original.buildingId))) {
      const existing = await prisma.hostelRoom.findUnique({
        where: {
          buildingId_roomNumber: {
            buildingId: updatedBuildingId,
            roomNumber: data.roomNumber,
          },
        },
      });
      if (existing) {
        throw new Error(`Room '${data.roomNumber}' already exists in target building.`);
      }
    }

    const updateData: any = { ...data };
    
    // If capacity is updated, adjust available beds
    if (data.capacity !== undefined && data.capacity !== original.capacity) {
      if (data.capacity < original.occupiedBeds) {
        throw new Error(`Cannot set capacity to ${data.capacity} because ${original.occupiedBeds} beds are currently occupied.`);
      }
      updateData.availableBeds = data.capacity - original.occupiedBeds;
      if (updateData.availableBeds === 0) {
        updateData.status = 'Full';
      } else if (original.status === 'Full') {
        updateData.status = 'Available';
      }
    }

    const room = await prisma.hostelRoom.update({
      where: { id },
      data: updateData,
    });

    if (original.buildingId !== updatedBuildingId) {
      await this.updateBuildingStats(original.buildingId);
    }
    await this.updateBuildingStats(updatedBuildingId);

    await auditService.log({
      action: 'Room Updated',
      tableName: 'HostelRoom',
      recordId: String(room.id),
      oldValue: original,
      newValue: room,
      userId,
    });

    return room;
  }

  async deleteRoom(id: number, userId?: number) {
    const original = await prisma.hostelRoom.findUnique({ where: { id } });
    if (!original) {
      throw new Error('Room not found');
    }

    if (original.occupiedBeds > 0) {
      throw new Error('Cannot delete room because it is currently occupied.');
    }

    const room = await prisma.hostelRoom.delete({
      where: { id },
    });

    await this.updateBuildingStats(original.buildingId);

    await auditService.log({
      action: 'Room Deleted',
      tableName: 'HostelRoom',
      recordId: String(id),
      oldValue: original,
      userId,
    });

    return room;
  }

  // =========================================================================
  // HOSTEL ALLOCATION / ADMISSION
  // =========================================================================
  async getAllocations(filters?: { studentId?: number; buildingId?: number; roomId?: number; status?: string }) {
    const where: any = {};
    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.buildingId) where.buildingId = filters.buildingId;
    if (filters?.roomId) where.roomId = filters.roomId;
    if (filters?.status) where.status = filters.status;

    return prisma.hostelAllocation.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            department: true,
            program: true,
          }
        },
        building: true,
        room: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAllocation(data: {
    studentId: number;
    buildingId: number;
    roomId: number;
    bedNumber: string;
    allocationDate?: Date | string;
    expectedCheckout?: Date | string;
    status?: string;
    remarks?: string;
  }, userId?: number) {
    // 1. Verify Student Exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: { user: true },
    });
    if (!student) {
      throw new Error('Student not found.');
    }

    // 2. Prevent overbooking / check bed availability
    const room = await prisma.hostelRoom.findUnique({
      where: { id: data.roomId },
      include: { building: true },
    });
    if (!room) {
      throw new Error('Room not found.');
    }
    if (room.buildingId !== data.buildingId) {
      throw new Error('Room does not belong to specified Hostel Building.');
    }
    if (room.availableBeds <= 0 || room.status === 'Full' || room.status === 'Maintenance') {
      throw new Error('Room has no available beds or is undergoing maintenance.');
    }

    // 3. Prevent duplicate active allocation
    const existingActive = await prisma.hostelAllocation.findFirst({
      where: {
        studentId: data.studentId,
        status: 'Active',
      },
    });
    if (existingActive) {
      throw new Error('Student already has an active room allocation.');
    }

    // 4. Validate gender restrictions
    const building = room.building;
    const isMixedBuilding = building.gender.trim().toUpperCase() === 'MIXED';
    if (!isMixedBuilding) {
      const studentGender = (student.gender?.toUpperCase() || student.user.gender).trim().toUpperCase();
      const buildingGender = building.gender.trim().toUpperCase();
      if (studentGender !== buildingGender) {
        throw new Error(`Gender restriction conflict: Building is for '${building.gender}' but student is '${student.gender || student.user.gender}'.`);
      }
    }

    // 5. Check if bedNumber is already occupied in this room (normalized check)
    const normalizedBedNumber = data.bedNumber.trim().toUpperCase();
    const bedTaken = await prisma.hostelAllocation.findFirst({
      where: {
        roomId: data.roomId,
        bedNumber: { equals: normalizedBedNumber, mode: 'insensitive' },
        status: 'Active',
      }
    });
    if (bedTaken) {
      throw new Error(`Bed '${data.bedNumber}' is already occupied in this room.`);
    }

    // Proceed inside a transaction to maintain integrity
    const allocation = await prisma.$transaction(async (tx) => {
      // Create allocation
      const alloc = await tx.hostelAllocation.create({
        data: {
          studentId: data.studentId,
          buildingId: data.buildingId,
          roomId: data.roomId,
          bedNumber: data.bedNumber,
          allocationDate: data.allocationDate ? new Date(data.allocationDate) : new Date(),
          expectedCheckout: data.expectedCheckout ? new Date(data.expectedCheckout) : null,
          status: data.status || 'Active',
          remarks: data.remarks,
        },
      });

      // Update room occupied/available beds
      const newOccupied = room.occupiedBeds + 1;
      const newAvailable = room.availableBeds - 1;
      await tx.hostelRoom.update({
        where: { id: data.roomId },
        data: {
          occupiedBeds: newOccupied,
          availableBeds: newAvailable,
          status: newAvailable === 0 ? 'Full' : 'Available',
        },
      });

      // Set hostel status on student profile if fields exist
      await tx.student.update({
        where: { id: data.studentId },
        data: { hostelStatus: 'Allocated' },
      });

      return alloc;
    });

    await auditService.log({
      action: 'Allocation Created',
      tableName: 'HostelAllocation',
      recordId: String(allocation.id),
      newValue: allocation,
      userId,
    });

    return allocation;
  }

  async transferAllocation(id: number, data: {
    targetRoomId: number;
    bedNumber: string;
    remarks?: string;
  }, userId?: number) {
    const allocation = await prisma.hostelAllocation.findUnique({
      where: { id },
      include: {
        student: { include: { user: true } },
        room: true,
      }
    });

    if (!allocation) {
      throw new Error('Allocation not found.');
    }
    if (allocation.status !== 'Active') {
      throw new Error('Can only transfer active room allocations.');
    }

    const currentRoom = allocation.room;
    const targetRoom = await prisma.hostelRoom.findUnique({
      where: { id: data.targetRoomId },
      include: { building: true },
    });

    if (!targetRoom) {
      throw new Error('Target room not found.');
    }
    if (targetRoom.availableBeds <= 0 || targetRoom.status === 'Full' || targetRoom.status === 'Maintenance') {
      throw new Error('Target room has no available beds or is undergoing maintenance.');
    }

    // Gender check
    const building = targetRoom.building;
    const isMixedBuilding = building.gender.trim().toUpperCase() === 'MIXED';
    if (!isMixedBuilding) {
      const studentGender = (allocation.student.gender?.toUpperCase() || allocation.student.user.gender).trim().toUpperCase();
      const buildingGender = building.gender.trim().toUpperCase();
      if (studentGender !== buildingGender) {
        throw new Error(`Gender restriction conflict: Target building is for '${building.gender}' but student is '${allocation.student.gender || allocation.student.user.gender}'.`);
      }
    }

    // Bed check (normalized check)
    const normalizedBedNumber = data.bedNumber.trim().toUpperCase();
    const bedTaken = await prisma.hostelAllocation.findFirst({
      where: {
        roomId: data.targetRoomId,
        bedNumber: { equals: normalizedBedNumber, mode: 'insensitive' },
        status: 'Active',
      }
    });
    if (bedTaken) {
      throw new Error(`Bed '${data.bedNumber}' is already occupied in target room.`);
    }

    const updatedAllocation = await prisma.$transaction(async (tx) => {
      // 1. Close current allocation as Completed
      await tx.hostelAllocation.update({
        where: { id },
        data: {
          status: 'Completed',
          expectedCheckout: new Date(),
          remarks: `${allocation.remarks || ''} [Transferred to Room ${targetRoom.roomNumber}]`.trim(),
        },
      });

      // 2. Reclaim bed in current room
      await tx.hostelRoom.update({
        where: { id: currentRoom.id },
        data: {
          occupiedBeds: Math.max(0, currentRoom.occupiedBeds - 1),
          availableBeds: Math.min(currentRoom.capacity, currentRoom.availableBeds + 1),
          status: 'Available',
        },
      });

      // 3. Create new allocation
      const newAlloc = await tx.hostelAllocation.create({
        data: {
          studentId: allocation.studentId,
          buildingId: targetRoom.buildingId,
          roomId: targetRoom.id,
          bedNumber: data.bedNumber,
          allocationDate: new Date(),
          status: 'Active',
          remarks: data.remarks || `Transferred from Room ${currentRoom.roomNumber}`,
        },
      });

      // 4. Consume bed in target room
      const targetNewOccupied = targetRoom.occupiedBeds + 1;
      const targetNewAvailable = targetRoom.availableBeds - 1;
      await tx.hostelRoom.update({
        where: { id: targetRoom.id },
        data: {
          occupiedBeds: targetNewOccupied,
          availableBeds: targetNewAvailable,
          status: targetNewAvailable === 0 ? 'Full' : 'Available',
        },
      });

      return newAlloc;
    });

    await auditService.log({
      action: 'Transfer Completed',
      tableName: 'HostelAllocation',
      recordId: String(updatedAllocation.id),
      oldValue: allocation,
      newValue: updatedAllocation,
      userId,
    });

    return updatedAllocation;
  }

  async checkoutAllocation(id: number, userId?: number) {
    const allocation = await prisma.hostelAllocation.findUnique({
      where: { id },
      include: { room: true }
    });

    if (!allocation) {
      throw new Error('Allocation not found.');
    }
    if (allocation.status !== 'Active') {
      throw new Error('Allocation is not active.');
    }

    const room = allocation.room;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.hostelAllocation.update({
        where: { id },
        data: {
          status: 'Completed',
          expectedCheckout: new Date(),
        },
      });

      await tx.hostelRoom.update({
        where: { id: room.id },
        data: {
          occupiedBeds: Math.max(0, room.occupiedBeds - 1),
          availableBeds: Math.min(room.capacity, room.availableBeds + 1),
          status: 'Available',
        },
      });

      await tx.student.update({
        where: { id: allocation.studentId },
        data: { hostelStatus: 'CheckedOut' },
      });

      return updated;
    });

    await auditService.log({
      action: 'Transfer Completed', // In audit, can log checkout or transfer
      tableName: 'HostelAllocation',
      recordId: String(id),
      oldValue: allocation,
      newValue: result,
      userId,
    });

    return result;
  }

  // =========================================================================
  // VISITOR LOGS
  // =========================================================================
  async getVisitorLogs(filters?: { studentId?: number }) {
    const where: any = {};
    if (filters?.studentId) where.studentId = filters.studentId;

    return prisma.visitorLog.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            hostelAllocations: {
              where: { status: 'Active' },
              include: { room: true, building: true }
            }
          }
        }
      },
      orderBy: { checkIn: 'desc' },
    });
  }

  async logVisitor(data: {
    studentId: number;
    visitorName: string;
    relationship: string;
    phone: string;
    remarks?: string;
    approvedBy?: string;
  }, userId?: number) {
    const studentExists = await prisma.student.findUnique({ where: { id: data.studentId } });
    if (!studentExists) {
      throw new Error('Student not found.');
    }

    // Verify student is an active resident
    const activeAlloc = await prisma.hostelAllocation.findFirst({
      where: { studentId: data.studentId, status: 'Active' },
    });
    if (!activeAlloc) {
      throw new Error('Student does not have an active hostel accommodation. Visitors can only be registered for resident students.');
    }

    const log = await prisma.visitorLog.create({
      data: {
        studentId: data.studentId,
        visitorName: data.visitorName,
        relationship: data.relationship,
        phone: data.phone,
        checkIn: new Date(),
        remarks: data.remarks,
        approvedBy: data.approvedBy,
      },
    });

    await auditService.log({
      action: 'Visitor Entry',
      tableName: 'VisitorLog',
      recordId: String(log.id),
      newValue: log,
      userId,
    });

    return log;
  }

  async checkoutVisitor(id: number, userId?: number) {
    const original = await prisma.visitorLog.findUnique({ where: { id } });
    if (!original) {
      throw new Error('Visitor log not found.');
    }

    const updated = await prisma.visitorLog.update({
      where: { id },
      data: {
        checkOut: new Date(),
      }
    });

    await auditService.log({
      action: 'Visitor Entry', // Keep audit code matches
      tableName: 'VisitorLog',
      recordId: String(id),
      oldValue: original,
      newValue: updated,
      userId,
    });

    return updated;
  }

  // =========================================================================
  // COMPLAINT MANAGEMENT
  // =========================================================================
  async getComplaints(filters?: { studentId?: number; status?: string }) {
    const where: any = {};
    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.status) where.status = filters.status;

    return prisma.hostelComplaint.findMany({
      where,
      include: {
        student: { include: { user: true } },
        room: { include: { building: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createComplaint(data: {
    studentId: number;
    title: string;
    description: string;
    category: string;
    roomId?: number;
  }, userId?: number) {
    // If room is not provided, look up active room allocation for student
    let resolvedRoomId = data.roomId;
    if (!resolvedRoomId) {
      const activeAlloc = await prisma.hostelAllocation.findFirst({
        where: { studentId: data.studentId, status: 'Active' },
      });
      if (activeAlloc) {
        resolvedRoomId = activeAlloc.roomId;
      }
    }

    const complaint = await prisma.hostelComplaint.create({
      data: {
        studentId: data.studentId,
        roomId: resolvedRoomId,
        title: data.title,
        description: data.description,
        category: data.category,
        status: 'Pending',
      },
    });

    await auditService.log({
      action: 'Complaint Submitted',
      tableName: 'HostelComplaint',
      recordId: String(complaint.id),
      newValue: complaint,
      userId,
    });

    return complaint;
  }

  async updateComplaint(id: number, data: {
    status?: string;
    remarks?: string;
  }, userId?: number) {
    const original = await prisma.hostelComplaint.findUnique({ where: { id } });
    if (!original) {
      throw new Error('Complaint not found.');
    }

    const complaint = await prisma.hostelComplaint.update({
      where: { id },
      data,
    });

    await auditService.log({
      action: 'Complaint Submitted', // Keep action aligned
      tableName: 'HostelComplaint',
      recordId: String(id),
      oldValue: original,
      newValue: complaint,
      userId,
    });

    return complaint;
  }

  // =========================================================================
  // MAINTENANCE REQUESTS
  // =========================================================================
  async getMaintenances(filters?: { roomId?: number; status?: string }) {
    const where: any = {};
    if (filters?.roomId) where.roomId = filters.roomId;
    if (filters?.status) where.status = filters.status;

    return prisma.hostelMaintenance.findMany({
      where,
      include: {
        room: { include: { building: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMaintenance(data: {
    roomId: number;
    title: string;
    description: string;
    category: string;
    priority: string;
  }, userId?: number) {
    const maintenance = await prisma.hostelMaintenance.create({
      data: {
        roomId: data.roomId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: 'Pending',
      }
    });

    await auditService.log({
      action: 'Maintenance Updated', // Map action
      tableName: 'HostelMaintenance',
      recordId: String(maintenance.id),
      newValue: maintenance,
      userId,
    });

    return maintenance;
  }

  async updateMaintenance(id: number, data: {
    status?: string;
    cost?: number;
    remarks?: string;
  }, userId?: number) {
    const original = await prisma.hostelMaintenance.findUnique({ where: { id } });
    if (!original) {
      throw new Error('Maintenance request not found.');
    }

    const maintenance = await prisma.hostelMaintenance.update({
      where: { id },
      data,
    });

    await auditService.log({
      action: 'Maintenance Updated',
      tableName: 'HostelMaintenance',
      recordId: String(id),
      oldValue: original,
      newValue: maintenance,
      userId,
    });

    return maintenance;
  }

  // =========================================================================
  // HOSTEL OCCUPANCY ANALYTICS
  // =========================================================================
  async getHostelAnalytics() {
    const buildings = await prisma.hostelBuilding.findMany({
      include: { rooms: true }
    });

    const rooms = await prisma.hostelRoom.findMany();
    const allocations = await prisma.hostelAllocation.findMany({
      where: { status: 'Active' },
      include: { student: true }
    });

    // Counts
    const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupiedBeds = allocations.length;
    const availableBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? parseFloat(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

    // Complaints Statistics
    const complaints = await prisma.hostelComplaint.findMany();
    const totalComplaints = complaints.length;
    const resolvedComplaints = complaints.filter(c => c.status === 'Resolved').length;
    const pendingComplaints = totalComplaints - resolvedComplaints;

    // Maintenance Statistics
    const maintenances = await prisma.hostelMaintenance.findMany();
    const totalMaintenances = maintenances.length;
    const pendingMaintenances = maintenances.filter(m => m.status !== 'Completed' && m.status !== 'Cancelled').length;
    const totalMaintenanceCost = maintenances.reduce((sum, m) => sum + m.cost, 0);

    // Building Utilization Chart data
    const buildingUtilization = buildings.map(b => {
      const bRooms = rooms.filter(r => r.buildingId === b.id);
      const bBeds = bRooms.reduce((sum, r) => sum + r.capacity, 0);
      const bOccupied = allocations.filter(a => a.buildingId === b.id).length;
      const bAvailable = bBeds - bOccupied;
      return {
        name: b.buildingCode,
        beds: bBeds,
        occupied: bOccupied,
        available: bAvailable,
        utilization: bBeds > 0 ? parseFloat(((bOccupied / bBeds) * 100).toFixed(1)) : 0,
      };
    });

    // Gender Distribution Chart data
    const maleOccupied = allocations.filter(a => a.student.gender?.toUpperCase() === 'MALE').length;
    const femaleOccupied = allocations.filter(a => a.student.gender?.toUpperCase() === 'FEMALE').length;
    const otherOccupied = occupiedBeds - maleOccupied - femaleOccupied;

    const genderDistribution = [
      { name: 'Male Students', value: maleOccupied },
      { name: 'Female Students', value: femaleOccupied },
      { name: 'Other', value: otherOccupied },
    ].filter(g => g.value > 0);

    // Complaint category breakdown
    const categoryCount: Record<string, number> = {};
    complaints.forEach(c => {
      categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
    });
    const complaintStats = Object.keys(categoryCount).map(cat => ({
      category: cat,
      count: categoryCount[cat]
    }));

    // Future-ready monthly billing / revenue data
    const monthlyRevenueProjection = rooms.reduce((sum, r) => sum + (r.occupiedBeds * r.monthlyFee), 0);

    return {
      summary: {
        totalBuildings: buildings.length,
        totalRooms: rooms.length,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
        totalMaintenances,
        pendingMaintenances,
        totalMaintenanceCost,
        monthlyRevenueProjection,
      },
      buildingUtilization,
      genderDistribution,
      complaintStats,
    };
  }
}

export const hostelService = new HostelService();
export default hostelService;
