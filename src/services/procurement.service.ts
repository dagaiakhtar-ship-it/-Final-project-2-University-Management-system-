import { prisma } from './db.service';
import { notifyProcurementChange } from './socket.service';
import { auditService } from './audit.service';

export class ProcurementService {
  // --- Vendor Management ---
  static async getVendors(filters: { search?: string; status?: string }) {
    const where: any = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { vendorCode: { contains: filters.search, mode: 'insensitive' } },
        { contactPerson: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return prisma.vendor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createVendor(data: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    taxNumber?: string | null;
    address?: string | null;
    paymentTerms?: string | null;
    status?: string;
  }, userEmail: string) {
    // Check duplicate email or company name
    const existing = await prisma.vendor.findFirst({
      where: {
        OR: [
          { companyName: { equals: data.companyName, mode: 'insensitive' } },
          { email: { equals: data.email, mode: 'insensitive' } },
        ],
      },
    });
    if (existing) {
      if (existing.companyName.toLowerCase() === data.companyName.toLowerCase()) {
        throw new Error(`Vendor with company name "${data.companyName}" already exists`);
      }
      throw new Error(`Vendor with email "${data.email}" already exists`);
    }

    const count = await prisma.vendor.count();
    const vendorCode = `VND-${String(count + 1).padStart(4, '0')}`;

    const vendor = await prisma.vendor.create({
      data: {
        vendorCode,
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        taxNumber: data.taxNumber,
        address: data.address,
        paymentTerms: data.paymentTerms,
        status: data.status || 'Active',
      },
    });

    await auditService.log({
      action: 'VENDOR_CREATED',
      tableName: 'Vendor',
      recordId: String(vendor.id),
      newValue: { name: vendor.companyName, code: vendor.vendorCode, email: userEmail },
    });

    notifyProcurementChange('VENDOR_ADDED', { vendor });

    return vendor;
  }

  static async updateVendor(id: number, data: any, userEmail: string) {
    // Check duplicate on update
    if (data.companyName || data.email) {
      const orConditions: any[] = [];
      if (data.companyName) {
        orConditions.push({ companyName: { equals: data.companyName, mode: 'insensitive' as const } });
      }
      if (data.email) {
        orConditions.push({ email: { equals: data.email, mode: 'insensitive' as const } });
      }

      if (orConditions.length > 0) {
        const existing = await prisma.vendor.findFirst({
          where: {
            id: { not: id },
            OR: orConditions,
          },
        });
        if (existing) {
          if (data.companyName && existing.companyName.toLowerCase() === data.companyName.toLowerCase()) {
            throw new Error(`Another vendor with company name "${data.companyName}" already exists`);
          }
          throw new Error(`Another vendor with email "${data.email}" already exists`);
        }
      }
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data,
    });

    await auditService.log({
      action: 'VENDOR_UPDATED',
      tableName: 'Vendor',
      recordId: String(vendor.id),
      newValue: { name: vendor.companyName, code: vendor.vendorCode, email: userEmail },
    });

    return vendor;
  }

  static async deleteVendor(id: number, userEmail: string) {
    const vendor = await prisma.vendor.delete({
      where: { id },
    });

    await auditService.log({
      action: 'VENDOR_DELETED',
      tableName: 'Vendor',
      recordId: String(vendor.id),
      oldValue: { name: vendor.companyName, code: vendor.vendorCode, email: userEmail },
    });

    return vendor;
  }

