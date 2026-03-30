import { useState, useMemo, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { 
  Building2, Plus, Search, ShieldCheck, ArrowLeft, Send, ExternalLink, Calendar, Hash, User,
  FileText, Clock, AlertCircle, CheckCircle, XCircle, TrendingUp, Users, DollarSign,
  Activity, Filter, Download, Upload, Eye, Edit, Trash2, AlertTriangle
} from 'lucide-react';
import { currency } from '../utils/format.js';
import { 
  getEnhancedInsuranceProviders, 
  createEnhancedInsuranceProvider,
  getInsuranceClaims,
  createInsuranceClaim,
  getPreauthorizationRequests,
  createPreauthorizationRequest,
  getInsuranceDashboard,
  updateClaimStatus,
  updatePreauthStatus
} from '../api.js';

export default function EnhancedInsurancePage({ tenant }) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'providers', 'claims', 'preauth'
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showPreauthModal, setShowPreauthModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Data states
  const [dashboard, setDashboard] = useState({});
  const [providers, setProviders] = useState([]);
  const [claims, setClaims] = useState([]);
  const [preauthRequests, setPreauthRequests] = useState([]);

  // Load data based on active tab
  useEffect(() => {
    if (!tenant?.id) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        switch (activeTab) {
          case 'dashboard':
            const dashboardData = await getInsuranceDashboard(tenant.id);
            setDashboard(dashboardData);
            break;
          case 'providers':
            const providersData = await getEnhancedInsuranceProviders(tenant.id);
            setProviders(providersData);
            break;
          case 'claims':
            const claimsData = await getInsuranceClaims(tenant.id, { status: statusFilter });
            setClaims(claimsData);
            break;
          case 'preauth':
            const preauthData = await getPreauthorizationRequests(tenant.id, { status: statusFilter });
            setPreauthRequests(preauthData);
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
  }, [tenant?.id, activeTab, statusFilter]);

  const filteredProviders = useMemo(() => {
    if (!searchTerm) return providers;
    return providers.filter(p => 
      p.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.provider_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [providers, searchTerm]);

  const filteredClaims = useMemo(() => {
    if (!searchTerm) return claims;
    return claims.filter(c => 
      c.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.provider_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [claims, searchTerm]);

  const selectedProvider = useMemo(() => 
    providers.find(p => p.id === selectedProviderId), 
    [providers, selectedProviderId]
  );

  const selectedClaim = useMemo(() => 
    claims.find(c => c.id === selectedClaimId), 
    [claims, selectedClaimId]
  );

  if (loading) {
    return (
      <div className="page-shell-premium animate-fade-in flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-blue-300 animate-pulse mx-auto mb-4" />
          <p className="text-slate-500">Loading Insurance Module...</p>
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
              <ShieldCheck className="w-8 h-8 text-blue-500" />
              TPA & Insurance Management
              <span className="text-meta-sm bg-blue-600 text-white px-3 py-1 rounded-full border border-white/10 shadow-lg shadow-blue-500/20">
                Healthcare Standards Compliant
              </span>
            </h1>
            <p className="dim-label italic">
              IRDAI compliant insurance processing, pre-authorization, and claim settlement for {tenant?.name || 'Healthcare Facility'}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary py-2 px-4 text-[10px] uppercase tracking-widest">
              <Download className="w-4 h-4 mr-2" />
              Export Reports
            </button>
            <button className="btn-secondary py-2 px-4 text-[10px] uppercase tracking-widest">
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl mb-8">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'providers', label: 'Providers', icon: Building2 },
          { id: 'claims', label: 'Claims', icon: FileText },
          { id: 'preauth', label: 'Pre-authorization', icon: ShieldCheck }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-sm' 
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-slate-500">Total</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{dashboard.total_claims || 0}</h3>
            <p className="text-sm text-slate-600">Insurance Claims</p>
          </div>

          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-slate-500">Pending</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{dashboard.pending_claims || 0}</h3>
            <p className="text-sm text-slate-600">Claims Processing</p>
          </div>

          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-slate-500">Settled</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{dashboard.settled_claims || 0}</h3>
            <p className="text-sm text-slate-600">Claims Completed</p>
          </div>

          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-slate-500">Revenue</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{currency(dashboard.total_settled || 0)}</h3>
            <p className="text-sm text-slate-600">Total Settled</p>
          </div>
        </div>
      )}

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button 
              onClick={() => setShowProviderModal(true)}
              className="btn-primary py-2 px-6 text-[10px] uppercase tracking-widest shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map(provider => (
              <div key={provider.id} className="glass-panel p-6 hover:shadow-lg transition-shadow cursor-pointer"
                   onClick={() => setSelectedProviderId(provider.id)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
                    {provider.provider_name.charAt(0)}
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                    provider.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {provider.status}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2">{provider.provider_name}</h3>
                <p className="text-sm text-slate-600 mb-4">{provider.provider_type}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provider Code:</span>
                    <span className="font-medium">{provider.provider_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Network Type:</span>
                    <span className="font-medium">{provider.network_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coverage Limit:</span>
                    <span className="font-medium">{currency(provider.max_coverage_limit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Settlement:</span>
                    <span className="font-medium">{provider.settlement_period_days} days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claims Tab */}
      {activeTab === 'claims' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search claims..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_PROCESS">Under Process</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="SETTLED">Settled</option>
              </select>
            </div>
            <button 
              onClick={() => setShowClaimModal(true)}
              className="btn-primary py-2 px-6 text-[10px] uppercase tracking-widest shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Claim
            </button>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Claim #</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Patient</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Provider</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Type</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Claimed</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Approved</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredClaims.map(claim => (
                    <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{claim.claim_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{claim.patient_name}</div>
                          <div className="text-xs text-slate-500">{claim.patient_mrn}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{claim.provider_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">
                          {claim.claim_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{currency(claim.total_claimed_amount)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{currency(claim.total_approved_amount)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                          claim.status === 'APPROVED' ? 'bg-green-50 text-green-600' :
                          claim.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                          claim.status === 'SETTLED' ? 'bg-blue-50 text-blue-600' :
                          claim.status === 'UNDER_PROCESS' ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-50 text-slate-600'
                        }`}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-slate-400 hover:text-green-600 transition-colors">
                            <Edit className="w-4 h-4" />
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

      {/* Pre-authorization Tab */}
      {activeTab === 'preauth' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search pre-authorization requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
            <button 
              onClick={() => setShowPreauthModal(true)}
              className="btn-primary py-2 px-6 text-[10px] uppercase tracking-widest shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Pre-auth
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {preauthRequests.map(preauth => (
              <div key={preauth.id} className="glass-panel p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-slate-900">{preauth.preauth_number}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                    preauth.status === 'APPROVED' ? 'bg-green-50 text-green-600' :
                    preauth.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                    preauth.status === 'EXPIRED' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-50 text-slate-600'
                  }`}>
                    {preauth.status}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{preauth.patient_name}</div>
                    <div className="text-xs text-slate-500">{preauth.patient_mrn}</div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Provider:</span>
                    <span className="font-medium">{preauth.provider_name}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Requested:</span>
                    <span className="font-medium">{currency(preauth.requested_amount)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Approved:</span>
                    <span className="font-medium">{currency(preauth.approved_amount)}</span>
                  </div>
                  
                  {preauth.approval_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Valid Until:</span>
                      <span className="font-medium">
                        {new Date(preauth.approval_date).toLocaleDateString()} + ' + ' + preauth.approval_validity_days + ' days'
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
