import { prisma } from './db.service';
import QRCode from 'qrcode';
import { auditService } from './audit.service';
import { notifyTransportChange } from './socket.service';

export class TransportService {
  // =========================================================================
  // VEHICLES
  // =========================================================================
  async getVehicles() {
    return prisma.vehicle.findMany({
      include: {
        drivers: true,
        maintenances: {
          orderBy: { maintenanceDate: 'desc' },
          take: 5,
        },
        fuelLogs: {
          orderBy: { fillDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { vehicleNumber: 'asc' },
    });
  }

  async getVehicleById(id: number) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        drivers: true,
        maintenances: {
          orderBy: { maintenanceDate: 'desc' },
        },
        fuelLogs: {
          orderBy: { fillDate: 'desc' },
        },
        trips: {
          orderBy: { tripDate: 'desc' },
          include: {
            driver: true,
            route: true,
          },
        },
      },
    });
  }

  async createVehicle(data: any, userId?: number) {
    const existing = await prisma.vehicle.findUnique({
      where: { vehicleNumber: data.vehicleNumber },
    });
    if (existing) {
      throw new Error(`Vehicle with number ${data.vehicleNumber} already exists.`);
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        vehicleNumber: data.vehicleNumber,
        registrationNumber: data.registrationNumber,
        vehicleType: data.vehicleType,
        manufacturer: data.manufacturer,
        model: data.model,
        year: data.year,
        seatingCapacity: data.seatingCapacity,
        fuelType: data.fuelType,
        insuranceExpiry: new Date(data.insuranceExpiry),
        fitnessExpiry: new Date(data.fitnessExpiry),
        status: data.status || 'Active',
      },
    });

    await auditService.log({
      action: 'CREATE',
      tableName: 'Vehicle',
      recordId: vehicle.id.toString(),
      newValue: vehicle,
      userId,
    });

    return vehicle;
  }

  async updateVehicle(id: number, data: any, userId?: number) {
    const current = await prisma.vehicle.findUnique({ where: { id } });
    if (!current) throw new Error('Vehicle not found');

    if (data.vehicleNumber && data.vehicleNumber !== current.vehicleNumber) {
      const existing = await prisma.vehicle.findUnique({
        where: { vehicleNumber: data.vehicleNumber },
      });
      if (existing) {
        throw new Error(`Vehicle with number ${data.vehicleNumber} already exists.`);
      }
    }

    const updateData: any = { ...data };
    if (data.insuranceExpiry) updateData.insuranceExpiry = new Date(data.insuranceExpiry);
    if (data.fitnessExpiry) updateData.fitnessExpiry = new Date(data.fitnessExpiry);

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData,
    });

    await auditService.log({
      action: 'UPDATE',
      tableName: 'Vehicle',
      recordId: vehicle.id.toString(),
      oldValue: current,
      newValue: vehicle,
      userId,
    });

    return vehicle;
  }

  async deleteVehicle(id: number, userId?: number) {
    const current = await prisma.vehicle.findUnique({ where: { id } });
    if (!current) throw new Error('Vehicle not found');

    await prisma.vehicle.delete({ where: { id } });

    await auditService.log({
      action: 'DELETE',
      tableName: 'Vehicle',
      recordId: id.toString(),
      oldValue: current,
      userId,
    });

    return { success: true };
  }

  // =========================================================================
  // DRIVERS
  // =========================================================================
  async getDrivers() {
    return prisma.driver.findMany({
      include: {
        assignedVehicle: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async getDriverById(id: number) {
    return prisma.driver.findUnique({
      where: { id },
      include: {
        assignedVehicle: true,
        trips: {
          orderBy: { tripDate: 'desc' },
          include: {
            vehicle: true,
            route: true,
          },
        },
      },
    });
  }

  async createDriver(data: any, userId?: number) {
    const existingEmail = await prisma.driver.findUnique({ where: { email: data.email } });
    if (existingEmail) throw new Error('Driver with this email already exists');

    const existingLicense = await prisma.driver.findUnique({ where: { licenseNumber: data.licenseNumber } });
    if (existingLicense) throw new Error('Driver with this license number already exists');

    const driver = await prisma.driver.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry),
        address: data.address,
        emergencyContact: data.emergencyContact,
        assignedVehicleId: data.assignedVehicleId ? parseInt(data.assignedVehicleId, 10) : null,
        status: data.status || 'Active',
      },
    });

    await auditService.log({
      action: 'CREATE',
      tableName: 'Driver',
      recordId: driver.id.toString(),
      newValue: driver,
      userId,
    });

    notifyTransportChange('DRIVER_CHANGED', { driverId: driver.id, fullName: driver.fullName });
    return driver;
  }

  async updateDriver(id: number, data: any, userId?: number) {
    const current = await prisma.driver.findUnique({ where: { id } });
    if (!current) throw new Error('Driver not found');

    if (data.email && data.email !== current.email) {
      const existingEmail = await prisma.driver.findUnique({ where: { email: data.email } });
      if (existingEmail) throw new Error('Driver with this email already exists');
    }

    if (data.licenseNumber && data.licenseNumber !== current.licenseNumber) {
      const existingLicense = await prisma.driver.findUnique({ where: { licenseNumber: data.licenseNumber } });
      if (existingLicense) throw new Error('Driver with this license number already exists');
    }

    const updateData: any = { ...data };
    if (data.licenseExpiry) updateData.licenseExpiry = new Date(data.licenseExpiry);
    if (data.assignedVehicleId !== undefined) {
      updateData.assignedVehicleId = data.assignedVehicleId ? parseInt(data.assignedVehicleId, 10) : null;
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: updateData,
    });

    await auditService.log({
      action: 'UPDATE',
      tableName: 'Driver',
      recordId: driver.id.toString(),
      oldValue: current,
      newValue: driver,
      userId,
    });

    notifyTransportChange('DRIVER_CHANGED', { driverId: driver.id, fullName: driver.fullName });
    return driver;
  }

  async deleteDriver(id: number, userId?: number) {
    const current = await prisma.driver.findUnique({ where: { id } });
    if (!current) throw new Error('Driver not found');

    await prisma.driver.delete({ where: { id } });

    await auditService.log({
      action: 'DELETE',
      tableName: 'Driver',
      recordId: id.toString(),
      oldValue: current,
      userId,
    });

    return { success: true };
  }

  // =========================================================================
  // ROUTES & STOPS
  // =========================================================================
  async getRoutes() {
    return prisma.transportRoute.findMany({
      include: {
        stops: {
          orderBy: { sequence: 'asc' },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { routeCode: 'asc' },
    });
  }

  async getRouteById(id: number) {
    return prisma.transportRoute.findUnique({
      where: { id },
      include: {
        stops: {
          orderBy: { sequence: 'asc' },
        },
        registrations: {
          include: {
            student: true,
            employee: true,
          },
        },
        trips: {
          orderBy: { tripDate: 'desc' },
          include: {
            vehicle: true,
            driver: true,
          },
        },
      },
    });
  }

  async createRoute(data: any, userId?: number) {
    const existing = await prisma.transportRoute.findUnique({
      where: { routeCode: data.routeCode },
    });
    if (existing) throw new Error(`Route code ${data.routeCode} is already in use`);

    const route = await prisma.transportRoute.create({
      data: {
        routeName: data.routeName,
        routeCode: data.routeCode,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        estimatedDistance: parseFloat(data.estimatedDistance),
        estimatedTime: data.estimatedTime,
        fare: data.fare ? parseFloat(data.fare) : 0.0,
        active: data.active !== undefined ? data.active : true,
      },
    });

    // Create stops if provided
    if (data.stops && Array.isArray(data.stops)) {
      for (const stop of data.stops) {
        await prisma.transportStop.create({
          data: {
            routeId: route.id,
            stopName: stop.stopName,
            latitude: parseFloat(stop.latitude),
            longitude: parseFloat(stop.longitude),
            arrivalTime: stop.arrivalTime,
            departureTime: stop.departureTime,
            sequence: parseInt(stop.sequence, 10),
          },
        });
      }
    }

    await auditService.log({
      action: 'CREATE',
      tableName: 'TransportRoute',
      recordId: route.id.toString(),
      newValue: route,
      userId,
    });

    notifyTransportChange('ROUTE_UPDATED', { routeId: route.id, routeName: route.routeName });
    return this.getRouteById(route.id);
  }

  async updateRoute(id: number, data: any, userId?: number) {
    const current = await prisma.transportRoute.findUnique({ where: { id } });
    if (!current) throw new Error('Route not found');

    if (data.routeCode && data.routeCode !== current.routeCode) {
      const existing = await prisma.transportRoute.findUnique({
        where: { routeCode: data.routeCode },
      });
      if (existing) throw new Error(`Route code ${data.routeCode} is already in use`);
    }

    const updateData: any = {};
    if (data.routeName !== undefined) updateData.routeName = data.routeName;
    if (data.routeCode !== undefined) updateData.routeCode = data.routeCode;
    if (data.startLocation !== undefined) updateData.startLocation = data.startLocation;
    if (data.endLocation !== undefined) updateData.endLocation = data.endLocation;
    if (data.estimatedDistance !== undefined) updateData.estimatedDistance = parseFloat(data.estimatedDistance);
    if (data.estimatedTime !== undefined) updateData.estimatedTime = data.estimatedTime;
    if (data.fare !== undefined) updateData.fare = parseFloat(data.fare);
    if (data.active !== undefined) updateData.active = data.active;

    const route = await prisma.transportRoute.update({
      where: { id },
      data: updateData,
    });

    // Recreate/update stops if specified
    if (data.stops && Array.isArray(data.stops)) {
      // Simple strategy: Clear previous stops, insert new ones
      await prisma.transportStop.deleteMany({ where: { routeId: id } });
      for (const stop of data.stops) {
        await prisma.transportStop.create({
          data: {
            routeId: id,
            stopName: stop.stopName,
            latitude: parseFloat(stop.latitude),
            longitude: parseFloat(stop.longitude),
            arrivalTime: stop.arrivalTime,
            departureTime: stop.departureTime,
            sequence: parseInt(stop.sequence, 10),
          },
        });
      }
    }

    await auditService.log({
      action: 'UPDATE',
      tableName: 'TransportRoute',
      recordId: route.id.toString(),
      oldValue: current,
      newValue: route,
      userId,
    });

    notifyTransportChange('ROUTE_UPDATED', { routeId: route.id, routeName: route.routeName });
    return this.getRouteById(id);
  }

  async deleteRoute(id: number, userId?: number) {
    const current = await prisma.transportRoute.findUnique({ where: { id } });
    if (!current) throw new Error('Route not found');

    await prisma.transportRoute.delete({ where: { id } });

    await auditService.log({
      action: 'DELETE',
      tableName: 'TransportRoute',
      recordId: id.toString(),
      oldValue: current,
      userId,
    });

    return { success: true };
  }

  async getStopsByRoute(routeId: number) {
    return prisma.transportStop.findMany({
      where: { routeId },
      orderBy: { sequence: 'asc' },
    });
  }

  // =========================================================================
  // TRANSPORT REGISTRATION (BUS PASSES)
  // =========================================================================
  async registerTransport(data: any, userId?: number) {
    const routeId = parseInt(data.routeId, 10);
    const pickupStopId = parseInt(data.pickupStopId, 10);
    const dropStopId = parseInt(data.dropStopId, 10);
    const studentId = data.studentId ? parseInt(data.studentId, 10) : null;
    const employeeId = data.employeeId ? parseInt(data.employeeId, 10) : null;

    if (!studentId && !employeeId) {
      throw new Error('Must specify either a student or an employee for registration.');
    }

    // Check duplicate registrations
    if (studentId) {
      const dup = await prisma.transportRegistration.findFirst({
        where: { studentId, transportStatus: { in: ['Active', 'Pending'] } },
      });
      if (dup) throw new Error('Student already has an active or pending transport registration');
    }

    if (employeeId) {
      const dup = await prisma.transportRegistration.findFirst({
        where: { employeeId, transportStatus: { in: ['Active', 'Pending'] } },
      });
      if (dup) throw new Error('Employee already has an active or pending transport registration');
    }

    // Capacity & Overbooking Checks
    // Find vehicle capacity assigned to this route or sum capacities of vehicles doing trips
    const route = await prisma.transportRoute.findUnique({
      where: { id: routeId },
      include: {
        trips: {
          where: { status: { in: ['Scheduled', 'Ongoing', 'Completed'] } },
          include: { vehicle: true },
        },
      },
    });
    if (!route) throw new Error('Selected route does not exist');

    // Get active/pending pass holders count for this route
    const activePassesCount = await prisma.transportRegistration.count({
      where: { routeId, transportStatus: { in: ['Active', 'Pending'] } },
    });

    // Determine aggregate seating capacity of vehicles servicing this route
    let routeCapacity = 50; // Default buffer fallback
    if (route.trips && route.trips.length > 0) {
      const uniqueVehicles = new Map();
      route.trips.forEach((t) => {
        if (t.vehicle) uniqueVehicles.set(t.vehicle.id, t.vehicle.seatingCapacity);
      });
      if (uniqueVehicles.size > 0) {
        routeCapacity = Array.from(uniqueVehicles.values()).reduce((a, b) => a + b, 0);
      }
    }

    if (activePassesCount >= routeCapacity) {
      throw new Error(`Seat Booking Failure: Selected route is fully booked (Capacity: ${routeCapacity}/${routeCapacity} seats)`);
    }

    // Generate unique pass details
    const passNumber = `PASS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Generate real QR Code data url using qrcode module
    const qrPayload = {
      passNumber,
      routeCode: route.routeCode,
      studentId,
      employeeId,
    };
    const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrPayload));

    const registration = await prisma.transportRegistration.create({
      data: {
        studentId,
        employeeId,
        routeId,
        pickupStopId,
        dropStopId,
        passNumber,
        qrCode: qrCodeBase64,
        validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        transportStatus: 'Pending', // Requiring admin approval (Business Rule)
      },
      include: {
        student: true,
        employee: true,
        route: true,
        pickupStop: true,
        dropStop: true,
      },
    });

    await auditService.log({
      action: 'REGISTER',
      tableName: 'TransportRegistration',
      recordId: registration.id.toString(),
      newValue: registration,
      userId,
    });

    notifyTransportChange('REGISTRATION_SUBMITTED', {
      registrationId: registration.id,
      passNumber,
      studentId,
    });

    return registration;
  }

  async getPasses(filters: { status?: string; studentId?: number; employeeId?: number } = {}) {
    const whereClause: any = {};
    if (filters.status) whereClause.transportStatus = filters.status;
    if (filters.studentId) whereClause.studentId = filters.studentId;
    if (filters.employeeId) whereClause.employeeId = filters.employeeId;

    return prisma.transportRegistration.findMany({
      where: whereClause,
      include: {
        student: true,
        employee: true,
        route: {
          include: { stops: true },
        },
        pickupStop: true,
        dropStop: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPassById(id: number) {
    return prisma.transportRegistration.findUnique({
      where: { id },
      include: {
        student: true,
        employee: true,
        route: {
          include: { stops: true },
        },
        pickupStop: true,
        dropStop: true,
        attendances: {
          orderBy: { scanTime: 'desc' },
          take: 20,
        },
      },
    });
  }

  async updatePassStatus(id: number, status: string, userId?: number) {
    const current = await prisma.transportRegistration.findUnique({ where: { id } });
    if (!current) throw new Error('Pass registration record not found');

    const updated = await prisma.transportRegistration.update({
      where: { id },
      data: { transportStatus: status },
      include: {
        student: true,
        employee: true,
      },
    });

    await auditService.log({
      action: 'UPDATE_PASS_STATUS',
      tableName: 'TransportRegistration',
      recordId: id.toString(),
      oldValue: current,
      newValue: updated,
      userId,
    });

    notifyTransportChange('PASS_STATUS_CHANGED', {
      registrationId: id,
      passNumber: updated.passNumber,
      status,
      studentId: updated.studentId,
    });

    return updated;
  }

  // =========================================================================
  // ATTENDANCE
  // =========================================================================
  async markAttendance(data: any, driverUserId?: number) {
    const registrationId = parseInt(data.registrationId, 10);
    const status = data.status || 'Present';
    const direction = data.direction || 'Pickup';

    const reg = await prisma.transportRegistration.findUnique({
      where: { id: registrationId },
      include: {
        student: true,
        employee: true,
      },
    });
    if (!reg) throw new Error('Invalid transport registration');
    if (reg.transportStatus !== 'Active') {
      throw new Error(`Access Denied: Transport pass ${reg.passNumber} is currently ${reg.transportStatus}.`);
    }

    const now = new Date();
    if (reg.validUntil < now) {
      throw new Error(`Access Denied: Transport pass ${reg.passNumber} has expired on ${reg.validUntil.toLocaleDateString()}.`);
    }
    if (reg.validFrom > now) {
      throw new Error(`Access Denied: Transport pass ${reg.passNumber} is not yet active (starts on ${reg.validFrom.toLocaleDateString()}).`);
    }

    // Try finding driver associated with driverUserId if any
    let driverId = null;
    if (driverUserId) {
      const driver = await prisma.driver.findFirst({
        where: { email: (await prisma.user.findUnique({ where: { id: driverUserId } }))?.email || '' },
      });
      if (driver) driverId = driver.id;
    }

    const attendance = await prisma.transportAttendance.create({
      data: {
        registrationId,
        driverId,
        status,
        direction,
      },
      include: {
        registration: {
          include: {
            student: true,
            employee: true,
            route: true,
          },
        },
      },
    });

    notifyTransportChange('ATTENDANCE_MARKED', {
      attendanceId: attendance.id,
      studentId: reg.studentId,
      status,
      direction,
    });

    return attendance;
  }

  async getAttendanceHistory(filters: { registrationId?: number; routeId?: number; date?: string; studentId?: number; employeeId?: number } = {}) {
    const whereClause: any = {};
    if (filters.registrationId) whereClause.registrationId = filters.registrationId;
    
    const registrationWhere: any = {};
    if (filters.routeId) registrationWhere.routeId = filters.routeId;
    if (filters.studentId) registrationWhere.studentId = filters.studentId;
    if (filters.employeeId) registrationWhere.employeeId = filters.employeeId;

    if (Object.keys(registrationWhere).length > 0) {
      whereClause.registration = registrationWhere;
    }

    if (filters.date) {
      const start = new Date(filters.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.date);
      end.setHours(23, 59, 59, 999);
      whereClause.scanTime = { gte: start, lte: end };
    }

    return prisma.transportAttendance.findMany({
      where: whereClause,
      include: {
        registration: {
          include: {
            student: true,
            employee: true,
            route: true,
          },
        },
        driver: true,
      },
      orderBy: { scanTime: 'desc' },
    });
  }

  // =========================================================================
  // VEHICLE MAINTENANCE & FUEL LOGS & TRIPS
  // =========================================================================
  async getMaintenanceHistory(vehicleId?: number) {
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    return prisma.vehicleMaintenance.findMany({
      where,
      include: { vehicle: true },
      orderBy: { maintenanceDate: 'desc' },
    });
  }

  async createMaintenance(data: any, userId?: number) {
    const maintenance = await prisma.vehicleMaintenance.create({
      data: {
        vehicleId: parseInt(data.vehicleId, 10),
        maintenanceType: data.maintenanceType,
        description: data.description,
        maintenanceCost: parseFloat(data.maintenanceCost || '0'),
        status: data.status || 'Scheduled',
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
      },
    });

    // Trigger maintenance status alert if it's Scheduled or In Progress
    if (data.status === 'In Progress') {
      await prisma.vehicle.update({
        where: { id: parseInt(data.vehicleId, 10) },
        data: { status: 'Maintenance' },
      });
      notifyTransportChange('MAINTENANCE_ALERT', { vehicleId: data.vehicleId, status: 'In Progress' });
    }

    await auditService.log({
      action: 'CREATE_MAINTENANCE',
      tableName: 'VehicleMaintenance',
      recordId: maintenance.id.toString(),
      newValue: maintenance,
      userId,
    });

    return maintenance;
  }

  async updateMaintenance(id: number, data: any, userId?: number) {
    const current = await prisma.vehicleMaintenance.findUnique({ where: { id } });
    if (!current) throw new Error('Record not found');

    const updateData: any = { ...data };
    if (data.completedAt) updateData.completedAt = new Date(data.completedAt);
    if (data.maintenanceCost !== undefined) updateData.maintenanceCost = parseFloat(data.maintenanceCost);

    const updated = await prisma.vehicleMaintenance.update({
      where: { id },
      data: updateData,
    });

    if (data.status === 'Completed') {
      await prisma.vehicle.update({
        where: { id: updated.vehicleId },
        data: { status: 'Active' },
      });
    }

    await auditService.log({
      action: 'UPDATE_MAINTENANCE',
      tableName: 'VehicleMaintenance',
      recordId: id.toString(),
      oldValue: current,
      newValue: updated,
      userId,
    });

    return updated;
  }

  async getFuelLogs(vehicleId?: number) {
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    return prisma.vehicleFuelLog.findMany({
      where,
      include: { vehicle: true },
      orderBy: { fillDate: 'desc' },
    });
  }

  async createFuelLog(data: any) {
    return prisma.vehicleFuelLog.create({
      data: {
        vehicleId: parseInt(data.vehicleId, 10),
        fuelQuantity: parseFloat(data.fuelQuantity),
        cost: parseFloat(data.cost),
        odometerReading: parseFloat(data.odometerReading),
        remarks: data.remarks || null,
      },
    });
  }

  async getTrips() {
    return prisma.vehicleTrip.findMany({
      include: {
        vehicle: true,
        driver: true,
        route: true,
      },
      orderBy: { tripDate: 'desc' },
    });
  }

  async createTrip(data: any) {
    return prisma.vehicleTrip.create({
      data: {
        vehicleId: parseInt(data.vehicleId, 10),
        driverId: parseInt(data.driverId, 10),
        routeId: parseInt(data.routeId, 10),
        tripDate: data.tripDate ? new Date(data.tripDate) : new Date(),
        status: data.status || 'Completed',
        startOdometer: data.startOdometer ? parseFloat(data.startOdometer) : null,
        endOdometer: data.endOdometer ? parseFloat(data.endOdometer) : null,
        notes: data.notes || null,
      },
    });
  }

  // =========================================================================
  // ANALYTICS & MONITORING
  // =========================================================================
  async getTransportAnalytics() {
    const totalRoutes = await prisma.transportRoute.count();
    const totalVehicles = await prisma.vehicle.count();
    const totalDrivers = await prisma.driver.count();

    const activeVehicles = await prisma.vehicle.count({ where: { status: 'Active' } });
    const inMaintenance = await prisma.vehicle.count({ where: { status: 'Maintenance' } });

    const totalStudentsRegistered = await prisma.transportRegistration.count({
      where: { studentId: { not: null }, transportStatus: 'Active' },
    });
    const totalEmployeesRegistered = await prisma.transportRegistration.count({
      where: { employeeId: { not: null }, transportStatus: 'Active' },
    });

    // Seating capacities sum
    const seatSummary = await prisma.vehicle.aggregate({
      _sum: { seatingCapacity: true },
    });
    const totalCapacity = seatSummary._sum.seatingCapacity || 0;

    // Financial summaries
    const fuelSummary = await prisma.vehicleFuelLog.aggregate({
      _sum: { cost: true },
    });
    const totalFuelCost = fuelSummary._sum.cost || 0;

    const maintenanceSummary = await prisma.vehicleMaintenance.aggregate({
      _sum: { maintenanceCost: true },
    });
    const totalMaintenanceCost = maintenanceSummary._sum.maintenanceCost || 0;

    // Get current/recent attendances
    const recentAttendances = await prisma.transportAttendance.findMany({
      take: 10,
      orderBy: { scanTime: 'desc' },
      include: {
        registration: {
          include: {
            student: true,
            employee: true,
            route: true,
          },
        },
      },
    });

    // Expiry warnings
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringLicenses = await prisma.driver.findMany({
      where: { licenseExpiry: { lte: thirtyDaysFromNow } },
      select: { id: true, fullName: true, licenseExpiry: true },
    });

    const expiringInsurances = await prisma.vehicle.findMany({
      where: { insuranceExpiry: { lte: thirtyDaysFromNow } },
      select: { id: true, vehicleNumber: true, insuranceExpiry: true },
    });

    // Routes with booking occupancy distribution
    const routes = await prisma.transportRoute.findMany({
      include: {
        registrations: {
          where: { transportStatus: 'Active' },
        },
        trips: {
          include: { vehicle: true },
        },
      },
    });

    const routeOccupancy = routes.map((r) => {
      let routeCap = 50;
      if (r.trips && r.trips.length > 0) {
        const uniqueVehicles = new Map();
        r.trips.forEach((t) => {
          if (t.vehicle) uniqueVehicles.set(t.vehicle.id, t.vehicle.seatingCapacity);
        });
        if (uniqueVehicles.size > 0) {
          routeCap = Array.from(uniqueVehicles.values()).reduce((a, b) => a + b, 0);
        }
      }
      return {
        id: r.id,
        routeName: r.routeName,
        routeCode: r.routeCode,
        bookings: r.registrations.length,
        capacity: routeCap,
        utilization: routeCap > 0 ? Math.round((r.registrations.length / routeCap) * 100) : 0,
      };
    });

    return {
      totals: {
        routes: totalRoutes,
        vehicles: totalVehicles,
        drivers: totalDrivers,
        activeVehicles,
        inMaintenance,
        totalCapacity,
        registeredPassengers: totalStudentsRegistered + totalEmployeesRegistered,
        registeredStudents: totalStudentsRegistered,
        registeredEmployees: totalEmployeesRegistered,
      },
      expenses: {
        totalFuel: totalFuelCost,
        totalMaintenance: totalMaintenanceCost,
        aggregateExpense: totalFuelCost + totalMaintenanceCost,
      },
      warnings: {
        expiringLicenses,
        expiringInsurances,
      },
      routeOccupancy,
      recentAttendances,
    };
  }
}

export const transportService = new TransportService();
export default transportService;