  // --- Inventory Management ---
  static async getInventory(filters: { search?: string; category?: string; warehouse?: string; lowStockOnly?: boolean }) {
    const where: any = {};
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.warehouse) {
      where.warehouse = filters.warehouse;
    }
    if (filters.search) {
      where.OR = [
        { itemName: { contains: filters.search, mode: 'insensitive' } },
        { itemCode: { contains: filters.search, mode: 'insensitive' } },
        { barcode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        supplier: {
          select: { companyName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (filters.lowStockOnly) {
      return items.filter(item => item.availableStock <= item.reorderLevel);
    }

    return items;
  }

  static async createInventoryItem(data: {
    itemName: string;
    description?: string | null;
    category: string;
    warehouse: string;
    unit?: string;
    minimumStock?: number;
    maximumStock?: number;
    availableStock?: number;
    reorderLevel?: number;
    purchasePrice?: number;
    sellingPrice?: number;
    supplierId?: number | null;
  }, userEmail: string) {
    const count = await prisma.inventoryItem.count();
    const itemCode = `ITM-${String(count + 1).padStart(5, '0')}`;
    const barcode = `BAR-${itemCode}`;
    const qrCode = `QR-${itemCode}`;

    const item = await prisma.inventoryItem.create({
      data: {
        itemCode,
        barcode,
        qrCode,
        itemName: data.itemName,
        description: data.description,
        category: data.category,
        warehouse: data.warehouse,
        unit: data.unit || 'Pcs',
        minimumStock: data.minimumStock || 0,
        maximumStock: data.maximumStock || 1000,
        availableStock: data.availableStock || 0,
        reorderLevel: data.reorderLevel || 0,
        purchasePrice: data.purchasePrice || 0.0,
        sellingPrice: data.sellingPrice || 0.0,
        supplierId: data.supplierId,
      },
    });

    if (item.availableStock > 0) {
      await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          type: 'IN',
          quantity: item.availableStock,
          reference: 'INITIAL_STOCK',
          toWarehouse: item.warehouse,
          performedBy: userEmail,
        },
      });
    }

    await auditService.log({
      action: 'INVENTORY_ITEM_CREATED',
      tableName: 'InventoryItem',
      recordId: String(item.id),
      newValue: { name: item.itemName, code: item.itemCode, email: userEmail },
    });

    notifyProcurementChange('STOCK_UPDATED', { itemId: item.id, itemCode: item.itemCode, newStock: item.availableStock });

    return item;
  }

  static async updateInventoryItem(id: number, data: any, userEmail: string) {
    const oldItem = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!oldItem) throw new Error('Inventory item not found');

    const item = await prisma.inventoryItem.update({
      where: { id },
      data,
    });

    if (data.availableStock !== undefined && data.availableStock !== oldItem.availableStock) {
      const diff = data.availableStock - oldItem.availableStock;
      await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          type: 'ADJUSTMENT',
          quantity: Math.abs(diff),
          reference: `Manual Adjustment: ${diff > 0 ? 'Increase' : 'Decrease'}`,
          toWarehouse: item.warehouse,
          performedBy: userEmail,
        },
      });

      notifyProcurementChange('STOCK_UPDATED', { itemId: item.id, itemCode: item.itemCode, newStock: item.availableStock });

      if (item.availableStock <= item.reorderLevel) {
        notifyProcurementChange('LOW_STOCK_ALERT', { itemCode: item.itemCode, itemName: item.itemName, stock: item.availableStock });
      }
    }

    await auditService.log({
      action: 'INVENTORY_ITEM_UPDATED',
      tableName: 'InventoryItem',
      recordId: String(item.id),
      newValue: { name: item.itemName, code: item.itemCode, email: userEmail },
    });

    return item;
  }

  // --- Stock Transfers ---
  static async transferStock(data: { itemId: number; fromWarehouse: string; toWarehouse: string; quantity: number }, userEmail: string) {
    if (data.quantity <= 0) {
      throw new Error('Transfer quantity must be greater than zero');
    }
    if (data.fromWarehouse.trim().toLowerCase() === data.toWarehouse.trim().toLowerCase()) {
      throw new Error('Source and destination warehouses must be different');
    }

    const item = await prisma.inventoryItem.findUnique({ where: { id: data.itemId } });
    if (!item) throw new Error('Inventory item not found');
    
    if (item.warehouse.toLowerCase().trim() !== data.fromWarehouse.toLowerCase().trim()) {
      throw new Error(`Inventory item does not belong to source warehouse "${data.fromWarehouse}". Currently located in "${item.warehouse}".`);
    }

    if (item.availableStock < data.quantity) {
      throw new Error(`Insufficient stock in ${data.fromWarehouse}. Available: ${item.availableStock}`);
    }

    let destItem = await prisma.inventoryItem.findFirst({
      where: {
        itemCode: item.itemCode,
        warehouse: data.toWarehouse,
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          availableStock: { decrement: data.quantity },
        },
      });

      if (destItem) {
        await tx.inventoryItem.update({
          where: { id: destItem.id },
          data: {
            availableStock: { increment: data.quantity },
          },
        });
      } else {
        destItem = await tx.inventoryItem.create({
          data: {
            itemCode: item.itemCode,
            barcode: item.barcode,
            qrCode: item.qrCode,
            itemName: item.itemName,
            description: item.description,
            category: item.category,
            warehouse: data.toWarehouse,
            unit: item.unit,
            minimumStock: item.minimumStock,
            maximumStock: item.maximumStock,
            availableStock: data.quantity,
            reorderLevel: item.reorderLevel,
            purchasePrice: item.purchasePrice,
            sellingPrice: item.sellingPrice,
            supplierId: item.supplierId,
          },
        });
      }

      await tx.stockMovement.create({
        data: {
          itemId: item.id,
          type: 'TRANSFER',
          quantity: data.quantity,
          reference: `Transfer from ${data.fromWarehouse} to ${data.toWarehouse}`,
          fromWarehouse: data.fromWarehouse,
          toWarehouse: data.toWarehouse,
          performedBy: userEmail,
        },
      });
    });

    await auditService.log({
      action: 'STOCK_TRANSFERRED',
      tableName: 'InventoryItem',
      recordId: String(item.id),
      newValue: { from: data.fromWarehouse, to: data.toWarehouse, quantity: data.quantity },
    });

    notifyProcurementChange('STOCK_UPDATED', { itemId: item.id, itemCode: item.itemCode });

    return { success: true };
  }

  // --- Purchase Orders ---
  static async getPurchaseOrders(filters: { search?: string; status?: string }) {
    const where: any = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { poNumber: { contains: filters.search, mode: 'insensitive' } },
        { requestedBy: { contains: filters.search, mode: 'insensitive' } },
        { vendor: { companyName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }
    return prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: {
          select: { companyName: true, vendorCode: true },
        },
        items: true,
        grns: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createPurchaseOrder(data: {
    vendorId: number;
    expectedDelivery?: string;
    items: { itemCode: string; itemName: string; quantity: number; unitPrice: number }[];
  }, userEmail: string) {
    const count = await prisma.purchaseOrder.count();
    const poNumber = `PO-${String(count + 1).padStart(5, '0')}`;

    let subtotal = 0;
    const orderItemsData = data.items.map(item => {
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      return {
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
      };
    });

    const taxAmount = subtotal * 0.17;
    const grandTotal = subtotal + taxAmount;

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId: data.vendorId,
        requestedBy: userEmail,
        expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : null,
        subtotal,
        taxAmount,
        grandTotal,
        status: 'Draft',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
        vendor: true,
      },
    });

    await auditService.log({
      action: 'PURCHASE_ORDER_CREATED',
      tableName: 'PurchaseOrder',
      recordId: String(po.id),
      newValue: { poNumber: po.poNumber, vendor: po.vendor.companyName },
    });

    return po;
  }

  static async updatePurchaseOrder(id: number, data: { status: string; approvedBy?: string }, userEmail: string) {
    const oldPO = await prisma.purchaseOrder.findUnique({ where: { id }, include: { vendor: true } });
    if (!oldPO) throw new Error('Purchase order not found');

    if (data.status === 'Approved') {
      if (oldPO.status === 'Approved') {
        throw new Error(`Purchase order ${oldPO.poNumber} has already been approved.`);
      }
      if (oldPO.status === 'Completed' || oldPO.status === 'Partially Received') {
        throw new Error(`Purchase order ${oldPO.poNumber} has already been approved and received.`);
      }
      if (oldPO.status === 'Cancelled') {
        throw new Error(`Cancelled purchase orders cannot be approved.`);
      }
    }

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: data.status,
        approvedBy: data.approvedBy,
      },
      include: {
        items: true,
      },
    });

    await auditService.log({
      action: 'PURCHASE_ORDER_UPDATED',
      tableName: 'PurchaseOrder',
      recordId: String(po.id),
      newValue: { poNumber: po.poNumber, status: po.status },
    });

    if (po.status === 'Approved') {
      notifyProcurementChange('PURCHASE_ORDER_APPROVED', { poNumber: po.poNumber, id: po.id });
    }

    return po;
  }

  // --- Goods Receipt Notes (GRN) ---
  static async createGRN(data: { purchaseOrderId: number; items: { itemId: number; itemCode: string; receivedQuantity: number; warehouse: string }[]; remarks?: string }, userEmail: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: data.purchaseOrderId },
      include: { items: true },
    });
    if (!po) throw new Error('Purchase Order not found');

    const grnCount = await prisma.goodsReceiptNote.count();
    const grnNumber = `GRN-${String(grnCount + 1).padStart(5, '0')}`;

    const grn = await prisma.$transaction(async (tx) => {
      const grnRecord = await tx.goodsReceiptNote.create({
        data: {
          grnNumber,
          purchaseOrderId: data.purchaseOrderId,
          receivedBy: userEmail,
          remarks: data.remarks,
        },
      });

      for (const item of data.items) {
        const poItem = po.items.find(pi => pi.itemCode === item.itemCode);
        if (poItem) {
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: {
              receivedQuantity: { increment: item.receivedQuantity },
            },
          });
        }

        const invItem = await tx.inventoryItem.findFirst({
          where: { itemCode: item.itemCode, warehouse: item.warehouse },
        });

        if (invItem) {
          await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: {
              availableStock: { increment: item.receivedQuantity },
            },
          });
          await tx.stockMovement.create({
            data: {
              itemId: invItem.id,
              type: 'IN',
              quantity: item.receivedQuantity,
              reference: grnNumber,
              toWarehouse: item.warehouse,
              performedBy: userEmail,
            },
          });
        } else {
          const newItem = await tx.inventoryItem.create({
            data: {
              itemCode: item.itemCode,
              barcode: `BAR-${item.itemCode}`,
              qrCode: `QR-${item.itemCode}`,
              itemName: poItem?.itemName || item.itemCode,
              category: 'General',
              warehouse: item.warehouse,
              availableStock: item.receivedQuantity,
              purchasePrice: poItem?.unitPrice || 0.0,
              supplierId: po.vendorId,
            },
          });
          await tx.stockMovement.create({
            data: {
              itemId: newItem.id,
              type: 'IN',
              quantity: item.receivedQuantity,
              reference: grnNumber,
              toWarehouse: item.warehouse,
              performedBy: userEmail,
            },
          });
        }
      }

      const updatedPO = await tx.purchaseOrder.findUnique({
        where: { id: data.purchaseOrderId },
        include: { items: true },
      });

      if (updatedPO) {
        const isCompleted = updatedPO.items.every(pi => pi.receivedQuantity >= pi.quantity);
        const hasSomeReceipts = updatedPO.items.some(pi => pi.receivedQuantity > 0);

        await tx.purchaseOrder.update({
          where: { id: data.purchaseOrderId },
          data: {
            status: isCompleted ? 'Completed' : hasSomeReceipts ? 'Partially Received' : 'Approved',
          },
        });
      }

      return grnRecord;
    });

    await auditService.log({
      action: 'GOODS_RECEIPT_CREATED',
      tableName: 'GoodsReceiptNote',
      recordId: String(grn.id),
      newValue: { grnNumber: grn.grnNumber, purchaseOrderId: data.purchaseOrderId },
    });

    notifyProcurementChange('STOCK_UPDATED', { grnNumber: grn.grnNumber });

    return grn;
  }

  // --- Asset Management ---
  static async getAssets(filters: { search?: string; category?: string; status?: string }) {
    const where: any = {};
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { assetName: { contains: filters.search, mode: 'insensitive' } },
        { assetCode: { contains: filters.search, mode: 'insensitive' } },
        { serialNumber: { contains: filters.search, mode: 'insensitive' } },
        { assignedTo: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        assignments: { orderBy: { assignedDate: 'desc' } },
        maintenances: { orderBy: { maintenanceDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assets.map(asset => {
      const yearsElapsed = (Date.now() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      let calculatedValue = asset.purchaseCost;
      const rate = 0.10;

      if (asset.depreciationMethod === 'StraightLine') {
        calculatedValue = Math.max(0, asset.purchaseCost - (yearsElapsed * rate * asset.purchaseCost));
      } else {
        calculatedValue = asset.purchaseCost * Math.pow(1 - rate, yearsElapsed);
      }

      return {
        ...asset,
        currentValue: Number(calculatedValue.toFixed(2)),
      };
    });
  }

  static async createAsset(data: {
    assetName: string;
    category: string;
    serialNumber?: string | null;
    purchaseDate: string;
    purchaseCost: number;
    depreciationMethod?: string;
    location?: string | null;
    warrantyExpiry?: string | null;
  }, userEmail: string) {
    if (data.serialNumber) {
      const existing = await prisma.asset.findFirst({
        where: { serialNumber: { equals: data.serialNumber, mode: 'insensitive' } },
      });
      if (existing) {
        throw new Error(`Asset with serial number "${data.serialNumber}" already exists (Asset: ${existing.assetCode})`);
      }
    }

    const count = await prisma.asset.count();
    const assetCode = `AST-${String(count + 1).padStart(5, '0')}`;
    const barcode = `BAR-${assetCode}`;
    const qrCode = `QR-${assetCode}`;

    const asset = await prisma.asset.create({
      data: {
        assetCode,
        barcode,
        qrCode,
        assetName: data.assetName,
        category: data.category,
        serialNumber: data.serialNumber,
        purchaseDate: new Date(data.purchaseDate),
        purchaseCost: data.purchaseCost,
        currentValue: data.purchaseCost,
        depreciationMethod: data.depreciationMethod || 'StraightLine',
        location: data.location,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
        status: 'Available',
      },
    });

    await auditService.log({
      action: 'ASSET_CREATED',
      tableName: 'Asset',
      recordId: String(asset.id),
      newValue: { name: asset.assetName, code: asset.assetCode },
    });

    return asset;
  }

  static async updateAsset(id: number, data: any, userEmail: string) {
    if (data.serialNumber) {
      const existing = await prisma.asset.findFirst({
        where: {
          id: { not: id },
          serialNumber: { equals: data.serialNumber, mode: 'insensitive' },
        },
      });
      if (existing) {
        throw new Error(`Another asset with serial number "${data.serialNumber}" already exists (Asset: ${existing.assetCode})`);
      }
    }

    const asset = await prisma.asset.update({
      where: { id },
      data,
    });

    await auditService.log({
      action: 'ASSET_UPDATED',
      tableName: 'Asset',
      recordId: String(asset.id),
      newValue: { name: asset.assetName, code: asset.assetCode },
    });

    return asset;
  }

  static async assignAsset(data: { assetId: number; assignedTo: string; assignedType: string; remarks?: string | null }, userEmail: string) {
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) throw new Error('Asset not found');

    const updatedAsset = await prisma.$transaction(async (tx) => {
      await tx.assetAssignment.create({
        data: {
          assetId: data.assetId,
          assignedTo: data.assignedTo,
          assignedType: data.assignedType,
          remarks: data.remarks,
        },
      });

      return tx.asset.update({
        where: { id: data.assetId },
        data: {
          status: 'Assigned',
          assignedTo: data.assignedTo,
        },
      });
    });

    await auditService.log({
      action: 'ASSET_ASSIGNED',
      tableName: 'Asset',
      recordId: String(asset.id),
      newValue: { assignedTo: data.assignedTo, assetCode: asset.assetCode },
    });

    notifyProcurementChange('ASSET_ASSIGNED', { assetCode: asset.assetCode, assignedTo: data.assignedTo });

    return updatedAsset;
  }

  static async scheduleMaintenance(data: { assetId: number; description: string; maintenanceDate: string; performedBy: string }, userEmail: string) {
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) throw new Error('Asset not found');

    const maintenance = await prisma.$transaction(async (tx) => {
      const record = await tx.assetMaintenance.create({
        data: {
          assetId: data.assetId,
          maintenanceDate: new Date(data.maintenanceDate),
          description: data.description,
          performedBy: data.performedBy,
          status: 'Pending',
        },
      });

      await tx.asset.update({
        where: { id: data.assetId },
        data: {
          status: 'Under Maintenance',
          maintenanceDue: new Date(data.maintenanceDate),
        },
      });

      return record;
    });

    await auditService.log({
      action: 'ASSET_MAINTENANCE_SCHEDULED',
      tableName: 'Asset',
      recordId: String(asset.id),
      newValue: { maintenanceId: maintenance.id, date: data.maintenanceDate },
    });

    notifyProcurementChange('MAINTENANCE_DUE', { assetCode: asset.assetCode, dueDate: data.maintenanceDate });

    return maintenance;
  }

  // --- Procurement Reports & Analytics ---
  static async getProcurementDashboardData() {
    const totalVendors = await prisma.vendor.count({ where: { status: 'Active' } });
    const activePurchaseOrders = await prisma.purchaseOrder.count({ where: { status: { in: ['Draft', 'Pending', 'Approved', 'Ordered', 'Partially Received'] } } });
    const pendingApprovals = await prisma.purchaseOrder.count({ where: { status: 'Pending' } });

    const items = await prisma.inventoryItem.findMany();
    const lowStockItems = items.filter(item => item.availableStock <= item.reorderLevel).length;

    const inventoryValue = items.reduce((acc, item) => acc + (item.availableStock * item.purchasePrice), 0);

    const assetsInUse = await prisma.asset.count({ where: { status: 'Assigned' } });
    const assetsUnderMaintenance = await prisma.asset.count({ where: { status: 'Under Maintenance' } });

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentPOs = await prisma.purchaseOrder.findMany({
      where: {
        orderDate: { gte: last30Days },
        status: { not: 'Cancelled' },
      },
      select: { grandTotal: true },
    });
    const monthlyProcurementCost = recentPOs.reduce((acc, po) => acc + po.grandTotal, 0);

    return {
      totalVendors,
      activePurchaseOrders,
      pendingApprovals,
      lowStockItems,
      inventoryValue,
      assetsInUse,
      assetsUnderMaintenance,
      monthlyProcurementCost,
    };
  }
}
