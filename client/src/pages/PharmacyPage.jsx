import { useState, useEffect } from 'react';
import { api } from '../api.js';
import MetricCard from '../components/MetricCard';
import { 
  StatusBadge, 
  ActionCard, 
  SectionHeader, 
  SubSectionHeader, 
  DataTable 
} from '../components/ui';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Eye,
  Edit,
  Trash2,
  Pill,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

export default function PharmacyPage({ tenant, onDispense }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');
  const [searchValue, setSearchValue] = useState('');
  const [showDispenseModal, setShowDispenseModal] = useState(null);

  useEffect(() => {
    if (activeTab === 'queue') {
      loadQueue();
    }
  }, [activeTab, tenant]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getPharmacyQueue(tenant.id);
      setQueue(res.data || []);
    } catch (err) {
      console.error(err);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDispenseItem = async (prescriptionId, item) => {
    if (!confirm(`Finalize dispensation of ${item.generic_name}?`)) return;
    try {
      await api.dispenseMedication(tenant.id, {
        prescriptionItemId: item.item_id,
        drugId: item.drug_id,
        quantity: item.quantity_prescribed
      });
      loadQueue();
      if (onDispense) onDispense();
    } catch (err) {
      alert('Dispensation Error: ' + err.message);
    }
  };

  const filteredQueue = queue.filter(item => 
    item.patient_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.generic_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.brand_name?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const queueColumns = [
    { key: 'medication', label: 'Medication', render: (value, row) => (
      <div>
        <div className="font-medium text-clinical-text">{row.generic_name}</div>
        <div className="text-xs text-clinical-muted">{row.brand_name}</div>
      </div>
    )},
    { key: 'patient', label: 'Patient', render: (value, row) => (
      <div>
        <div className="font-medium text-clinical-text">{row.patient_name}</div>
        <div className="text-xs text-clinical-muted">ID: {row.patient_id}</div>
      </div>
    )},
    { key: 'quantity', label: 'Quantity', render: (value, row) => (
      <div className="text-sm">
        {row.quantity_prescribed} {row.unit || 'units'}
      </div>
    )},
    { key: 'prescribed_by', label: 'Prescribed By', render: (value, row) => (
      <div className="text-sm">
        {row.prescribed_by_name || 'Staff'}
      </div>
    )},
    { key: 'status', label: 'Status', render: (value, row) => (
      <StatusBadge status={row.status || 'pending'} />
    )},
  ];

  const queueActions = [
    { icon: Eye, label: 'View Details', onClick: (row) => console.log('View', row) },
    { icon: Package, label: 'Dispense', onClick: (row) => handleDispenseItem(row.prescription_id, row) },
  ];

  const metrics = {
    pending: queue.filter(item => item.status === 'pending').length,
    ready: queue.filter(item => item.status === 'ready').length,
    dispensed: queue.filter(item => item.status === 'dispensed').length,
    critical: queue.filter(item => item.priority === 'high').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <SectionHeader
        title="Pharmacy Services"
        subtitle="Medication dispensing and inventory management"
        badge={`${queue.length} Prescriptions`}
        showSearch
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        actions={[
          { label: 'New Prescription', icon: Plus, variant: 'primary', onClick: () => console.log('New prescription') },
          { label: 'Inventory', icon: Package, variant: 'secondary', onClick: () => console.log('Inventory') },
        ]}
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Pending Dispensing"
          value={metrics.pending}
          icon={Clock}
          change="Awaiting processing"
          trend="down"
          accent="warning"
        />
        <MetricCard
          label="Ready for Pickup"
          value={metrics.ready}
          icon={CheckCircle}
          change="Prepared medications"
          trend="up"
          accent="success"
        />
        <MetricCard
          label="Dispensed Today"
          value={metrics.dispensed}
          icon={Package}
          change="Completed orders"
          trend="up"
          accent="info"
        />
        <MetricCard
          label="Priority Orders"
          value={metrics.critical}
          icon={AlertCircle}
          change="High priority"
          trend="down"
          accent="error"
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-clinical-bg rounded-lg p-1">
        {['queue', 'inventory', 'alerts', 'procurement'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all
              ${activeTab === tab
                ? 'bg-white text-clinical-text shadow-sm'
                : 'text-clinical-muted hover:text-clinical-text'
              }
            `}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          <SubSectionHeader
            title="Prescription Queue"
            subtitle={`${filteredQueue.length} prescriptions in queue`}
            badge="Active"
          />
          
          <DataTable
            data={filteredQueue}
            columns={queueColumns}
            loading={loading}
            emptyMessage="No prescriptions in queue"
            actions={queueActions}
            onRowClick={(row) => setShowDispenseModal(row)}
          />
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <SubSectionHeader
            title="Medication Inventory"
            subtitle="Stock levels and availability"
            actions={[
              { icon: Plus, label: 'Add Medication', onClick: () => console.log('Add medication') },
              { icon: Download, label: 'Export Inventory', onClick: () => console.log('Export') },
            ]}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ActionCard
              title="Low Stock Alerts"
              description="Medications requiring reorder"
              icon={AlertCircle}
              variant="danger"
              onClick={() => console.log('View low stock')}
            >
              <div className="text-2xl font-bold text-error">12</div>
              <div className="text-sm text-clinical-muted">items below minimum</div>
            </ActionCard>
            
            <ActionCard
              title="Expiring Soon"
              description="Medications nearing expiration"
              icon={Clock}
              variant="warning"
              onClick={() => console.log('View expiring')}
            >
              <div className="text-2xl font-bold text-warning">8</div>
              <div className="text-sm text-clinical-muted">expire in 30 days</div>
            </ActionCard>
            
            <ActionCard
              title="Total Inventory"
              description="Current medication stock value"
              icon={Package}
              variant="success"
              onClick={() => console.log('View inventory')}
            >
              <div className="text-2xl font-bold text-success">$45,280</div>
              <div className="text-sm text-clinical-muted">total value</div>
            </ActionCard>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <SubSectionHeader
            title="Pharmacy Alerts"
            subtitle="System notifications and warnings"
          />
          
          <div className="space-y-4">
            <ActionCard
              title="Critical Medication Shortage"
              description="Amoxicillin 500mg is out of stock"
              icon={AlertCircle}
              variant="danger"
            />
            <ActionCard
              title="High Priority Prescription"
              description="Emergency medication requires immediate dispensing"
              icon={Activity}
              variant="warning"
            />
            <ActionCard
              title="Inventory Reconciliation Required"
              description="Monthly stock audit due this week"
              icon={FileText}
              variant="info"
            />
          </div>
        </div>
      )}

      {/* Procurement Tab */}
      {activeTab === 'procurement' && (
        <div className="space-y-6">
          <SubSectionHeader
            title="Procurement Management"
            subtitle="Purchase orders and vendor management"
            actions={[
              { icon: Plus, label: 'New Purchase Order', onClick: () => console.log('New PO') },
              { icon: ShoppingCart, label: 'Vendor Directory', onClick: () => console.log('Vendors') },
            ]}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActionCard
              title="Pending Purchase Orders"
              description="Orders awaiting processing"
              icon={ShoppingCart}
            >
              <div className="text-2xl font-bold text-clinical-text">5</div>
              <div className="text-sm text-clinical-muted">orders pending</div>
            </ActionCard>
            
            <ActionCard
              title="Active Vendors"
              description="Current supplier relationships"
              icon={Users}
            >
              <div className="text-2xl font-bold text-clinical-text">18</div>
              <div className="text-sm text-clinical-muted">active vendors</div>
            </ActionCard>
          </div>
        </div>
      )}

      {/* Dispense Modal */}
      {showDispenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-pro overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-clinical-border">
              <h3 className="text-xl font-bold text-clinical-text">
                Dispense Medication
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-clinical-bg p-4 rounded-lg">
                <div className="text-sm text-clinical-muted">Patient</div>
                <div className="font-medium text-clinical-text">
                  {showDispenseModal.patient_name}
                </div>
                <div className="text-sm text-clinical-muted mt-1">
                  Medication: {showDispenseModal.generic_name}
                </div>
                <div className="text-sm text-clinical-muted">
                  Quantity: {showDispenseModal.quantity_prescribed} {showDispenseModal.unit || 'units'}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-clinical-text mb-2">
                    Dispensed Quantity
                  </label>
                  <input
                    type="number"
                    defaultValue={showDispenseModal.quantity_prescribed}
                    className="w-full px-3 py-2 border border-clinical-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-clinical-text mb-2">
                    Notes
                  </label>
                  <textarea
                    className="w-full h-20 px-3 py-2 border border-clinical-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue"
                    placeholder="Add dispensing notes..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-clinical-border flex justify-end gap-3">
              <button
                onClick={() => setShowDispenseModal(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDispenseItem(showDispenseModal.prescription_id, showDispenseModal)}
                className="btn-primary"
              >
                Confirm Dispense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
