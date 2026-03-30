import { useState, useMemo, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { 
  Plus, Search, Package, AlertCircle, CheckCircle, Clock, Eye, Activity,
  ShoppingCart, Users, Filter, ArrowRight, ShieldCheck, Pill, BrainCircuit,
  Sparkles, Loader2, AlertTriangle, TrendingDown, TrendingUp, Calendar,
  FileText, BarChart3, Thermometer, Heart, ActivitySquare
} from 'lucide-react';
import { currency } from '../utils/format.js';
import { 
  getEnhancedPharmacyInventory,
  getEnhancedPrescriptions,
  checkDrugInteractions,
  createPharmacyDispensing,
  addDispensingItem,
  getPharmacyDashboard,
  getExpiringDrugs
} from '../api.js';

export default function EnhancedPharmacyPage({ tenant }) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'inventory', 'prescriptions', 'dispensing'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);
  const [showDispenseModal, setShowDispenseModal] = useState(null);
  const [showInteractionModal, setShowInteractionModal] = useState(null);
  const [interactionResults, setInteractionResults] = useState([]);
  const [interactionLoading, setInteractionLoading] = useState(false);

  // Data states
  const [dashboard, setDashboard] = useState({});
  const [inventory, setInventory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [expiringDrugs, setExpiringDrugs] = useState([]);

  // Load data based on active tab
  useEffect(() => {
    if (!tenant?.id) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        switch (activeTab) {
          case 'dashboard':
            const dashboardData = await getPharmacyDashboard(tenant.id);
            setDashboard(dashboardData);
            break;
          case 'inventory':
            const inventoryData = await getEnhancedPharmacyInventory(tenant.id, { 
              stockStatus: stockFilter,
              genericName: searchTerm
            });
            setInventory(inventoryData);
            break;
          case 'prescriptions':
            const prescriptionsData = await getEnhancedPrescriptions(tenant.id, { 
              status: statusFilter,
              prescriptionNumber: searchTerm
            });
            setPrescriptions(prescriptionsData);
            break;
          case 'expiring':
            const expiringData = await getExpiringDrugs(tenant.id, 90);
            setExpiringDrugs(expiringData);
            break;
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenant?.id, activeTab, statusFilter, stockFilter, searchTerm]);

  const filteredInventory = useMemo(() => {
    if (!searchTerm && !stockFilter) return inventory;
    return inventory.filter(item => {
      const matchesSearch = !searchTerm || 
        item.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStock = !stockFilter || {
        'CRITICAL': item.current_stock <= item.minimum_stock_level,
        'LOW': item.current_stock <= item.reorder_level && item.current_stock > item.minimum_stock_level,
        'EXPIRING_SOON': item.expiry_date <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        'NORMAL': item.current_stock > item.reorder_level && item.expiry_date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }[stockFilter] || false;
      
      return matchesSearch && matchesStock;
    });
  }, [inventory, searchTerm, stockFilter]);

  const selectedPrescription = useMemo(() => 
    prescriptions.find(p => p.id === selectedPrescriptionId), 
    [prescriptions, selectedPrescriptionId]
  );

  const handleDrugInteractionCheck = async (prescription) => {
    setSelectedPrescriptionId(prescription.id);
    setShowInteractionModal(true);
    setInteractionLoading(true);
    
    try {
      const drugIds = prescription.medicines.map(m => m.drug_id);
      const interactions = await checkDrugInteractions(tenant.id, drugIds);
      setInteractionResults(interactions);
      showToast('Drug interaction check completed', 'info');
    } catch (error) {
      console.error('Error checking interactions:', error);
      showToast('Failed to check drug interactions', 'error');
    } finally {
      setInteractionLoading(false);
    }
  };

  const handleDispense = async (prescription) => {
    setSelectedPrescriptionId(prescription.id);
    setShowDispenseModal(prescription);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'MAJOR': return 'text-red-600 bg-red-50';
      case 'MODERATE': return 'text-amber-600 bg-amber-50';
      case 'MINOR': return 'text-blue-600 bg-blue-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      case 'LOW': return 'text-amber-600 bg-amber-50';
      case 'EXPIRING_SOON': return 'text-orange-600 bg-orange-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  if (loading) {
    return (
      <div className="page-shell-premium animate-fade-in flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Pill className="w-12 h-12 text-green-300 animate-pulse mx-auto mb-4" />
          <p className="text-slate-500">Loading Pharmacy Module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell-premium animate-fade-in">
      {/* Header */}
      <header className="page-header-premium mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title-rich flex items-center gap-3">
              <Pill className="w-8 h-8 text-green-500" />
              Pharmacy & Drug Management
              <span className="text-meta-sm bg-green-600 text-white px-3 py-1 rounded-full border border-white/10 shadow-lg shadow-green-500/20">
                Healthcare Standards Compliant
              </span>
            </h1>
            <p className="dim-label italic">
              Pharmacy Act compliant drug management, prescription processing, and clinical safety for {tenant?.name || 'Healthcare Facility'}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary py-2 px-4 text-[10px] uppercase tracking-widest">
              <FileText className="w-4 h-4 mr-2" />
              Inventory Report
            </button>
            <button className="btn-secondary py-2 px-4 text-[10px] uppercase tracking-widest">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl mb-8">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
          { id: 'expiring', label: 'Expiring Drugs', icon: AlertTriangle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-slate-500">Total Items</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{dashboard.total_inventory_items || 0}</h3>
              <p className="text-sm text-slate-600">Inventory Items</p>
            </div>

            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-slate-500">Critical</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{dashboard.critical_stock_items || 0}</h3>
              <p className="text-sm text-slate-600">Low Stock Items</p>
            </div>

            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-slate-500">Active</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{dashboard.active_prescriptions || 0}</h3>
              <p className="text-sm text-slate-600">Prescriptions</p>
            </div>

            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-slate-500">Revenue</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{currency(dashboard.today_revenue || 0)}</h3>
              <p className="text-sm text-slate-600">Today's Sales</p>
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Stock Alerts
              </h3>
              <div className="space-y-3">
                {inventory.filter(item => item.stock_status === 'CRITICAL').slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{item.generic_name}</div>
                      <div className="text-xs text-slate-500">{item.brand_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">{item.current_stock}</div>
                      <div className="text-xs text-slate-500">Min: {item.minimum_stock_level}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Expiring Soon
              </h3>
              <div className="space-y-3">
                {inventory.filter(item => item.stock_status === 'EXPIRING_SOON').slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{item.generic_name}</div>
                      <div className="text-xs text-slate-500">Batch: {item.batch_number}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-600">
                        {Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))} days
                      </div>
                      <div className="text-xs text-slate-500">Stock: {item.current_stock}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search drugs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Stock Status</option>
                <option value="CRITICAL">Critical Stock</option>
                <option value="LOW">Low Stock</option>
                <option value="EXPIRING_SOON">Expiring Soon</option>
                <option value="NORMAL">Normal</option>
              </select>
            </div>
            <button className="btn-primary py-2 px-6 text-[10px] uppercase tracking-widest shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Stock
            </button>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Drug</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Batch</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Stock</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">MRP</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Expiry</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInventory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{item.generic_name}</div>
                          <div className="text-xs text-slate-500">{item.brand_name}</div>
                          <div className="flex gap-1 mt-1">
                            {item.drug_is_narcotic && <span className="px-1 py-0.5 bg-red-100 text-red-600 rounded text-[8px]">Narcotic</span>}
                            {item.drug_is_psychotropic && <span className="px-1 py-0.5 bg-purple-100 text-purple-600 rounded text-[8px]">Psychotropic</span>}
                            {item.drug_is_antibiotic && <span className="px-1 py-0.5 bg-blue-100 text-blue-600 rounded text-[8px]">Antibiotic</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{item.batch_number}</div>
                        <div className="text-xs text-slate-500">{item.manufacturer}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{item.current_stock}</span>
                          <span className={`px-2 py-1 rounded text-[10px] font-medium ${getStockStatusColor(item.stock_status)}`}>
                            {item.stock_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{currency(item.mrp)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{new Date(item.expiry_date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                          item.schedule_category === 'H1' ? 'bg-red-50 text-red-600' :
                          item.schedule_category === 'H' ? 'bg-amber-50 text-amber-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {item.schedule_category || 'OTC'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-slate-400 hover:text-green-600 transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search prescriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {prescriptions.map(prescription => (
              <div key={prescription.id} className="glass-panel p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-slate-900">{prescription.prescription_number}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                    prescription.current_status === 'ACTIVE' ? 'bg-green-50 text-green-600' :
                    prescription.current_status === 'COMPLETED' ? 'bg-blue-50 text-blue-600' :
                    prescription.current_status === 'EXPIRED' ? 'bg-red-50 text-red-600' :
                    'bg-slate-50 text-slate-600'
                  }`}>
                    {prescription.current_status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Patient:</span>
                    <span className="font-medium">{prescription.patient_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Doctor:</span>
                    <span className="font-medium">{prescription.doctor_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-medium">{new Date(prescription.prescription_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Medicines:</span>
                    <span className="font-medium">{prescription.medicines?.length || 0}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="text-sm font-medium text-slate-900 mb-2">Medicines:</div>
                  <div className="space-y-2">
                    {prescription.medicines?.slice(0, 3).map((medicine, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-slate-600">{medicine.generic_name}</span>
                        <span className="text-slate-900">{medicine.dosage_instructions}</span>
                      </div>
                    ))}
                    {prescription.medicines?.length > 3 && (
                      <div className="text-sm text-slate-500 italic">
                        +{prescription.medicines.length - 3} more medicines
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button 
                    onClick={() => handleDispense(prescription)}
                    className="flex-1 btn-primary py-2 text-[10px] uppercase tracking-widest"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Dispense
                  </button>
                  <button 
                    onClick={() => handleDrugInteractionCheck(prescription)}
                    className="flex-1 btn-secondary py-2 text-[10px] uppercase tracking-widest"
                  >
                    <BrainCircuit className="w-4 h-4 mr-2" />
                    Check Interactions
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring Drugs Tab */}
      {activeTab === 'expiring' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Expiring Drugs (Next 90 Days)
            </h3>
            <div className="flex gap-2">
              <button className="btn-secondary py-2 px-4 text-[10px] uppercase tracking-widest">
                <FileText className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Drug</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Batch</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Expiry Date</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Days Left</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Stock</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Value</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {expiringDrugs.map(drug => (
                    <tr key={drug.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{drug.generic_name}</div>
                          <div className="text-xs text-slate-500">{drug.brand_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{drug.batch_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{new Date(drug.expiry_date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                          drug.days_to_expiry <= 0 ? 'bg-red-50 text-red-600' :
                          drug.days_to_expiry <= 7 ? 'bg-red-50 text-red-600' :
                          drug.days_to_expiry <= 30 ? 'bg-amber-50 text-amber-600' :
                          'bg-orange-50 text-orange-600'
                        }`}>
                          {drug.days_to_expiry <= 0 ? 'Expired' : `${drug.days_to_expiry} days`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{drug.current_stock}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{currency(drug.current_stock * drug.mrp)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-slate-400 hover:text-green-600 transition-colors">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
