import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  transferStock,
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  createGRN,
  getAssets,
  createAsset,
  updateAsset,
  assignAsset,
  scheduleMaintenance,
  getProcurementDashboard,
} from '../controllers/procurement.controller';

export const procurementRouter = Router();

// Secure all procurement routes with authentication
procurementRouter.use(authenticate);

// --- Dashboard ---
procurementRouter.get(
  '/dashboard',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  getProcurementDashboard
);

// --- Vendors ---
procurementRouter.get(
  '/vendors',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  getVendors
);

procurementRouter.post(
  '/vendors',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  createVendor
);

procurementRouter.put(
  '/vendors/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  updateVendor
);

procurementRouter.delete(
  '/vendors/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  deleteVendor
);

// --- Inventory ---
procurementRouter.get(
  '/inventory',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  getInventory
);

procurementRouter.post(
  '/inventory',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  createInventoryItem
);

procurementRouter.put(
  '/inventory/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  updateInventoryItem
);

procurementRouter.post(
  '/stock-transfer',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  transferStock
);

// --- Purchase Orders ---
procurementRouter.get(
  '/purchase-orders',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  getPurchaseOrders
);

procurementRouter.post(
  '/purchase-orders',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']),
  createPurchaseOrder
);

procurementRouter.put(
  '/purchase-orders/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  updatePurchaseOrder
);

// --- GRN ---
procurementRouter.post(
  '/grn',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  createGRN
);

// --- Assets ---
procurementRouter.get(
  '/assets',
  requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']),
  getAssets
);

procurementRouter.post(
  '/assets',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  createAsset
);

procurementRouter.put(
  '/assets/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  updateAsset
);

procurementRouter.post(
  '/assets/assign',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  assignAsset
);

procurementRouter.post(
  '/assets/maintenance',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  scheduleMaintenance
);
