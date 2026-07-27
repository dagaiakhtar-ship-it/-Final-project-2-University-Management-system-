import { z } from 'zod';

const noHtmlRefine = (val: string) => !/<[^>]*>/g.test(val);
const noHtmlMessage = 'HTML tags or script elements are not allowed';

export const createVendorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200).trim().refine(noHtmlRefine, noHtmlMessage),
  contactPerson: z.string().min(1, 'Contact person is required').max(150).trim().refine(noHtmlRefine, noHtmlMessage),
  email: z.string().email('Invalid email address').max(100),
  phone: z.string().min(1, 'Phone number is required').max(30).trim().refine(noHtmlRefine, noHtmlMessage),
  taxNumber: z.string().max(100).trim().refine(noHtmlRefine, noHtmlMessage).optional().nullable(),
  address: z.string().max(500).trim().refine(noHtmlRefine, noHtmlMessage).optional().nullable(),
  paymentTerms: z.string().max(100).trim().refine(noHtmlRefine, noHtmlMessage).optional().nullable(),
  status: z.enum(['Active', 'Suspended', 'Blacklisted']).optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

export const createInventoryItemSchema = z.object({
  itemName: z.string().min(1, 'Item name is required').max(200).trim().refine(noHtmlRefine, noHtmlMessage),
  description: z.string().max(500).trim().refine(noHtmlRefine, noHtmlMessage).optional().nullable(),
  category: z.string().min(1, 'Category is required').max(100).trim().refine(noHtmlRefine, noHtmlMessage),
  warehouse: z.string().min(1, 'Warehouse is required').max(100).trim().refine(noHtmlRefine, noHtmlMessage),
  unit: z.string().max(30).trim().refine(noHtmlRefine, noHtmlMessage).optional(),
  minimumStock: z.number().min(0).max(100000).optional(),
  maximumStock: z.number().min(0).max(1000000).optional(),
  availableStock: z.number().min(0).max(1000000).optional(),
  reorderLevel: z.number().min(0).max(100000).optional(),
  purchasePrice: z.number().min(0).max(10000000).optional(),
  sellingPrice: z.number().min(0).max(10000000).optional(),
  supplierId: z.number().optional().nullable(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export const transferStockSchema = z.object({
  itemId: z.number({ message: 'Item ID is required' }),
  fromWarehouse: z.string().min(1, 'Source warehouse is required').trim().refine(noHtmlRefine, noHtmlMessage),
  toWarehouse: z.string().min(1, 'Destination warehouse is required').trim().refine(noHtmlRefine, noHtmlMessage),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
});

export const createPurchaseOrderSchema = z.object({
  vendorId: z.number({ message: 'Vendor ID is required' }),
  expectedDelivery: z.string().optional(),
  items: z.array(
    z.object({
      itemCode: z.string().min(1, 'Item code is required').trim().refine(noHtmlRefine, noHtmlMessage),
      itemName: z.string().min(1, 'Item name is required').trim().refine(noHtmlRefine, noHtmlMessage),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      unitPrice: z.number().min(0.01, 'Unit price must be positive'),
    })
  ).min(1, 'At least one order item is required'),
});

export const updatePurchaseOrderSchema = z.object({
  status: z.enum(['Draft', 'Pending', 'Approved', 'Ordered', 'Partially Received', 'Completed', 'Cancelled']),
});

export const createGRNSchema = z.object({
  purchaseOrderId: z.number({ message: 'Purchase Order ID is required' }),
  remarks: z.string().max(500).trim().refine(noHtmlRefine, noHtmlMessage).optional(),
  items: z.array(
    z.object({
      itemId: z.number(),
      itemCode: z.string().min(1, 'Item code is required'),
      receivedQuantity: z.number().min(0),
      warehouse: z.string().min(1, 'Warehouse is required'),
    })
  ).min(1, 'At least one received item is required'),
});

export const createAssetSchema = z.object({
  assetName: z.string().min(1, 'Asset name is required').max(200).trim().refine(noHtmlRefine, noHtmlMessage),
  category: z.string().min(1, 'Category is required').max(100).trim().refine(noHtmlRefine, noHtmlMessage),
  serialNumber: z.string().max(100).trim().refine(noHtmlRefine, noHtmlMessage).optional().nullable(),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  purchaseCost: z.number().min(0.01, 'Purchase cost must be greater than 0'),
  depreciationMethod: z.enum(['StraightLine', 'DecliningBalance']).optional(),
  location: z.string().max(200).trim().refine(noHtmlRefine, noHtmlMessage).optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
});

export const updateAssetSchema = createAssetSchema.partial().extend({
  status: z.enum(['Available', 'Assigned', 'Under Maintenance', 'Retired', 'Disposed']).optional(),
});

export const assignAssetSchema = z.object({
  assetId: z.number({ message: 'Asset ID is required' }),
  assignedTo: z.string().min(1, 'Assigned user/dept is required').trim().refine(noHtmlRefine, noHtmlMessage),
  assignedType: z.enum(['Staff', 'Department', 'Student']),
  remarks: z.string().max(500).trim().refine(noHtmlRefine, noHtmlMessage).optional(),
});

export const scheduleMaintenanceSchema = z.object({
  assetId: z.number({ message: 'Asset ID is required' }),
  description: z.string().min(1, 'Description is required').max(1000).trim().refine(noHtmlRefine, noHtmlMessage),
  maintenanceDate: z.string().min(1, 'Maintenance date is required'),
  performedBy: z.string().min(1, 'Service personnel is required').trim().refine(noHtmlRefine, noHtmlMessage),
});
