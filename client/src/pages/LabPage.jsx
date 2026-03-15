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
  FlaskConical,
  Activity,
  Users
} from 'lucide-react';

const COMMON_TESTS = [
  { code: 'CBC', name: 'Complete Blood Count' },
  { code: 'BMP', name: 'Basic Metabolic Panel' },
  { code: 'LFT', name: 'Liver Function Test' },
  { code: 'RFT', name: 'Renal Function Test' },
  { code: 'GLUCOSE', name: 'Fasting Blood Glucose' },
  { code: 'LIPID', name: 'Lipid Profile' },
  { code: 'TSH', name: 'Thyroid Stimulating Hormone' },
  { code: 'UA', name: 'Urinalysis' },
  { code: 'XRAY', name: 'Chest X-Ray' },
  { code: 'ECG', name: 'Electrocardiogram' },
];

export default function LabPage({ tenant }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showResultModal, setShowResultModal] = useState(null);
  const [resultText, setResultText] = useState('');
  const [criticalFlag, setCriticalFlag] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadOrders();
  }, [activeTab, tenant]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'all' ? null : activeTab;
      const data = await api.getLabOrders(tenant?.id, status);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load lab orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.updateLabOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleSubmitResult = async () => {
    if (!resultText.trim()) return;
    setSubmittingResult(true);
    try {
      await api.recordLabResults(showResultModal.id, {
        results: resultText,
        criticalFlag,
      });
      setShowResultModal(null);
      setResultText('');
      setCriticalFlag(false);
      loadOrders();
    } catch (err) {
      alert('Failed to record result: ' + err.message);
    } finally {
      setSubmittingResult(false);
    }
  };

  const handlePrint = (order) => {
    const parsed = order.notes ? JSON.parse(order.notes) : {};
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Lab Report - ${order.patient_first_name} ${order.patient_last_name}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .report-title { font-size: 24px; font-weight: bold; color: #0f172a; margin-bottom: 5px; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .meta-item { font-size: 14px; }
            .meta-label { font-weight: bold; color: #64748b; text-transform: uppercase; font-size: 11px; margin-bottom: 2px; }
            .results-area { background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .results-text { font-family: 'JetBrains Mono', monospace; white-space: pre-wrap; margin-top: 15px; }
            .critical { color: #dc2626; border: 2px solid #fecaca; padding: 10px; border-radius: 8px; font-weight: bold; margin-bottom: 20px; }
            .footer { margin-top: 50px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="report-title">LABORATORY INVESTIGATION REPORT</div>
            <div>${tenant?.name || 'Healthcare Facility'}</div>
          </div>
          <div class="meta">
            <div>
              <div class="meta-item"><div class="meta-label">Patient</div>${order.patient_first_name} ${order.patient_last_name}</div>
              <div class="meta-item"><div class="meta-label">Test</div>${order.display || order.code}</div>
              <div class="meta-item"><div class="meta-label">Ordered By</div>${order.ordered_by_name || 'Staff'}</div>
            </div>
            <div>
              <div class="meta-item"><div class="meta-label">Order Date</div>${new Date(order.created_at).toLocaleDateString()}</div>
              <div class="meta-item"><div class="meta-label">Status</div>${order.status}</div>
              <div class="meta-item"><div class="meta-label">Report ID</div>LAB-${order.id}</div>
            </div>
          </div>
          ${parsed?.criticalFlag ? '<div class="critical">⚠️ CRITICAL RESULTS - URGENT ATTENTION REQUIRED</div>' : ''}
          <div class="results-area">
            <div class="meta-label">LABORATORY RESULTS</div>
            <div class="results-text">${parsed?.results || 'Results pending...'}</div>
          </div>
          <div class="footer">
            Generated on ${new Date().toLocaleString()} | Report ID: LAB-${order.id}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredOrders = orders.filter(order => 
    order.patient_first_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    order.patient_last_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    order.display?.toLowerCase().includes(searchValue.toLowerCase()) ||
    order.code?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const tableColumns = [
    { key: 'test', label: 'Test', render: (value, row) => (
      <div>
        <div className="font-medium text-clinical-text">{row.display || row.code}</div>
        <div className="text-xs text-clinical-muted">{row.code}</div>
      </div>
    )},
    { key: 'patient', label: 'Patient', render: (value, row) => (
      <div>
        <div className="font-medium text-clinical-text">
          {row.patient_first_name} {row.patient_last_name}
        </div>
        <div className="text-xs text-clinical-muted">ID: {row.patient_id}</div>
      </div>
    )},
    { key: 'ordered_by', label: 'Ordered By', render: (value, row) => (
      <div className="text-sm">
        {row.ordered_by_name || 'Staff'}
      </div>
    )},
    { key: 'created_at', label: 'Date', render: (value, row) => (
      <div className="text-sm">
        {new Date(row.created_at).toLocaleDateString()}
      </div>
    )},
    { key: 'status', label: 'Status', render: (value, row) => {
      const parsed = row.notes ? JSON.parse(row.notes) : null;
      return (
        <div className="flex items-center gap-2">
          <StatusBadge status={row.status} />
          {parsed?.criticalFlag && (
            <StatusBadge status="critical" size="sm" />
          )}
        </div>
      );
    }},
  ];

  const tableActions = [
    { icon: Eye, label: 'View Details', onClick: (row) => console.log('View', row) },
    { icon: Edit, label: 'Edit', onClick: (row) => console.log('Edit', row) },
    { icon: Download, label: 'Download', onClick: (row) => handlePrint(row) },
  ];

  const metrics = {
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => o.status === 'in-progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    critical: orders.filter(o => {
      const parsed = o.notes ? JSON.parse(o.notes) : null;
      return parsed?.criticalFlag;
    }).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <SectionHeader
        title="Laboratory Services"
        subtitle="Diagnostic testing and pathology management"
        badge={`${orders.length} Tests`}
        showSearch
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        actions={[
          { label: 'New Order', icon: Plus, variant: 'primary', onClick: () => console.log('New order') },
          { label: 'Export', icon: Download, variant: 'secondary', onClick: () => console.log('Export') },
        ]}
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Pending Analysis"
          value={metrics.pending}
          icon={Clock}
          change="Awaiting processing"
          trend="down"
          accent="warning"
        />
        <MetricCard
          label="In Progress"
          value={metrics.inProgress}
          icon={Play}
          change="Active processing"
          trend="up"
          accent="info"
        />
        <MetricCard
          label="Completed Today"
          value={metrics.completed}
          icon={CheckCircle}
          change="Finished tests"
          trend="up"
          accent="success"
        />
        <MetricCard
          label="Critical Results"
          value={metrics.critical}
          icon={AlertCircle}
          change="Requires attention"
          trend="down"
          accent="error"
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-clinical-bg rounded-lg p-1">
        {['pending', 'in-progress', 'completed', 'all'].map(tab => (
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
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lab Orders Table */}
        <div className="lg:col-span-2">
          <SubSectionHeader
            title="Lab Orders"
            subtitle={`${filteredOrders.length} orders found`}
            badge={activeTab}
          />
          
          <DataTable
            data={filteredOrders}
            columns={tableColumns}
            loading={loading}
            emptyMessage="No lab orders found"
            actions={tableActions}
            onRowClick={(row) => setShowResultModal(row)}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <ActionCard
            title="Quick Actions"
            description="Common laboratory tasks"
            icon={FlaskConical}
          >
            <div className="space-y-3">
              <button className="w-full btn-secondary text-left justify-start">
                <Plus className="w-4 h-4" />
                New Lab Order
              </button>
              <button className="w-full btn-secondary text-left justify-start">
                <Users className="w-4 h-4" />
                Patient Lookup
              </button>
              <button className="w-full btn-secondary text-left justify-start">
                <Activity className="w-4 h-4" />
                Test Queue
              </button>
            </div>
          </ActionCard>

          {/* Common Tests Reference */}
          <div className="clinical-card p-6">
            <SubSectionHeader
              title="Common Tests"
              subtitle="Quick reference"
            />
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {COMMON_TESTS.map(test => (
                <div key={test.code} className="flex justify-between items-center py-2 border-b border-clinical-border/50">
                  <span className="font-mono text-sm font-medium text-medical-blue">{test.code}</span>
                  <span className="text-xs text-clinical-muted text-right">{test.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Result Entry Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-pro overflow-hidden flex flex-col animate-slide-up">
            <div className="p-6 border-b border-clinical-border flex justify-between items-center">
              <h3 className="text-xl font-bold text-clinical-text">
                Record Lab Results
              </h3>
              <button
                onClick={() => setShowResultModal(null)}
                className="w-10 h-10 rounded-full hover:bg-clinical-bg flex items-center justify-center transition-colors text-clinical-muted"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-clinical-bg p-4 rounded-lg">
                <div className="text-sm text-clinical-muted">Patient</div>
                <div className="font-medium text-clinical-text">
                  {showResultModal.patient_first_name} {showResultModal.patient_last_name}
                </div>
                <div className="text-sm text-clinical-muted mt-1">
                  Test: {showResultModal.display || showResultModal.code}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-clinical-text mb-2">
                  Lab Results
                </label>
                <textarea
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  className="w-full h-32 px-3 py-2 border border-clinical-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue"
                  placeholder="Enter lab results..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="critical"
                  checked={criticalFlag}
                  onChange={(e) => setCriticalFlag(e.target.checked)}
                  className="rounded border-clinical-border text-medical-blue focus:ring-medical-blue/20"
                />
                <label htmlFor="critical" className="text-sm font-medium text-clinical-text">
                  Mark as critical results
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-clinical-border flex justify-end gap-3">
              <button
                onClick={() => setShowResultModal(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResult}
                disabled={submittingResult || !resultText.trim()}
                className="btn-primary"
              >
                {submittingResult ? 'Saving...' : 'Save Results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
