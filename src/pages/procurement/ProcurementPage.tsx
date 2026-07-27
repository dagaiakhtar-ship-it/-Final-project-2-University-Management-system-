import React, { useState, useEffect } from 'react';
import { 
  apiClient 
} from '../../api/api-client';
import { 
  LayoutDashboard, Users, ShoppingCart, Archive, FileText, Settings,
  Plus, Edit2, Trash2, ArrowLeftRight, Check, AlertTriangle, HelpCircle,
  TrendingUp, Calendar, MapPin, DollarSign, BarChart2, CheckCircle2,
  Package, QrCode, Search, Filter, ShieldAlert, ClipboardList, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';

export function ProcurementPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vendors' | 'pos' | 'grn' | 'inventory' | 'assets'>('dashboard');

  // Common UI / Modal States
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Data States
  const [dashboardData, setDashboardData] = useState<any>({
    totalVendors: 0,
    activePurchaseOrders: 0,
    pendingApprovals: 0,
    lowStockItems: 0,
    inventoryValue: 0,
    assetsInUse: 0,
    assetsUnderMaintenance: 0,
    monthlyProcurementCost: 0
  });
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  // Form Modals / Slide-overs
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    id: null as number | null,
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    taxNumber: '',
    address: '',
    paymentTerms: 'Net 30',
    status: 'Active'
  });

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState({
    id: null as number | null,
    itemName: '',
    description: '',
    category: 'General IT',
    warehouse: 'Main Warehouse',
    unit: 'Pcs',
    minimumStock: 10,
    maximumStock: 500,
    availableStock: 50,
    reorderLevel: 20,
    purchasePrice: 15.00,
    sellingPrice: 0.00,
    supplierId: '' as string | number
  });

  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poForm, setPOForm] = useState({
    vendorId: '',
    expectedDelivery: '',
    items: [
      { itemCode: '', itemName: '', quantity: 1, unitPrice: 0 }
    ]
  });

  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [grnForm, setGRNForm] = useState({
    purchaseOrderId: '',
    remarks: '',
    items: [] as Array<{ itemId: number; itemCode: string; receivedQuantity: number; warehouse: string; itemName: string; quantity: number }>
  });

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    itemId: '',
    fromWarehouse: '',
    toWarehouse: 'Lab Warehouse',
    quantity: 1
  });

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState({
    assetName: '',
    category: 'Hardware',
    serialNumber: '',
    purchaseDate: '',
    purchaseCost: 1200.00,
    depreciationMethod: 'StraightLine',
    location: 'Main Campus',
    warrantyExpiry: ''
  });

  const [isAssignAssetModalOpen, setIsAssignAssetModalOpen] = useState(false);
  const [assignAssetForm, setAssignAssetForm] = useState({
    assetId: '',
    assignedTo: '',
    assignedType: 'Staff',
    remarks: ''
  });

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    assetId: '',
    description: '',
    maintenanceDate: '',
    performedBy: ''
  });

  const [selectedLabelItem, setSelectedLabelItem] = useState<any | null>(null);

  // --- Fetch Methods ---
  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/procurement/dashboard');
      setDashboardData(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/procurement/vendors', {
        params: {
          search: searchQuery,
          status: statusFilter === 'All' ? undefined : statusFilter
        }
      });
      setVendors(res.data);
    } catch (e) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/procurement/inventory', {
        params: {
          search: searchQuery,
          category: statusFilter === 'All' ? undefined : statusFilter
        }
      });
      setInventory(res.data);
    } catch (e) {
      toast.error('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/procurement/purchase-orders', {
        params: {
          search: searchQuery,
          status: statusFilter === 'All' ? undefined : statusFilter
        }
      });
      setPurchaseOrders(res.data);
    } catch (e) {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/procurement/assets', {
        params: {
          search: searchQuery,
          category: statusFilter === 'All' ? undefined : statusFilter
        }
      });
      setAssets(res.data);
    } catch (e) {
      toast.error('Failed to load asset directory');
    } finally {
      setLoading(false);
    }
  };

  // Trigger loads on tab switch
  useEffect(() => {
    setSearchQuery('');
    setStatusFilter('All');
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (activeTab === 'vendors') {
      fetchVendors();
    } else if (activeTab === 'inventory') {
      fetchInventory();
    } else if (activeTab === 'pos') {
      fetchPurchaseOrders();
    } else if (activeTab === 'assets') {
      fetchAssets();
    }
  }, [activeTab]);

  // Handle instant search / filters triggers
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (activeTab === 'vendors') fetchVendors();
      else if (activeTab === 'inventory') fetchInventory();
      else if (activeTab === 'pos') fetchPurchaseOrders();
      else if (activeTab === 'assets') fetchAssets();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, statusFilter]);

  // --- CRUD/Form Actions ---

  // Vendor Submit
  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (vendorForm.id) {
        await apiClient.put(`/procurement/vendors/${vendorForm.id}`, vendorForm);
        toast.success('Supplier profile updated successfully');
      } else {
        await apiClient.post('/procurement/vendors', vendorForm);
        toast.success('Supplier successfully registered');
      }
      setIsVendorModalOpen(false);
      fetchVendors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save supplier');
    }
  };

  const handleDeleteVendor = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier? This action is permanent.')) return;
    try {
      await apiClient.delete(`/procurement/vendors/${id}`);
      toast.success('Supplier removed');
      fetchVendors();
    } catch (err) {
      toast.error('Could not delete supplier (has related transactions)');
    }
  };

  // Inventory Item Submit
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...itemForm,
        supplierId: itemForm.supplierId ? Number(itemForm.supplierId) : null,
        minimumStock: Number(itemForm.minimumStock),
        maximumStock: Number(itemForm.maximumStock),
        availableStock: Number(itemForm.availableStock),
        reorderLevel: Number(itemForm.reorderLevel),
        purchasePrice: Number(itemForm.purchasePrice),
        sellingPrice: Number(itemForm.sellingPrice)
      };
      if (itemForm.id) {
        await apiClient.put(`/procurement/inventory/${itemForm.id}`, payload);
        toast.success('Item details updated');
      } else {
        await apiClient.post('/procurement/inventory', payload);
        toast.success('Item added to inventory & initial stock logged');
      }
      setIsItemModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving item');
    }
  };

  // Stock Transfer Submit
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/procurement/inventory/transfer', {
        itemId: Number(transferForm.itemId),
        fromWarehouse: transferForm.fromWarehouse,
        toWarehouse: transferForm.toWarehouse,
        quantity: Number(transferForm.quantity)
      });
      toast.success('Stock transferred successfully across warehouses');
      setIsTransferModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    }
  };

  // Purchase Order Form Helpers & Submit
  const addPOItem = () => {
    setPOForm({
      ...poForm,
      items: [...poForm.items, { itemCode: '', itemName: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removePOItem = (index: number) => {
    const updated = [...poForm.items];
    updated.splice(index, 1);
    setPOForm({ ...poForm, items: updated });
  };

  const updatePOItemValue = (index: number, field: string, value: any) => {
    const updated = [...poForm.items];
    updated[index] = { ...updated[index], [field]: value };
    setPOForm({ ...poForm, items: updated });
  };

  const handlePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.vendorId) {
      toast.error('Please select a supplier');
      return;
    }
    try {
      const payload = {
        vendorId: Number(poForm.vendorId),
        expectedDelivery: poForm.expectedDelivery || undefined,
        items: poForm.items.map(it => ({
          itemCode: it.itemCode,
          itemName: it.itemName,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice)
        }))
      };
      await apiClient.post('/procurement/purchase-orders', payload);
      toast.success('Purchase requisition created in Draft state');
      setIsPOModalOpen(false);
      fetchPurchaseOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Requisition creation failed');
    }
  };

  const handleApprovePO = async (id: number) => {
    try {
      await apiClient.put(`/procurement/purchase-orders/${id}`, {
        status: 'Approved'
      });
      toast.success('Purchase order approved and status updated to Approved');
      fetchPurchaseOrders();
    } catch (err: any) {
      toast.error('Failed to approve PO');
    }
  };

  // GRN Submit
  const triggerGRNModal = (po: any) => {
    const mappedItems = po.items.map((pi: any) => ({
      itemId: pi.id,
      itemCode: pi.itemCode,
      itemName: pi.itemName,
      quantity: pi.quantity,
      receivedQuantity: pi.quantity - (pi.receivedQuantity || 0),
      warehouse: 'Main Warehouse'
    }));
    setGRNForm({
      purchaseOrderId: String(po.id),
      remarks: '',
      items: mappedItems
    });
    setIsGRNModalOpen(true);
  };

  const updateGRNItemValue = (index: number, field: string, value: any) => {
    const updated = [...grnForm.items];
    updated[index] = { ...updated[index], [field]: value };
    setGRNForm({ ...grnForm, items: updated });
  };

  const handleGRNSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        purchaseOrderId: Number(grnForm.purchaseOrderId),
        remarks: grnForm.remarks,
        items: grnForm.items.map(it => ({
          itemId: it.itemId,
          itemCode: it.itemCode,
          receivedQuantity: Number(it.receivedQuantity),
          warehouse: it.warehouse
        }))
      };
      await apiClient.post('/procurement/grn', payload);
      toast.success('Goods Receipt Note processed and inventory levels increased!');
      setIsGRNModalOpen(false);
      fetchPurchaseOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Processing GRN failed');
    }
  };

  // Asset Actions
  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...assetForm,
        purchaseCost: Number(assetForm.purchaseCost),
        warrantyExpiry: assetForm.warrantyExpiry || undefined
      };
      await apiClient.post('/procurement/assets', payload);
      toast.success('Fixed asset added successfully');
      setIsAssetModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register asset');
    }
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/procurement/assets/assign', {
        assetId: Number(assignAssetForm.assetId),
        assignedTo: assignAssetForm.assignedTo,
        assignedType: assignAssetForm.assignedType,
        remarks: assignAssetForm.remarks || undefined
      });
      toast.success('Asset successfully assigned');
      setIsAssignAssetModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleScheduleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/procurement/assets/maintenance', {
        assetId: Number(maintenanceForm.assetId),
        description: maintenanceForm.description,
        maintenanceDate: maintenanceForm.maintenanceDate,
        performedBy: maintenanceForm.performedBy
      });
      toast.success('Asset maintenance scheduled and status updated to Under Maintenance');
      setIsMaintenanceModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Scheduling failed');
    }
  };

  // Barcode / QR Label Creator Modal
  const openLabelGenerator = (item: any) => {
    setSelectedLabelItem(item);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800" id="procurement-app">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm" id="p-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <ShoppingCart className="h-7 w-7 text-indigo-600" />
            Enterprise Procurement, Inventory & Asset Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Oracle-grade ERP engine tracking vendor requisitions, warehouse inventory flows, live audits, and asset depreciation.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <button 
            onClick={() => {
              if (activeTab === 'dashboard') fetchDashboardData();
              else if (activeTab === 'vendors') fetchVendors();
              else if (activeTab === 'inventory') fetchInventory();
              else if (activeTab === 'pos') fetchPurchaseOrders();
              else if (activeTab === 'assets') fetchAssets();
              toast.success('Live data synchronized');
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
            id="sync-btn"
          >
            <RefreshCw className="h-4 w-4" />
            Sync ERP
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200" id="procurement-tabs">
        {[
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'vendors', label: 'Supplier Directory', icon: Users },
          { id: 'pos', label: 'Purchase Orders', icon: FileText },
          { id: 'inventory', label: 'Warehouse Inventory', icon: Archive },
          { id: 'assets', label: 'Asset Depreciation & Tracking', icon: Package }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                isActive 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
              id={`tab-btn-${tab.id}`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content body depending on tab */}

      {/* 1. DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6" id="view-dashboard">
          {/* Key Metrics Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" id="kpi-vendors">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Suppliers</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{dashboardData.totalVendors}</h3>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" id="kpi-pos">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Purchase Orders</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{dashboardData.activePurchaseOrders}</h3>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
                <FileText className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" id="kpi-low-stock">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock Warnings</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{dashboardData.lowStockItems}</h3>
              </div>
              <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" id="kpi-value">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory Valuation</span>
                <h3 className="text-2xl font-bold text-indigo-600 mt-1">${dashboardData.inventoryValue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid-2">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" id="kpi-dep-use">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fixed Assets in Use</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{dashboardData.assetsInUse}</h3>
              </div>
              <div className="bg-teal-50 p-3 rounded-xl text-teal-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" id="kpi-dep-maint">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assets Under Maintenance</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{dashboardData.assetsUnderMaintenance}</h3>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
                <Settings className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" id="kpi-monthly-cost">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last 30-Day Procurement Spend</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">${dashboardData.monthlyProcurementCost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="bg-violet-50 p-3 rounded-xl text-violet-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" id="kpi-approvals">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Order Approvals</span>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">{dashboardData.pendingApprovals}</h3>
              </div>
              <div className="bg-yellow-50 p-3 rounded-xl text-yellow-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Graphical Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-graphics">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" id="spend-chart-container">
              <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-indigo-600" />
                Procurement Cost Analysis (Last 30 Days)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Hardware', Cost: dashboardData.monthlyProcurementCost * 0.45 },
                    { name: 'General Lab', Cost: dashboardData.monthlyProcurementCost * 0.20 },
                    { name: 'Office Supplies', Cost: dashboardData.monthlyProcurementCost * 0.15 },
                    { name: 'Infrastructure', Cost: dashboardData.monthlyProcurementCost * 0.20 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val: any) => [`$${val.toFixed(2)}`, 'Spend']} />
                    <Bar dataKey="Cost" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Warehouse Stock Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" id="stock-chart-container">
              <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                Warehouse Stock Breakdown
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Main Warehouse', value: dashboardData.inventoryValue * 0.6 || 4000 },
                        { name: 'Lab Warehouse', value: dashboardData.inventoryValue * 0.25 || 2500 },
                        { name: 'Library Deposit', value: dashboardData.inventoryValue * 0.1 || 1000 },
                        { name: 'Hostel Depot', value: dashboardData.inventoryValue * 0.05 || 500 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#6366f1" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Valuation']} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUPPLIER DIRECTORY */}
      {activeTab === 'vendors' && (
        <div className="space-y-6" id="view-vendors">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between" id="vendor-filters">
            <div className="flex flex-1 gap-3 w-full sm:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search supplier, contact, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  id="search-vendors-input"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm text-slate-600 focus:outline-none focus:border-indigo-500"
                id="filter-vendors-status"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <button
              onClick={() => {
                setVendorForm({
                  id: null,
                  companyName: '',
                  contactPerson: '',
                  email: '',
                  phone: '',
                  taxNumber: '',
                  address: '',
                  paymentTerms: 'Net 30',
                  status: 'Active'
                });
                setIsVendorModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all w-full sm:w-auto justify-center"
              id="add-vendor-btn"
            >
              <Plus className="h-4 w-4" />
              Register Supplier
            </button>
          </div>

          {/* Suppliers Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm" id="vendors-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                    <th className="px-6 py-4">Vendor Code</th>
                    <th className="px-6 py-4">Company Name</th>
                    <th className="px-6 py-4">Contact Person</th>
                    <th className="px-6 py-4">Email / Phone</th>
                    <th className="px-6 py-4">Tax Number</th>
                    <th className="px-6 py-4">Payment Terms</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {loading && vendors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">Loading suppliers directory...</td>
                    </tr>
                  ) : vendors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">No suppliers registered yet.</td>
                    </tr>
                  ) : (
                    vendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-semibold text-slate-900">{vendor.vendorCode}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{vendor.companyName}</td>
                        <td className="px-6 py-4">{vendor.contactPerson}</td>
                        <td className="px-6 py-4 text-xs">
                          <div>{vendor.email}</div>
                          <div className="text-slate-400 mt-0.5">{vendor.phone}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{vendor.taxNumber || 'N/A'}</td>
                        <td className="px-6 py-4">{vendor.paymentTerms}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            vendor.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {vendor.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setVendorForm({
                                  id: vendor.id,
                                  companyName: vendor.companyName,
                                  contactPerson: vendor.contactPerson,
                                  email: vendor.email,
                                  phone: vendor.phone,
                                  taxNumber: vendor.taxNumber || '',
                                  address: vendor.address || '',
                                  paymentTerms: vendor.paymentTerms || 'Net 30',
                                  status: vendor.status || 'Active'
                                });
                                setIsVendorModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-all"
                              title="Edit Supplier"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVendor(vendor.id)}
                              className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-all"
                              title="Delete Supplier"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. PURCHASE REQUISITIONS & ORDERS */}
      {activeTab === 'pos' && (
        <div className="space-y-6" id="view-pos">
          {/* Requisitions Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between" id="po-filters">
            <div className="flex flex-1 gap-3 w-full sm:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by PO number, requester, vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  id="search-pos-input"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm text-slate-600 focus:outline-none focus:border-indigo-500"
                id="filter-pos-status"
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Pending">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Partially Received">Partially Received</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <button
              onClick={() => {
                // Initialize vendor selection using first vendor if any exist
                setPOForm({
                  vendorId: vendors[0]?.id ? String(vendors[0].id) : '',
                  expectedDelivery: '',
                  items: [{ itemCode: 'ITM-00001', itemName: 'Core Dev Server v2', quantity: 5, unitPrice: 120.00 }]
                });
                setIsPOModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all w-full sm:w-auto justify-center"
              id="create-po-btn"
            >
              <Plus className="h-4 w-4" />
              New Purchase Order Requisition
            </button>
          </div>

          {/* PO List */}
          <div className="grid grid-cols-1 gap-4" id="pos-list">
            {loading && purchaseOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-400">Loading purchase orders...</div>
            ) : purchaseOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No purchase orders found matching standard filter criteria.</div>
            ) : (
              purchaseOrders.map((po) => (
                <div key={po.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4" id={`po-card-${po.id}`}>
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900 text-lg">{po.poNumber}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        po.status === 'Draft' ? 'bg-slate-100 text-slate-700' :
                        po.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        po.status === 'Approved' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                        po.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-indigo-50 text-indigo-700'
                      }`}>
                        {po.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2 sm:mt-0 font-medium">
                      Date Ordered: {new Date(po.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Info Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                    <div>
                      <span className="text-slate-400 text-xs uppercase font-bold block">Vendor / Supplier</span>
                      <span className="font-semibold text-slate-800">{po.vendor?.companyName}</span>
                      <span className="text-slate-400 text-xs block font-mono">{po.vendor?.vendorCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs uppercase font-bold block">Requested By</span>
                      <span className="font-semibold text-slate-800">{po.requestedBy}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs uppercase font-bold block">Expected Delivery</span>
                      <span className="font-semibold text-slate-800">{po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : 'Immediate'}</span>
                    </div>
                  </div>

                  {/* Line Items Sub-table */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-slate-400 font-semibold border-b border-slate-200 pb-2">
                          <th className="py-1">Item Code</th>
                          <th className="py-1">Item Name</th>
                          <th className="py-1 text-right">Quantity</th>
                          <th className="py-1 text-right">Received</th>
                          <th className="py-1 text-right">Unit Cost</th>
                          <th className="py-1 text-right">Total Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {po.items?.map((item: any) => (
                          <tr key={item.id} className="text-slate-700">
                            <td className="py-2 font-mono">{item.itemCode}</td>
                            <td className="py-2 font-semibold">{item.itemName}</td>
                            <td className="py-2 text-right font-semibold">{item.quantity}</td>
                            <td className="py-2 text-right font-semibold text-emerald-600">{item.receivedQuantity || 0}</td>
                            <td className="py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                            <td className="py-2 text-right font-mono font-semibold">${item.totalPrice.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals and Actions Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4 gap-4">
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-slate-400 text-xs block">Subtotal</span>
                        <span className="font-semibold text-slate-800">${po.subtotal?.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">VAT (17%)</span>
                        <span className="font-semibold text-slate-800">${po.taxAmount?.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-indigo-600 text-xs block font-bold">Grand Total</span>
                        <span className="font-extrabold text-slate-900 text-base">${po.grandTotal?.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      {po.status === 'Draft' && (
                        <button
                          onClick={() => handleApprovePO(po.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition shadow-sm"
                          id={`approve-po-btn-${po.id}`}
                        >
                          <Check className="h-4 w-4" />
                          Approve Requisition
                        </button>
                      )}
                      {(po.status === 'Approved' || po.status === 'Partially Received') && (
                        <button
                          onClick={() => triggerGRNModal(po)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition shadow-sm"
                          id={`receive-goods-btn-${po.id}`}
                        >
                          <Package className="h-4 w-4" />
                          Process Goods Receipt (GRN)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. WAREHOUSE INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-6" id="view-inventory">
          {/* Search, Warehouses & Add Items Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between" id="inv-filters">
            <div className="flex flex-wrap flex-1 gap-3 w-full lg:w-auto">
              <div className="relative flex-1 max-w-sm min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item name, code, barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  id="search-inventory-input"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm text-slate-600 focus:outline-none focus:border-indigo-500"
                id="filter-inventory-category"
              >
                <option value="All">All Categories</option>
                <option value="General IT">General IT</option>
                <option value="Laboratory Science">Laboratory Science</option>
                <option value="Hostel Utilities">Hostel Utilities</option>
                <option value="Library Books">Library Books</option>
                <option value="Offices Supply">Offices Supply</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
              <button
                onClick={() => {
                  setTransferForm({
                    itemId: inventory[0]?.id ? String(inventory[0].id) : '',
                    fromWarehouse: 'Main Warehouse',
                    toWarehouse: 'Lab Warehouse',
                    quantity: 1
                  });
                  setIsTransferModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all"
                id="transfer-stock-btn"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Inter-Warehouse Transfer
              </button>
              <button
                onClick={() => {
                  setItemForm({
                    id: null,
                    itemName: '',
                    description: '',
                    category: 'General IT',
                    warehouse: 'Main Warehouse',
                    unit: 'Pcs',
                    minimumStock: 10,
                    maximumStock: 1000,
                    availableStock: 100,
                    reorderLevel: 20,
                    purchasePrice: 10.00,
                    sellingPrice: 0.00,
                    supplierId: vendors[0]?.id ? String(vendors[0].id) : ''
                  });
                  setIsItemModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
                id="add-item-btn"
              >
                <Plus className="h-4 w-4" />
                Add Stock Entry
              </button>
            </div>
          </div>

          {/* Low Stock Alerts Banner */}
          {inventory.some(item => item.availableStock <= item.reorderLevel) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800 text-sm" id="low-stock-alert-banner">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-bold">Automated Reorder Alerts Triggered</h5>
                <p className="mt-0.5 text-amber-700 text-xs">
                  The following SKU codes have dropped below their defined safety threshold levels. We recommend launching purchase orders immediately.
                </p>
              </div>
            </div>
          )}

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm" id="inventory-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                    <th className="px-6 py-4">Item Code</th>
                    <th className="px-6 py-4">Item Name / Desc</th>
                    <th className="px-6 py-4">Warehouse Depot</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Available Stock</th>
                    <th className="px-6 py-4 text-right">Unit Price</th>
                    <th className="px-6 py-4 text-right">Total Valuation</th>
                    <th className="px-6 py-4 text-center">Safety Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {loading && inventory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400">Loading stock inventory...</td>
                    </tr>
                  ) : inventory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400">No inventory entries available. Add your first item.</td>
                    </tr>
                  ) : (
                    inventory.map((item) => {
                      const isLowStock = item.availableStock <= item.reorderLevel;
                      const totalVal = item.availableStock * item.purchasePrice;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-semibold text-slate-900">{item.itemCode}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{item.itemName}</div>
                            <div className="text-xs text-slate-400 max-w-xs truncate">{item.description || 'No description'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md w-fit">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {item.warehouse}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs">{item.category}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900">{item.availableStock} <span className="text-slate-400 text-xs font-normal">{item.unit || 'Pcs'}</span></td>
                          <td className="px-6 py-4 text-right font-mono">${item.purchasePrice.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">${totalVal.toFixed(2)}</td>
                          <td className="px-6 py-4 text-center">
                            {isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 animate-pulse border border-rose-100">
                                <AlertTriangle className="h-3 w-3" />
                                Reorder Due
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <CheckCircle2 className="h-3 w-3" />
                                Optimal
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openLabelGenerator(item)}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-all"
                                title="Print Labels & Barcodes"
                              >
                                <QrCode className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setItemForm({
                                    id: item.id,
                                    itemName: item.itemName,
                                    description: item.description || '',
                                    category: item.category,
                                    warehouse: item.warehouse,
                                    unit: item.unit || 'Pcs',
                                    minimumStock: item.minimumStock || 10,
                                    maximumStock: item.maximumStock || 1000,
                                    availableStock: item.availableStock,
                                    reorderLevel: item.reorderLevel || 20,
                                    purchasePrice: item.purchasePrice || 0,
                                    sellingPrice: item.sellingPrice || 0,
                                    supplierId: item.supplierId || ''
                                  });
                                  setIsItemModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-all"
                                title="Edit Stock Item"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. ASSET TRACKING & DEPRECIATION */}
      {activeTab === 'assets' && (
        <div className="space-y-6" id="view-assets">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between" id="asset-filters">
            <div className="flex flex-wrap flex-1 gap-3 w-full lg:w-auto">
              <div className="relative flex-1 max-w-sm min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search assets, codes, serials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  id="search-assets-input"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm text-slate-600 focus:outline-none focus:border-indigo-500"
                id="filter-assets-category"
              >
                <option value="All">All Categories</option>
                <option value="Hardware">Hardware & Servers</option>
                <option value="Furniture">Furniture & Lab Desks</option>
                <option value="Vehicles">Campus Vehicles</option>
                <option value="Scientific Equip">Scientific Equipment</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
              <button
                onClick={() => {
                  setAssignAssetForm({
                    assetId: assets[0]?.id ? String(assets[0].id) : '',
                    assignedTo: '',
                    assignedType: 'Staff',
                    remarks: ''
                  });
                  setIsAssignAssetModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all"
                id="assign-asset-btn"
              >
                <Users className="h-4 w-4" />
                Assign Asset
              </button>
              <button
                onClick={() => {
                  setMaintenanceForm({
                    assetId: assets[0]?.id ? String(assets[0].id) : '',
                    description: '',
                    maintenanceDate: '',
                    performedBy: ''
                  });
                  setIsMaintenanceModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all"
                id="maint-asset-btn"
              >
                <Settings className="h-4 w-4" />
                Schedule Maintenance
              </button>
              <button
                onClick={() => {
                  setAssetForm({
                    assetName: '',
                    category: 'Hardware',
                    serialNumber: '',
                    purchaseDate: new Date().toISOString().split('T')[0],
                    purchaseCost: 1500.00,
                    depreciationMethod: 'StraightLine',
                    location: 'Main Campus',
                    warrantyExpiry: ''
                  });
                  setIsAssetModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
                id="add-asset-btn"
              >
                <Plus className="h-4 w-4" />
                Register Asset
              </button>
            </div>
          </div>

          {/* Assets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="assets-grid">
            {loading && assets.length === 0 ? (
              <div className="text-center py-8 text-slate-400 col-span-full">Loading fixed assets...</div>
            ) : assets.length === 0 ? (
              <div className="text-center py-8 text-slate-400 col-span-full">No assets recorded in ERP database.</div>
            ) : (
              assets.map((asset) => (
                <div key={asset.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 hover:shadow-md transition-all" id={`asset-card-${asset.id}`}>
                  {/* Title & Status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 tracking-tight">{asset.assetName}</h4>
                      <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-1 inline-block">{asset.assetCode}</span>
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                      asset.status === 'Available' ? 'bg-emerald-50 text-emerald-700' :
                      asset.status === 'Assigned' ? 'bg-indigo-50 text-indigo-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {asset.status}
                    </span>
                  </div>

                  {/* Depreciation Calculator Indicators */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-bold">Purchase Cost</span>
                      <span className="font-mono font-semibold text-slate-700">${asset.purchaseCost.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-indigo-600 block font-bold">Current Valuation</span>
                      <span className="font-mono font-extrabold text-indigo-600">${asset.currentValue?.toFixed(2) || asset.purchaseCost.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">Depreciation Method</span>
                      <span className="font-semibold text-slate-600">{asset.depreciationMethod}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">Years Elapsed</span>
                      <span className="font-semibold text-slate-600">
                        {((Date.now() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)} years
                      </span>
                    </div>
                  </div>

                  {/* Assignment and Meta */}
                  <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Assigned To:</span>
                      <span className="font-semibold text-slate-900">{asset.assignedTo || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Serial Number:</span>
                      <span className="font-mono font-semibold text-slate-700">{asset.serialNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Location:</span>
                      <span className="font-semibold text-slate-700">{asset.location || 'N/A'}</span>
                    </div>
                    {asset.maintenanceDue && (
                      <div className="flex items-center justify-between text-amber-600 bg-amber-50/50 p-2 rounded-lg border border-amber-100 mt-2">
                        <span className="flex items-center gap-1 font-bold">
                          <Calendar className="h-3.5 w-3.5" />
                          Next Service:
                        </span>
                        <span className="font-semibold">{new Date(asset.maintenanceDue).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- FORM MODALS --- */}

      {/* 1. Register/Edit Supplier Modal */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="vendor-modal">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {vendorForm.id ? 'Edit Supplier Profile' : 'Register New Supplier'}
              </h3>
              <button onClick={() => setIsVendorModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleVendorSubmit} className="space-y-4" id="vendor-form">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Company Name</label>
                  <input
                    type="text"
                    required
                    value={vendorForm.companyName}
                    onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    id="v-form-company"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={vendorForm.contactPerson}
                    onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    id="v-form-contact"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    id="v-form-email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    id="v-form-phone"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Tax Reference (VAT/TIN)</label>
                  <input
                    type="text"
                    value={vendorForm.taxNumber}
                    onChange={(e) => setVendorForm({ ...vendorForm, taxNumber: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    id="v-form-tax"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Payment Terms</label>
                  <select
                    value={vendorForm.paymentTerms}
                    onChange={(e) => setVendorForm({ ...vendorForm, paymentTerms: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    id="v-form-terms"
                  >
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Address</label>
                <textarea
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  id="v-form-address"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition"
                  id="v-form-submit-btn"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Stock Entry / Inventory Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="item-modal">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {itemForm.id ? 'Edit Inventory Item Details' : 'Register New Inventory Stock Entry'}
              </h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleItemSubmit} className="space-y-4 text-slate-700" id="item-form">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Item Name</label>
                <input
                  type="text"
                  required
                  value={itemForm.itemName}
                  onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  id="itm-form-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Category</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    id="itm-form-cat"
                  >
                    <option value="General IT">General IT</option>
                    <option value="Laboratory Science">Laboratory Science</option>
                    <option value="Hostel Utilities">Hostel Utilities</option>
                    <option value="Library Books">Library Books</option>
                    <option value="Offices Supply">Offices Supply</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Warehouse Depot</label>
                  <select
                    value={itemForm.warehouse}
                    onChange={(e) => setItemForm({ ...itemForm, warehouse: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    id="itm-form-wh"
                  >
                    <option value="Main Warehouse">Main Warehouse</option>
                    <option value="Lab Warehouse">Lab Warehouse</option>
                    <option value="Library Deposit">Library Deposit</option>
                    <option value="Hostel Depot">Hostel Depot</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={itemForm.availableStock}
                    onChange={(e) => setItemForm({ ...itemForm, availableStock: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    id="itm-form-stock"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Safety Limit (Reorder)</label>
                  <input
                    type="number"
                    required
                    value={itemForm.reorderLevel}
                    onChange={(e) => setItemForm({ ...itemForm, reorderLevel: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    id="itm-form-reorder"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Unit of Measurement</label>
                  <input
                    type="text"
                    required
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    id="itm-form-unit"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Purchase Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={itemForm.purchasePrice}
                    onChange={(e) => setItemForm({ ...itemForm, purchasePrice: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    id="itm-form-price"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Associated Supplier</label>
                  <select
                    value={itemForm.supplierId}
                    onChange={(e) => setItemForm({ ...itemForm, supplierId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    id="itm-form-supp"
                  >
                    <option value="">No Supplier</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.companyName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Description</label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  id="itm-form-desc"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition"
                  id="itm-form-submit-btn"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Inter-Warehouse Stock Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="transfer-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Inter-Warehouse Transfer</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleTransferSubmit} className="space-y-4" id="transfer-form">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Select Stock Item</label>
                <select
                  required
                  value={transferForm.itemId}
                  onChange={(e) => {
                    const selItem = inventory.find(it => it.id === Number(e.target.value));
                    setTransferForm({ 
                      ...transferForm, 
                      itemId: e.target.value,
                      fromWarehouse: selItem ? selItem.warehouse : 'Main Warehouse'
                    });
                  }}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  id="tr-form-item"
                >
                  <option value="">-- Choose Stock Item --</option>
                  {inventory.map(it => (
                    <option key={it.id} value={it.id}>{it.itemName} ({it.itemCode}) - {it.warehouse}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">From Depot</label>
                  <input
                    type="text"
                    disabled
                    value={transferForm.fromWarehouse}
                    className="w-full mt-1 px-3 py-2 border border-slate-100 bg-slate-50 text-slate-500 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Destination Depot</label>
                  <select
                    value={transferForm.toWarehouse}
                    onChange={(e) => setTransferForm({ ...transferForm, toWarehouse: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    id="tr-form-to"
                  >
                    <option value="Main Warehouse">Main Warehouse</option>
                    <option value="Lab Warehouse">Lab Warehouse</option>
                    <option value="Library Deposit">Library Deposit</option>
                    <option value="Hostel Depot">Hostel Depot</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Transfer Quantity</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  id="tr-form-qty"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition"
                  id="tr-form-submit-btn"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. New Purchase Order Requisition Modal */}
      {isPOModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto" id="po-modal">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-xl border border-slate-200/80 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">New Purchase Order Requisition</h3>
              <button onClick={() => setIsPOModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handlePOSubmit} className="space-y-6" id="po-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Target Supplier</label>
                  <select
                    required
                    value={poForm.vendorId}
                    onChange={(e) => setPOForm({ ...poForm, vendorId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    id="po-form-vendor"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.companyName} ({v.vendorCode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Target Delivery Date</label>
                  <input
                    type="date"
                    value={poForm.expectedDelivery}
                    onChange={(e) => setPOForm({ ...poForm, expectedDelivery: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    id="po-form-date"
                  />
                </div>
              </div>

              {/* Dynamic Line Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Purchase Line Items</h4>
                  <button
                    type="button"
                    onClick={addPOItem}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-md transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Line Item
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {poForm.items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-end bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">SKU Code</label>
                        <input
                          type="text"
                          required
                          placeholder="SKU Code"
                          value={item.itemCode}
                          onChange={(e) => updatePOItemValue(index, 'itemCode', e.target.value)}
                          className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white font-mono"
                        />
                      </div>
                      <div className="flex-2 min-w-[200px]">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Item Description</label>
                        <input
                          type="text"
                          required
                          placeholder="What item description"
                          value={item.itemName}
                          onChange={(e) => updatePOItemValue(index, 'itemName', e.target.value)}
                          className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white font-semibold"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={item.quantity}
                          onChange={(e) => updatePOItemValue(index, 'quantity', Number(e.target.value))}
                          className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Unit Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.unitPrice}
                          onChange={(e) => updatePOItemValue(index, 'unitPrice', Number(e.target.value))}
                          className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white font-mono"
                        />
                      </div>
                      {poForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePOItem(index)}
                          className="p-2 hover:bg-rose-100 text-rose-500 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimate Preview Box */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                <span className="text-xs text-indigo-700/80 font-medium">Automatic Calculations applied: standard ERP VAT at 17%.</span>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Estimated Grand Total</span>
                  <span className="font-extrabold text-slate-900 text-xl font-mono">
                    ${(poForm.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * 1.17).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPOModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition"
                  id="po-form-submit"
                >
                  Submit Order Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Process Goods Receipt (GRN) Modal */}
      {isGRNModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto" id="grn-modal">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-xl border border-slate-200/80 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create Goods Receipt Note (GRN)</h3>
              <button onClick={() => setIsGRNModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleGRNSubmit} className="space-y-6" id="grn-form">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Processing Receipt Remarks</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. All units pristine quality, checked by IT dept."
                  value={grnForm.remarks}
                  onChange={(e) => setGRNForm({ ...grnForm, remarks: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  id="grn-remarks-input"
                />
              </div>

              {/* Received quantities map */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select quantities being received</h4>
                <div className="space-y-3">
                  {grnForm.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 items-end">
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 font-mono block">{item.itemCode}</span>
                        <span className="text-xs font-semibold text-slate-700 block mt-0.5">{item.itemName}</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Quantity Received</label>
                        <input
                          type="number"
                          max={item.quantity}
                          min={0}
                          required
                          value={item.receivedQuantity}
                          onChange={(e) => updateGRNItemValue(index, 'receivedQuantity', Number(e.target.value))}
                          className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Target Warehouse</label>
                        <select
                          value={item.warehouse}
                          onChange={(e) => updateGRNItemValue(index, 'warehouse', e.target.value)}
                          className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white font-semibold"
                        >
                          <option value="Main Warehouse">Main Warehouse</option>
                          <option value="Lab Warehouse">Lab Warehouse</option>
                          <option value="Library Deposit">Library Deposit</option>
                          <option value="Hostel Depot">Hostel Depot</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGRNModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition"
                  id="grn-form-submit"
                >
                  Submit GRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Register Fixed Asset Modal */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="asset-modal">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Register Fixed Asset</h3>
              <button onClick={() => setIsAssetModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleAssetSubmit} className="space-y-4" id="asset-form">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quad-Core Computing Node v1"
                  value={assetForm.assetName}
                  onChange={(e) => setAssetForm({ ...assetForm, assetName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  id="ast-form-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Category</label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    id="ast-form-cat"
                  >
                    <option value="Hardware">Hardware & Servers</option>
                    <option value="Furniture">Furniture & Lab Desks</option>
                    <option value="Vehicles">Campus Vehicles</option>
                    <option value="Scientific Equip">Scientific Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Serial Number (S/N)</label>
                  <input
                    type="text"
                    required
                    placeholder="S/N ID"
                    value={assetForm.serialNumber}
                    onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    id="ast-form-serial"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Acquisition Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={assetForm.purchaseCost}
                    onChange={(e) => setAssetForm({ ...assetForm, purchaseCost: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    id="ast-form-cost"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Acquisition Date</label>
                  <input
                    type="date"
                    required
                    value={assetForm.purchaseDate}
                    onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    id="ast-form-date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Depreciation Method</label>
                  <select
                    value={assetForm.depreciationMethod}
                    onChange={(e) => setAssetForm({ ...assetForm, depreciationMethod: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    id="ast-form-dep"
                  >
                    <option value="StraightLine">Straight Line (10% Annual)</option>
                    <option value="DecliningBalance">Double Declining Balance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Physical Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Block 3rd Floor"
                    value={assetForm.location}
                    onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    id="ast-form-loc"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition"
                  id="asset-form-submit"
                >
                  Register Fixed Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Assign Asset Modal */}
      {isAssignAssetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="assign-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Assign Campus Asset</h3>
              <button onClick={() => setIsAssignAssetModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleAssignAsset} className="space-y-4" id="assign-asset-form">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Select Available Asset</label>
                <select
                  required
                  value={assignAssetForm.assetId}
                  onChange={(e) => setAssignAssetForm({ ...assignAssetForm, assetId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  id="as-form-id"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.filter(as => as.status === 'Available').map(as => (
                    <option key={as.id} value={as.id}>{as.assetName} ({as.assetCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Assignee Entity Name / Department</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. John Watson / Physics Department"
                  value={assignAssetForm.assignedTo}
                  onChange={(e) => setAssignAssetForm({ ...assignAssetForm, assignedTo: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  id="as-form-to"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Assignment Classification</label>
                  <select
                    value={assignAssetForm.assignedType}
                    onChange={(e) => setAssignAssetForm({ ...assignAssetForm, assignedType: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    id="as-form-type"
                  >
                    <option value="Staff">Faculty / Staff Member</option>
                    <option value="Department">Department Lab Allocation</option>
                    <option value="Student">Student Research Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Notes / Remarks</label>
                  <input
                    type="text"
                    value={assignAssetForm.remarks}
                    onChange={(e) => setAssignAssetForm({ ...assignAssetForm, remarks: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    id="as-form-remarks"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignAssetModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition"
                  id="assign-form-submit"
                >
                  Submit Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Schedule Maintenance Modal */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="maintenance-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Schedule Asset Maintenance</h3>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleScheduleMaintenance} className="space-y-4" id="maint-form">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Select Target Asset</label>
                <select
                  required
                  value={maintenanceForm.assetId}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, assetId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  id="maint-asset-select"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(as => (
                    <option key={as.id} value={as.id}>{as.assetName} ({as.assetCode}) - {as.status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Maintenance Service Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual hardware tune-up & memory stress diagnostics test."
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  id="maint-desc-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={maintenanceForm.maintenanceDate}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenanceDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    id="maint-date-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Assigned Service Engineer</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IBM Service Labs / Tech Staff"
                    value={maintenanceForm.performedBy}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performedBy: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    id="maint-perf-input"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition"
                  id="maint-form-submit"
                >
                  Schedule Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Visual Label Display Modal (Prints Barcode / QR Label Component) */}
      {selectedLabelItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="label-creator-modal">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-indigo-600" />
                Physical ERP Tracking Label
              </h3>
              <button onClick={() => setSelectedLabelItem(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>

            <div className="bg-white border-2 border-dashed border-slate-300 p-4 rounded-xl flex flex-col items-center space-y-4" id="physical-label">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">Smart University Asset Tag</span>
              
              {/* Simulated Elegant Vector QR Code */}
              <div className="w-32 h-32 bg-slate-100 rounded-lg p-2 flex items-center justify-center border border-slate-200">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                  <rect width="100" height="100" fill="none" />
                  {/* Outer corner squares */}
                  <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                  <rect x="10" y="10" width="15" height="15" fill="white" />
                  <rect x="12" y="12" width="11" height="11" fill="currentColor" />

                  <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                  <rect x="75" y="10" width="15" height="15" fill="white" />
                  <rect x="77" y="12" width="11" height="11" fill="currentColor" />

                  <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                  <rect x="10" y="75" width="15" height="15" fill="white" />
                  <rect x="12" y="77" width="11" height="11" fill="currentColor" />

                  {/* Tiny corner alignment pattern */}
                  <rect x="75" y="75" width="10" height="10" fill="currentColor" />
                  <rect x="77" y="77" width="6" height="6" fill="white" />
                  <rect x="79" y="79" width="2" height="2" fill="currentColor" />

                  {/* Randomized realistic QR data dots */}
                  <rect x="35" y="10" width="5" height="5" fill="currentColor" /><rect x="45" y="5" width="10" height="5" fill="currentColor" /><rect x="60" y="15" width="5" height="10" fill="currentColor" />
                  <rect x="10" y="35" width="15" height="5" fill="currentColor" /><rect x="5" y="45" width="5" height="10" fill="currentColor" /><rect x="20" y="55" width="10" height="5" fill="currentColor" />
                  <rect x="35" y="35" width="30" height="30" fill="currentColor" />
                  <rect x="40" y="40" width="10" height="10" fill="white" />
                  <rect x="55" y="45" width="5" height="15" fill="white" />
                  <rect x="35" y="75" width="15" height="5" fill="currentColor" /><rect x="40" y="85" width="10" height="10" fill="currentColor" />
                  <rect x="70" y="45" width="5" height="15" fill="currentColor" /><rect x="85" y="35" width="10" height="10" fill="currentColor" />
                  <rect x="60" y="80" width="10" height="5" fill="currentColor" /><rect x="80" y="60" width="5" height="15" fill="currentColor" />
                </svg>
              </div>

              {/* Text Meta info */}
              <div className="text-center">
                <span className="text-xs font-bold text-slate-800">{selectedLabelItem.itemName}</span>
                <span className="font-mono text-[10px] text-slate-500 block mt-0.5">{selectedLabelItem.itemCode || selectedLabelItem.assetCode}</span>
                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{selectedLabelItem.barcode}</span>
              </div>

              {/* Simulated Elegant Vector Barcode */}
              <div className="w-full flex justify-center pt-2 border-t border-slate-100">
                <div className="h-10 w-48 flex items-end justify-between px-2">
                  {[4, 2, 8, 1, 6, 2, 4, 1, 8, 4, 2, 1, 6, 8, 2, 1, 4, 6, 2, 8, 1, 4, 8, 2, 6, 1, 4, 2, 8].map((thickness, index) => (
                    <div 
                      key={index} 
                      style={{ width: `${thickness}px` }} 
                      className="bg-slate-900 h-full inline-block"
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
              }}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-all"
              id="print-physical-tag"
            >
              Print Physically (PDF / AirPrint)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default ProcurementPage;
