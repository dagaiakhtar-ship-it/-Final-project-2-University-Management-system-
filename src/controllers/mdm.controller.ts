import { Request, Response } from 'express';
import { prisma } from '../services/db.service';

/**
 * Controller for Enterprise Mobile Device Management (MDM), Remote Administration & Kiosk Platform.
 */
export class MdmController {
  
  /**
   * Auto-seed helper to ensure there is high-fidelity demo data for evaluation.
   */
  private static async ensureInitialSeed() {
    try {
      const policyCount = await prisma.devicePolicy.count();
      if (policyCount === 0) {
        // Create default policies
        const p1 = await prisma.devicePolicy.create({
          data: {
            policyName: 'Standard Student Kiosk Policy',
            description: 'Strict kiosk mode for public self-service kiosks. Restricts camera, screenshots, and locks down to a single designated app.',
            passcodeRequired: true,
            encryptionRequired: true,
            cameraAllowed: false,
            screenshotAllowed: false,
            kioskMode: true,
            kioskApp: 'Campus Portal'
          }
        });

        const p2 = await prisma.devicePolicy.create({
          data: {
            policyName: 'Faculty Secure Policy',
            description: 'Security rules for staff iPads and work laptops. Enables full remote-wipe capability and mandates local storage encryption.',
            passcodeRequired: true,
            encryptionRequired: true,
            cameraAllowed: true,
            screenshotAllowed: true,
            kioskMode: false,
            kioskApp: null
          }
        });

        const p3 = await prisma.devicePolicy.create({
          data: {
            policyName: 'Examination Isolation Policy',
            description: 'Ultra-secure temporary policy used during midterms/finals. Disables all background communications, screenshots, and cameras.',
            passcodeRequired: true,
            encryptionRequired: true,
            cameraAllowed: false,
            screenshotAllowed: false,
            kioskMode: true,
            kioskApp: 'ExamShield v2.4'
          }
        });

        const p4 = await prisma.devicePolicy.create({
          data: {
            policyName: 'Library Digital Signage Policy',
            description: 'Allows continuous public screen rotation of campus updates. Disables screenshot, camera, and user inputs.',
            passcodeRequired: false,
            encryptionRequired: false,
            cameraAllowed: false,
            screenshotAllowed: false,
            kioskMode: true,
            kioskApp: 'Library Signage'
          }
        });

        // Seed initial devices
        const d1 = await prisma.managedDevice.create({
          data: {
            deviceName: 'Library Kiosk Tablet 01',
            platform: 'Android',
            manufacturer: 'Samsung',
            model: 'Galaxy Tab S9',
            osVersion: 'Android 14',
            serialNumber: 'SN-SAMSUNG-TAB-9901A',
            imei: 'IMEI-354921-08-111002-1',
            ownerId: null,
            departmentId: 1, // General Administration / Library
            status: 'Enrolled',
            batteryLevel: 94,
            lastSeen: new Date(),
            policyId: p1.id,
            applications: {
              create: [
                { applicationName: 'Campus Portal', version: 'v3.2.1', installed: true },
                { applicationName: 'Library Catalog', version: 'v1.4.0', installed: true },
                { applicationName: 'Student Survey Client', version: 'v1.0.2', installed: false }
              ]
            }
          }
        });

        const d2 = await prisma.managedDevice.create({
          data: {
            deviceName: 'Dean Academic iPad Pro',
            platform: 'iOS',
            manufacturer: 'Apple',
            model: 'iPad Pro M4',
            osVersion: 'iPadOS 17.5',
            serialNumber: 'SN-APPLE-IPAD-2026X',
            imei: 'IMEI-492041-09-224411-9',
            ownerId: 2, // Academic Head / Dean
            departmentId: 2, // Academic Affairs
            status: 'Enrolled',
            batteryLevel: 82,
            lastSeen: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4h ago
            policyId: p2.id,
            applications: {
              create: [
                { applicationName: 'Campus Portal', version: 'v3.2.1', installed: true },
                { applicationName: 'Academic Dashboard', version: 'v2.1.0', installed: true },
                { applicationName: 'Google Drive', version: 'v5.88.1', installed: true }
              ]
            }
          }
        });

        const d3 = await prisma.managedDevice.create({
          data: {
            deviceName: 'Exam Lab PC 12',
            platform: 'Windows',
            manufacturer: 'Dell',
            model: 'OptiPlex Micro 7010',
            osVersion: 'Windows 11 Enterprise',
            serialNumber: 'SN-DELL-OPT-77881',
            imei: null,
            ownerId: null,
            departmentId: 2,
            status: 'Enrolled',
            batteryLevel: 100, // Plugged in
            lastSeen: new Date(),
            policyId: p3.id,
            applications: {
              create: [
                { applicationName: 'ExamShield v2.4', version: 'v2.4.0', installed: true },
                { applicationName: 'Chrome Enterprise', version: 'v124.0', installed: true }
              ]
            }
          }
        });

        const d4 = await prisma.managedDevice.create({
          data: {
            deviceName: 'Lost Faculty MacBook Air',
            platform: 'macOS',
            manufacturer: 'Apple',
            model: 'MacBook Air M3',
            osVersion: 'macOS 14.2 Sonoma',
            serialNumber: 'SN-APPLE-MBA-77112',
            imei: null,
            ownerId: 3,
            departmentId: 3,
            status: 'Blocked', // Blocked because it is lost
            batteryLevel: 12,
            lastSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            policyId: p2.id,
            applications: {
              create: [
                { applicationName: 'Campus Portal', version: 'v3.2.1', installed: true },
                { applicationName: 'Slack', version: 'v4.38.1', installed: true }
              ]
            }
          }
        });

        // Create some initial audit logs and commands
        await prisma.deviceCommand.createMany({
          data: [
            { deviceId: d1.id, command: 'Sync', status: 'Executed', executedAt: new Date() },
            { deviceId: d2.id, command: 'Lock', status: 'Executed', executedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            { deviceId: d4.id, command: 'Wipe', status: 'Pending', executedAt: null }
          ]
        });

        await prisma.auditEvent.createMany({
          data: [
            { module: 'MDM', entityType: 'ManagedDevice', entityId: String(d1.id), action: 'Device Enrolled', performedBy: 'system@smartcampus.edu' },
            { module: 'MDM', entityType: 'ManagedDevice', entityId: String(d2.id), action: 'Device Enrolled', performedBy: 'system@smartcampus.edu' },
            { module: 'MDM', entityType: 'ManagedDevice', entityId: String(d4.id), action: 'Device Locked', performedBy: 'security-admin@smartcampus.edu' }
          ]
        });
      }
    } catch (err) {
      console.error('[MDM Auto Seed Fail]:', err);
    }
  }

  /**
   * GET /api/mdm/devices
   */
  async getDevices(req: Request, res: Response): Promise<void> {
    try {
      await MdmController.ensureInitialSeed();

      const userRole = req.user?.role;
      const userId = req.user?.userId;

      // Build RBAC queries
      let whereClause: any = {};

      if (userRole === 'STUDENT') {
        // Students can only view their assigned devices
        whereClause.ownerId = userId;
      } else if (userRole === 'TEACHER') {
        // Faculty can only view devices assigned to them
        whereClause.ownerId = userId;
      } else if (userRole === 'LIBRARIAN') {
        // Librarians can only manage Library kiosks / platform devices (e.g. departmentId = 1)
        whereClause.departmentId = 1;
      }

      const devices = await prisma.managedDevice.findMany({
        where: whereClause,
        include: {
          policy: true,
          commands: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          applications: true
        },
        orderBy: { lastSeen: 'desc' }
      });

      res.status(200).json(devices);
    } catch (error: any) {
      console.error('[MDM] getDevices error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  /**
   * POST /api/mdm/devices
   */
  async enrollDevice(req: Request, res: Response): Promise<void> {
    try {
      const { deviceName, platform, manufacturer, model, osVersion, serialNumber, imei, ownerId, departmentId, policyId } = req.body;

      if (!deviceName || !platform || !serialNumber) {
        res.status(400).json({ error: 'Device name, platform and serial number are mandatory.' });
        return;
      }

      // Check serial number uniqueness
      const existing = await prisma.managedDevice.findUnique({
        where: { serialNumber }
      });

      if (existing) {
        res.status(400).json({ error: `A device with Serial Number "${serialNumber}" is already registered.` });
        return;
      }

      const device = await prisma.managedDevice.create({
        data: {
          deviceName,
          platform,
          manufacturer: manufacturer || 'Unknown',
          model: model || 'Generic Model',
          osVersion: osVersion || 'Generic OS',
          serialNumber,
          imei: imei || null,
          ownerId: ownerId ? Number(ownerId) : null,
          departmentId: departmentId ? Number(departmentId) : null,
          policyId: policyId ? Number(policyId) : null,
          status: 'Enrolled',
          batteryLevel: Math.floor(Math.random() * 40) + 60, // random start battery level
          lastSeen: new Date(),
          applications: {
            create: [
              { applicationName: 'Campus Portal', version: 'v3.2.1', installed: true },
              { applicationName: 'Remote Security Daemon', version: 'v1.0.0', installed: true }
            ]
          }
        },
        include: {
          policy: true,
          applications: true
        }
      });

      // Audit Log
      await prisma.auditEvent.create({
        data: {
          module: 'MDM',
          entityType: 'ManagedDevice',
          entityId: String(device.id),
          action: 'Device Enrolled',
          performedBy: req.user?.email || 'admin@smartcampus.edu',
          newValue: JSON.stringify({ deviceName, platform, serialNumber })
        }
      });

      // Emit Live Webhook/Websocket simulator update
      const io = req.app.get('socketio');
      if (io) {
        io.emit('mdm_device_enrolled', device);
      }

      res.status(201).json(device);
    } catch (error: any) {
      console.error('[MDM] enrollDevice error:', error);
      res.status(500).json({ error: error.message || 'Failed to enroll device.' });
    }
  }

  /**
   * PUT /api/mdm/devices/:id
   */
  async updateDevice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { deviceName, status, policyId, batteryLevel } = req.body;

      const deviceIdInt = Number(id);
      if (isNaN(deviceIdInt)) {
        res.status(400).json({ error: 'Invalid device identifier.' });
        return;
      }

      const existing = await prisma.managedDevice.findUnique({
        where: { id: deviceIdInt }
      });

      if (!existing) {
        res.status(404).json({ error: 'Device not found.' });
        return;
      }

      const updated = await prisma.managedDevice.update({
        where: { id: deviceIdInt },
        data: {
          deviceName: deviceName !== undefined ? deviceName : undefined,
          status: status !== undefined ? status : undefined,
          policyId: policyId !== undefined ? (policyId ? Number(policyId) : null) : undefined,
          batteryLevel: batteryLevel !== undefined ? Number(batteryLevel) : undefined,
          lastSeen: new Date()
        },
        include: {
          policy: true,
          commands: true,
          applications: true
        }
      });

      // Audit Log for policy mapping/updates
      if (policyId !== undefined) {
        await prisma.auditEvent.create({
          data: {
            module: 'MDM',
            entityType: 'ManagedDevice',
            entityId: String(updated.id),
            action: 'Policy Applied',
            performedBy: req.user?.email || 'admin@smartcampus.edu',
            oldValue: String(existing.policyId),
            newValue: String(policyId)
          }
        });
      }

      if (status !== undefined && status !== existing.status) {
        await prisma.auditEvent.create({
          data: {
            module: 'MDM',
            entityType: 'ManagedDevice',
            entityId: String(updated.id),
            action: status === 'Blocked' ? 'Device Locked' : status === 'Retired' ? 'Device Removed' : 'Device Status Updated',
            performedBy: req.user?.email || 'admin@smartcampus.edu',
            oldValue: existing.status,
            newValue: status
          }
        });
      }

      // Live Socket push
      const io = req.app.get('socketio');
      if (io) {
        io.emit('mdm_device_updated', updated);
      }

      res.status(200).json(updated);
    } catch (error: any) {
      console.error('[MDM] updateDevice error:', error);
      res.status(500).json({ error: error.message || 'Failed to update device.' });
    }
  }

  /**
   * GET /api/mdm/policies
   */
  async getPolicies(req: Request, res: Response): Promise<void> {
    try {
      await MdmController.ensureInitialSeed();

      const policies = await prisma.devicePolicy.findMany({
        include: {
          _count: {
            select: { devices: true }
          }
        },
        orderBy: { id: 'asc' }
      });

      res.status(200).json(policies);
    } catch (error: any) {
      console.error('[MDM] getPolicies error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch policies.' });
    }
  }

  /**
   * POST /api/mdm/policies
   */
  async createPolicy(req: Request, res: Response): Promise<void> {
    try {
      const { policyName, description, passcodeRequired, encryptionRequired, cameraAllowed, screenshotAllowed, kioskMode, kioskApp } = req.body;

      if (!policyName) {
        res.status(400).json({ error: 'Policy name is required.' });
        return;
      }

      const policy = await prisma.devicePolicy.create({
        data: {
          policyName,
          description: description || null,
          passcodeRequired: Boolean(passcodeRequired),
          encryptionRequired: Boolean(encryptionRequired),
          cameraAllowed: cameraAllowed !== undefined ? Boolean(cameraAllowed) : true,
          screenshotAllowed: screenshotAllowed !== undefined ? Boolean(screenshotAllowed) : true,
          kioskMode: Boolean(kioskMode),
          kioskApp: kioskApp || null
        }
      });

      res.status(201).json(policy);
    } catch (error: any) {
      console.error('[MDM] createPolicy error:', error);
      res.status(500).json({ error: error.message || 'Failed to create policy.' });
    }
  }

  /**
   * POST /api/mdm/commands
   */
  async runCommand(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId, command } = req.body;

      if (!deviceId || !command) {
        res.status(400).json({ error: 'Device ID and command type are required.' });
        return;
      }

      const devIdInt = Number(deviceId);
      const dev = await prisma.managedDevice.findUnique({
        where: { id: devIdInt }
      });

      if (!dev) {
        res.status(404).json({ error: 'Target device not found.' });
        return;
      }

      // Create command queue log entry
      const cmdRecord = await prisma.deviceCommand.create({
        data: {
          deviceId: devIdInt,
          command,
          status: 'Executed', // Fast executions in simulated/kiosk environment
          executedAt: new Date()
        }
      });

      // Special side-effects based on command
      let statusToUpdate: string | undefined = undefined;
      let batteryDelta: number | undefined = undefined;

      if (command === 'Wipe') {
        statusToUpdate = 'Retired';
      } else if (command === 'Lock') {
        statusToUpdate = 'Blocked';
      } else if (command === 'Unlock') {
        statusToUpdate = 'Enrolled';
      } else if (command === 'Restart') {
        batteryDelta = Math.max(10, dev.batteryLevel - 3); // minimal usage battery consumption simulation
      }

      // Apply changes to target device
      const updatedDevice = await prisma.managedDevice.update({
        where: { id: devIdInt },
        data: {
          status: statusToUpdate,
          batteryLevel: batteryDelta,
          lastSeen: new Date()
        },
        include: {
          policy: true,
          commands: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          applications: true
        }
      });

      // Record Audit Logs
      await prisma.auditEvent.create({
        data: {
          module: 'MDM',
          entityType: 'ManagedDevice',
          entityId: String(updatedDevice.id),
          action: command === 'Wipe' ? 'Device Wiped' : command === 'Lock' ? 'Device Locked' : 'Remote Command Executed',
          performedBy: req.user?.email || 'admin@smartcampus.edu',
          newValue: `Command: ${command}`
        }
      });

      // Emit Live updates through socket
      const io = req.app.get('socketio');
      if (io) {
        io.emit('mdm_command_executed', { command: cmdRecord, device: updatedDevice });
      }

      res.status(201).json({
        message: `Command "${command}" dispatch handshake accepted.`,
        command: cmdRecord,
        device: updatedDevice
      });
    } catch (error: any) {
      console.error('[MDM] runCommand error:', error);
      res.status(500).json({ error: error.message || 'Remote execution failed.' });
    }
  }

  /**
   * GET /api/mdm/apps
   */
  async getApps(req: Request, res: Response): Promise<void> {
    try {
      const apps = await prisma.deviceApplication.findMany({
        distinct: ['applicationName'],
        select: {
          applicationName: true,
          version: true,
          installed: true
        }
      });

      res.status(200).json(apps);
    } catch (error: any) {
      console.error('[MDM] getApps error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch MDM applications list.' });
    }
  }

  /**
   * POST /api/mdm/apps
   */
  async deployApp(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId, applicationName, version, installed } = req.body;

      if (!deviceId || !applicationName || !version) {
        res.status(400).json({ error: 'Device Id, application name, and version are mandatory.' });
        return;
      }

      const devIdInt = Number(deviceId);
      const appRecord = await prisma.deviceApplication.create({
        data: {
          deviceId: devIdInt,
          applicationName,
          version,
          installed: installed !== undefined ? Boolean(installed) : true
        }
      });

      // Audit Log
      await prisma.auditEvent.create({
        data: {
          module: 'MDM',
          entityType: 'ManagedDevice',
          entityId: String(devIdInt),
          action: 'App Deployed',
          performedBy: req.user?.email || 'admin@smartcampus.edu',
          newValue: `${applicationName} (${version})`
        }
      });

      res.status(201).json(appRecord);
    } catch (error: any) {
      console.error('[MDM] deployApp error:', error);
      res.status(500).json({ error: error.message || 'App deployment dispatch failed.' });
    }
  }
}

export const mdmController = new MdmController();
