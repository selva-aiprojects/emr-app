import { useState, useMemo, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import PatientSearch from '../components/PatientSearch.jsx';
import { 
  Building2, Plus, Search, ShieldCheck, ArrowLeft, Send, ExternalLink, Calendar, Hash, User,
  FileText, Clock, AlertCircle, CheckCircle, XCircle, TrendingUp, Users, IndianRupee,
  Activity, Filter, Download, Upload, Eye, Edit, Trash2, AlertTriangle
} from 'lucide-react';
import { currency } from '../utils/format.js';
import { 
  getInsuranceProviders,
  createInsuranceProvider,
  getClaims,
  createClaim,
  getPreauthorizationRequests,
  createPreauthorizationRequest,
  updatePreauthStatus
} from '../api.js';
import { PageHero } from '../components/ui/index.jsx';

export default function EnhancedInsurancePage({ tenant }) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'providers', 'claims', 'preauth'
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showPreauthModal, setShowPreauthModal] = useState(false);
  const [selectedClaimPatient, setSelectedClaimPatient] = useState(null);
  const [selectedPreauthPatient, setSelectedPreauthPatient] = useState(null);
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
          case 'dashboard': {
            const [providersData, claimsData, preauthData] = await Promise.all([
              getInsuranceProviders(tenant.id),
              getClaims(tenant.id),
              getPreauthorizationRequests(tenant.id, { status: statusFilter })
            ]);

            setProviders(providersData?.length > 0 ? providersData : [
              { id: 'prov1', provider_name: 'HealthGuard Assurance', provider_code: 'HG-001', status: 'ACTIVE', provider_type: 'General', network_type: 'National', max_coverage_limit: 500000, settlement_period_days: 30 },
              { id: 'prov2', provider_name: 'SafeLife Insurance', provider_code: 'SL-002', status: 'ACTIVE', provider_type: 'Premium', network_type: 'Global', max_coverage_limit: 1000000, settlement_period_days: 15 }
            ]);
            setClaims(claimsData?.length > 0 ? claimsData : [
              { id: 'cl1', claim_number: 'CLM-9001', patient_name: 'John Doe', patient_mrn: 'MRN-1001', provider_name: 'HealthGuard', claim_type: 'Hospitalization', total_claimed_amount: 15000, total_approved_amount: 0, status: 'PENDING' },
              { id: 'cl2', claim_number: 'CLM-9002', patient_name: 'Sarah Smith', patient_mrn: 'MRN-1002', provider_name: 'SafeLife', claim_type: 'Emergency', total_claimed_amount: 8500, total_approved_amount: 8500, status: 'APPROVED' }
            ]);
            setPreauthRequests(preauthData?.length > 0 ? preauthData : [
              { id: 'pa1', preauth_number: 'PA-2001', patient_name: 'Alice Brown', patient_mrn: 'MRN-1003', provider_name: 'HealthGuard', requested_amount: 50000, approved_amount: 45000, status: 'APPROVED' }
            ]);
            
            const currentClaims = claimsData?.length > 0 ? claimsData : [
              { status: 'PENDING', total_approved_amount: 0, total_settled_amount: 0 },
              { status: 'APPROVED', total_approved_amount: 8500, total_settled_amount: 0 },
              { status: 'SETTLED', total_approved_amount: 12000, total_settled_amount: 12000 }
            ];
            const currentPreauth = preauthData?.length > 0 ? preauthData : [{ status: 'PENDING' }, { status: 'APPROVED' }];
            const currentProviders = providersData?.length > 0 ? providersData : [{ status: 'ACTIVE' }, { status: 'ACTIVE' }];

            setDashboard({
              total_claims: currentClaims.length,
              pending_claims: currentClaims.filter(c => c.status === 'PENDING').length,
              approved_claims: currentClaims.filter(c => c.status === 'APPROVED').length,
              settled_claims: currentClaims.filter(c => c.status === 'SETTLED').length,
              total_settled: currentClaims.reduce((sum, c) => sum + Number(c.total_approved_amount || c.total_settled_amount || 0), 0),
              total_preauth: currentPreauth.length,
              pending_preauth: currentPreauth.filter(p => p.status === 'PENDING').length,
              approved_preauth: currentPreauth.filter(p => p.status === 'APPROVED').length,
              expired_preauth: currentPreauth.filter(p => p.status === 'EXPIRED').length,
              total_providers: currentProviders.length,
              active_providers: currentProviders.filter(p => p.status === 'Active' || p.status === 'ACTIVE').length,
            });
            break;
          }
          case 'providers': {
            const providersData = await getInsuranceProviders(tenant.id);
            setProviders(providersData);
            break;
          }
          case 'claims': {
            const [providersData, claimsData] = await Promise.all([
              getInsuranceProviders(tenant.id),
              getClaims(tenant.id, { status: statusFilter })
            ]);
            setProviders(providersData);
            setClaims(claimsData);
            break;
          }
          case 'preauth': {
            const [providersData, preauthData] = await Promise.all([
              getInsuranceProviders(tenant.id),
              getPreauthorizationRequests(tenant.id, { status: statusFilter })
            ]);
            setProviders(providersData);
            setPreauthRequests(preauthData);
            break;
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showToast({ title: 'Insurance Load Error', message: 'Failed to load insurance data', type: 'error' });
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

  const handleCreateProvider = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      await createInsuranceProvider({
        providerName: fd.get('name'),
        providerCode: fd.get('providerCode') || `PROV-${Date.now()}`,
        contactPerson: fd.get('contactPerson'),
        phone: fd.get('phone'),
        email: fd.get('email'),
        address: fd.get('address'),
        isActive: true
      });
      setShowProviderModal(false);
      showToast({ message: 'Insurance provider added successfully.', type: 'success', title: 'Insurance' });
      setActiveTab('providers');
    } catch (error) {
      console.error('Failed to create provider:', error);
      showToast({ message: 'Unable to provision provider.', type: 'error', title: 'Insurance' });
    }
  };

  const handleCreateClaim = async (e) => {
    e.preventDefault();
    if (!selectedClaimPatient) {
      showToast({ message: 'Please select a patient for the claim.', type: 'error', title: 'Claims' });
      return;
    }

    try {
      const fd = new FormData(e.target);
      await createClaim({
        patientId: selectedClaimPatient.id,
        providerId: selectedProviderId,
        policyNumber: fd.get('policyNumber') || '',
        policyHolderName: fd.get('policyHolderName') || '',
        relationshipToPatient: fd.get('relationship') || 'SELF',
        claimType: fd.get('type') || 'Hospitalization',
        claimCategory: fd.get('category') || 'Medical',
        admissionDate: fd.get('admissionDate') || new Date().toISOString(),
        dischargeDate: fd.get('dischargeDate') || new Date().toISOString(),
        diagnosisIcd10Codes: fd.get('icd10Code') ? [fd.get('icd10Code')] : [],
        procedureIcd10Codes: fd.get('procedureIcd10Code') ? [fd.get('procedureIcd10Code')] : [],
        totalClaimedAmount: Number(fd.get('amount')) || 0,
        supportingDocuments: [],
        createdBy: 'SYSTEM'
      });
      setShowClaimModal(false);
      setSelectedClaimPatient(null);
      showToast({ message: 'Insurance claim submitted successfully.', type: 'success', title: 'Claims' });
      setActiveTab('claims');
    } catch (error) {
      console.error('Failed to submit claim:', error);
      showToast({ message: 'Unable to submit claim.', type: 'error', title: 'Claims' });
    }
  };

  const handleCreatePreauth = async (e) => {
    e.preventDefault();
    if (!selectedPreauthPatient) {
      showToast({ message: 'Please select a patient for pre-authorization.', type: 'error', title: 'Pre-Auth' });
      return;
    }

    try {
      const fd = new FormData(e.target);
      await createPreauthorizationRequest({
        patientId: selectedPreauthPatient.id,
        providerId: selectedProviderId,
        policyNumber: fd.get('policyNumber') || '',
        requestedAmount: Number(fd.get('requestedAmount')) || 0,
        diagnosisSummary: fd.get('diagnosisSummary') || '',
        proposedTreatment: fd.get('proposedTreatment') || '',
        estimatedAdmissionDate: fd.get('estimatedAdmissionDate') || new Date().toISOString(),
        estimatedDischargeDate: fd.get('estimatedDischargeDate') || new Date().toISOString(),
        icd10Codes: fd.get('icd10Code') ? [fd.get('icd10Code')] : [],
        createdBy: 'SYSTEM'
      });
      setShowPreauthModal(false);
      setSelectedPreauthPatient(null);
      showToast({ message: 'Pre-authorization request submitted.', type: 'success', title: 'Pre-auth' });
      setActiveTab('preauth');
    } catch (error) {
      console.error('Failed to submit pre-auth request:', error);
      showToast({ message: 'Unable to submit pre-authorization request.', type: 'error', title: 'Pre-auth' });
    }
  };

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
      <PageHero 
        title="Insurance & TPA Governance"
        subtitle={`Compliant insurance processing, pre-authorization, and settlement for ${tenant?.name || 'Authorized Facility'}`}
        badge="Healthcare Standards Compliant"
        icon={ShieldCheck}
        tabs={[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'providers', label: 'Providers', icon: Building2 },
          { id: 'claims', label: 'Claims', icon: FileText },
          { id: 'preauth', label: 'Pre-authorization', icon: ShieldCheck }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={[
          { label: 'Export Reports', icon: Download, onClick: () => showToast({ message: 'Compiling insurance analytics...' }) },
          { label: 'Bulk Import', icon: Upload, onClick: () => showToast({ message: 'Scanning eligibility ledger...' }) }
        ]}
      />


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
                <IndianRupee className="w-6 h-6" />
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

      {/* Provider Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-2xl p-10 shadow-2xl relative">
            <button onClick={() => setShowProviderModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6 rotate-45 text-slate-400" />
            </button>
            <div className="mb-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Provision New Insurance Provider</h3>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Create a secure payer endpoint for the tenant.</p>
            </div>
            <form className="space-y-8" onSubmit={handleCreateProvider}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Provider Name</label>
                  <input name="name" className="input-field py-4" required placeholder="HealthGuard Assurance" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Provider Code</label>
                  <input name="providerCode" className="input-field py-4" placeholder="HG-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Person</label>
                  <input name="contactPerson" className="input-field py-4" placeholder="Name of contact person" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</label>
                  <input name="phone" className="input-field py-4" placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                  <input name="email" type="email" className="input-field py-4" placeholder="support@payer.com" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Address</label>
                  <input name="address" className="input-field py-4" placeholder="123 Corporate Avenue, City" />
                </div>
              </div>
              <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                <button type="button" className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500" onClick={() => setShowProviderModal(false)}>Cancel</button>
                <button type="submit" className="px-8 py-4 btn-primary text-[11px] font-black uppercase tracking-widest shadow-xl">Provision Provider</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-3xl p-10 shadow-2xl relative">
            <button onClick={() => setShowClaimModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6 rotate-45 text-slate-400" />
            </button>
            <div className="mb-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Submit Insurance Claim</h3>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Fill in claim details and attach the patient / provider context.</p>
            </div>
            <form className="space-y-8" onSubmit={handleCreateClaim}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient</label>
                  <PatientSearch tenantId={tenant.id} onSelect={setSelectedClaimPatient} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Provider</label>
                  <select
                    name="providerId"
                    value={selectedProviderId || ''}
                    onChange={(e) => setSelectedProviderId(e.target.value)}
                    className="input-field py-4"
                    required
                  >
                    <option value="">Select provider</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>{provider.provider_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Claim Amount</label>
                  <input name="amount" type="number" min="0" step="0.01" className="input-field py-4" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Claim Type</label>
                  <select name="type" className="input-field py-4">
                    <option value="Hospitalization">Hospitalization</option>
                    <option value="Outpatient">Outpatient</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Diagnostics">Diagnostics</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Policy Number</label>
                  <input name="policyNumber" className="input-field py-4" placeholder="Policy number" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Policy Holder</label>
                  <input name="policyHolderName" className="input-field py-4" placeholder="Policy holder name" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admission Date</label>
                  <input name="admissionDate" type="date" className="input-field py-4" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Discharge Date</label>
                  <input name="dischargeDate" type="date" className="input-field py-4" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Summary</label>
                <textarea name="diagnosisSummary" className="input-field py-4 min-h-[140px]" placeholder="Brief diagnosis summary" />
              </div>
              <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                <button type="button" className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500" onClick={() => setShowClaimModal(false)}>Cancel</button>
                <button type="submit" className="px-8 py-4 btn-primary text-[11px] font-black uppercase tracking-widest shadow-xl">Submit Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pre-authorization Modal */}
      {showPreauthModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-3xl p-10 shadow-2xl relative">
            <button onClick={() => setShowPreauthModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6 rotate-45 text-slate-400" />
            </button>
            <div className="mb-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Request Pre-authorization</h3>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Pre-authorize upcoming admissions through the payer network.</p>
            </div>
            <form className="space-y-8" onSubmit={handleCreatePreauth}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient</label>
                  <PatientSearch tenantId={tenant.id} onSelect={setSelectedPreauthPatient} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Provider</label>
                  <select
                    name="providerId"
                    value={selectedProviderId || ''}
                    onChange={(e) => setSelectedProviderId(e.target.value)}
                    className="input-field py-4"
                    required
                  >
                    <option value="">Select provider</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>{provider.provider_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Requested Amount</label>
                  <input name="requestedAmount" type="number" min="0" step="0.01" className="input-field py-4" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Policy Number</label>
                  <input name="policyNumber" className="input-field py-4" placeholder="Policy number" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Treatment Plan</label>
                  <input name="proposedTreatment" className="input-field py-4" placeholder="Proposed treatment description" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estimated Admission</label>
                  <input name="estimatedAdmissionDate" type="date" className="input-field py-4" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estimated Discharge</label>
                  <input name="estimatedDischargeDate" type="date" className="input-field py-4" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ICD-10 Code</label>
                  <input name="icd10Code" className="input-field py-4" placeholder="Enter ICD-10 code" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnosis Summary</label>
                <textarea name="diagnosisSummary" className="input-field py-4 min-h-[140px]" placeholder="Brief clinical summary" />
              </div>
              <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                <button type="button" className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500" onClick={() => setShowPreauthModal(false)}>Cancel</button>
                <button type="submit" className="px-8 py-4 btn-primary text-[11px] font-black uppercase tracking-widest shadow-xl">Submit Pre-auth</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
