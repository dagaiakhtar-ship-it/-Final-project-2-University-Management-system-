import { Router } from 'express';
import { mdmController } from '../controllers/mdm.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Device Inventory & Management
router.get('/devices', authenticate, (req, res) => mdmController.getDevices(req, res));
router.post('/devices', authenticate, (req, res) => mdmController.enrollDevice(req, res));
router.put('/devices/:id', authenticate, (req, res) => mdmController.updateDevice(req, res));

// Device Security Policies
router.get('/policies', authenticate, (req, res) => mdmController.getPolicies(req, res));
router.post('/policies', authenticate, (req, res) => mdmController.createPolicy(req, res));

// Remote Administration Commands
router.post('/commands', authenticate, (req, res) => mdmController.runCommand(req, res));

// Applications Management
router.get('/apps', authenticate, (req, res) => mdmController.getApps(req, res));
router.post('/apps', authenticate, (req, res) => mdmController.deployApp(req, res));

export default router;
