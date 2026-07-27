import { Request, Response } from 'express';
import { ProcurementService } from '../services/procurement.service';
import {
  createVendorSchema,
  updateVendorSchema,
  createInventoryItemSchema,
  updateInventoryItemSchema,
  transferStockSchema,
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  createGRNSchema,
  createAssetSchema,
  updateAssetSchema,
  assignAssetSchema,
  scheduleMaintenanceSchema,
} from '../validators/procurement.validators';

const getUserEmail = (req: Request): string => {
  return (req as any).user?.email || 'system@smartuni.edu';
};

// --- Vendors ---
export const getVendors = async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const vendors = await ProcurementService.getVendors({
      search: search as string,
      status: status as string,
    });
    res.json({ success: true, data: vendors });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createVendor = async (req: Request, res: Response) => {
  try {
    const parsed = createVendorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }
    const vendor = await ProcurementService.createVendor(parsed.data, getUserEmail(req));
    res.status(201).json({ success: true, data: vendor });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateVendor = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid vendor ID' });

    const parsed = updateVendorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }
    const vendor = await ProcurementService.updateVendor(id, parsed.data, getUserEmail(req));
    res.json({ success: true, data: vendor });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteVendor = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid vendor ID' });

    await ProcurementService.deleteVendor(id, getUserEmail(req));
    res.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Inventory ---
export const getInventory = async (req: Request, res: Response) => {
  try {
    const { search, category, warehouse, lowStockOnly } = req.query;
    const items = await ProcurementService.getInventory({
      search: search as string,
      category: category as string,
      warehouse: warehouse as string,
      lowStockOnly: lowStockOnly === 'true',
    });
    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createInventoryItem = async (req: Request, res: Response) => {
  try {
    const parsed = createInventoryItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }
    const item = await ProcurementService.createInventoryItem(parsed.data, getUserEmail(req));
    res.status(201).json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateInventoryItem = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid inventory item ID' });

    const parsed = updateInventoryItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }
    const item = await ProcurementService.updateInventoryItem(id, parsed.data, getUserEmail(req));
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const transferStock = async (req: Request, res: Response) => {
  try {
    const parsed = transferStockSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }
    const result = await ProcurementService.transferStock(parsed.data, getUserEmail(req));
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Purchase Orders ---
export const getPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const orders = await ProcurementService.getPurchaseOrders({
      search: search as string,
      status: status as string,
    });
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const parsed = createPurchaseOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }
    const po = await ProcurementService.createPurchaseOrder(parsed.data, getUserEmail(req));
    res.status(201).json({ success: true, data: po });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid PO ID' });

    const parsed = updatePurchaseOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }
    const po = await ProcurementService.updatePurchaseOrder(
      id,
      {
        status: parsed.data.status,
        approvedBy: parsed.data.status === 'Approved' ? getUserEmail(req) : undefined,
      },
      getUserEmail(req)
    );
    res.json({ success: true, data: po });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- GRN ---
export const createGRN = async (req: Request, res: Response) => {
  try {
    const parsed = createGRNSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }
    const grn = await ProcurementService.createGRN(parsed.data, getUserEmail(req));
    res.status(201).json({ success: true, data: grn });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Assets ---
export const getAssets = async (req: Request, res: Response) => {
  try {
    const { search, category, status } = req.query;
    const assets = await ProcurementService.getAssets({
      search: search as string,
      category: category as string,
      status: status as string,
    });
    res.json({ success: true, data: assets });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createAsset = async (req: Request, res: Response) => {
  try {
    const parsed = createAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }
    const asset = await ProcurementService.createAsset(parsed.data, getUserEmail(req));
    res.status(201).json({ success: true, data: asset });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAsset = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid asset ID' });

    const parsed = updateAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }
    const asset = await ProcurementService.updateAsset(id, parsed.data, getUserEmail(req));
    res.json({ success: true, data: asset });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const assignAsset = async (req: Request, res: Response) => {
  try {
    const parsed = assignAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }
    const asset = await ProcurementService.assignAsset(parsed.data, getUserEmail(req));
    res.json({ success: true, data: asset });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const scheduleMaintenance = async (req: Request, res: Response) => {
  try {
    const parsed = scheduleMaintenanceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }
    const maintenance = await ProcurementService.scheduleMaintenance(parsed.data, getUserEmail(req));
    res.json({ success: true, data: maintenance });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Dashboard ---
export const getProcurementDashboard = async (req: Request, res: Response) => {
  try {
    const dashboardData = await ProcurementService.getProcurementDashboardData();
    res.json({ success: true, data: dashboardData });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
