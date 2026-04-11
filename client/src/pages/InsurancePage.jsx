import { useMemo, useState } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { Building2, Plus, Search, ShieldCheck, ArrowLeft, Send, ExternalLink, Calendar, Hash, User } from 'lucide-react';
import { currency } from '../utils/format.js';

export default function InsurancePage({ providers = [], claims = [], onCreateProvider, onCreateClaim }) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'detail' | 'claims'
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProviders = useMemo(() => {
    if (!searchTerm) return providers;
    return providers.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [providers, searchTerm]);

  const selectedProvider = useMemo(() => 
    providers.find(p => p.id === selectedProviderId), 
  [providers, selectedProviderId]);

  const providerClaims = useMemo(() => 
    claims.filter(c => c.insuranceProviderId === selectedProviderId),
  [claims, selectedProviderId]);



  const handleCreateProvider = async (e) => {
    e.preventDefault();
    await onCreateProvider(e);
    setShowRegister(false);
    showToast({ message: 'Payer provisioned successfully!', type: 'success', title: 'Insurance' });
  };

  const handleCreateClaim = async (e) => {
    e.preventDefault();
    await onCreateClaim(e);
    setShowClaimModal(false);
    showToast({ message: 'Insurance claim submitted!', type: 'success', title: 'Insurance' });
  };

  const stats = useMemo(() => {
    const total = claims.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const pending = claims.filter(c => c.status === 'Pending').length;
    return { total, pending };
  }, [claims]);

  if (selectedProvider && activeTab === 'detail') {
    return (
      <div className="page-shell-premium animate-fade-in">
        <div className="action-bar-premium">
          <button 
            onClick={() => { setActiveTab('list'); setSelectedProviderId(null); }}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Registry
          </button>
          <div className="flex gap-2">
             <button className="btn-primary py-2 px-6 text-[10px] uppercase tracking-widest shadow-lg" onClick={() => setShowClaimModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Initialize New Claim
             </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 mt-6">
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <article className="glass-panel p-8">
              <div className="w-20 h-20 rounded-3xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-black text-3xl shadow-sm mb-6">
                {selectedProvider.name[0]}
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedProvider.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">
                  {selectedProvider.type} CATEGORY
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${selectedProvider.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {selectedProvider.status}
                </span>
              </div>
              
              <div className="mt-8 space-y-4 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Liaison Officer</label>
                    <p className="text-sm font-bold text-slate-800">{selectedProvider.contactPerson || 'Assigned Pending'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Coverage Threshold</label>
                    <p className="text-sm font-bold text-slate-800">{currency(selectedProvider.coverageLimit)}</p>
                  </div>
                </div>
              </div>
            </article>

            <div className="glass-panel p-6 bg-emerald-50/20 border-emerald-100 italic text-[11px] text-emerald-700 font-medium">
              Note: Settlement velocity for this provider is currently optimal. All claims are processed within the standard 14-day clinical cycle.
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 space-y-6">
            <article className="glass-panel p-0 overflow-hidden">
               <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Historical Claims & Settlements</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Registry of all authorized clinical billing requests</p>
                  </div>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead>
                     <tr className="bg-slate-50/50">
                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Claim ID</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Patient / Context</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Quantum</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">State</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {providerClaims.length === 0 ? (
                       <tr>
                         <td colSpan="4" className="px-8 py-20 text-center text-slate-400 italic text-sm">
                            No claims detected for this institutional payer.
                         </td>
                       </tr>
                     ) : providerClaims.map(claim => (
                       <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-8 py-5">
                           <code className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">CLAIM-{claim.id.slice(0, 8).toUpperCase()}</code>
                         </td>
                         <td className="px-8 py-5">
                            <div className="text-sm font-bold text-slate-800">Patient Account Ref</div>
                            <div className="text-[10px] text-slate-400 font-black uppercase mt-0.5">Clinical interaction node</div>
                         </td>
                         <td className="px-8 py-5 font-bold text-slate-900">{currency(claim.amount)}</td>
                         <td className="px-8 py-5">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                              claim.status === 'Settled' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              claim.status === 'Denied' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {claim.status}
                            </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </article>
          </div>
        </div>

        {showClaimModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="glass-panel w-full max-w-lg p-8 animate-fade-in shadow-2xl">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Initialize Coverage Claim</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Submit request for clinical service reimbursement</p>
                </div>
                <button onClick={() => setShowClaimModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 rotate-45 text-slate-400" />
                </button>
              </div>

              <form className="space-y-6" onSubmit={handleCreateClaim}>
                <input type="hidden" name="insuranceProviderId" value={selectedProviderId} />
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Narrative</label>
                  <input name="description" className="input-field py-4" placeholder="e.g. Inpatient Orthopedic Surgery Package" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Claim Amount (₹)</label>
                    <input name="amount" type="number" className="input-field py-4 font-mono" placeholder="0.00" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Service Category</label>
                    <select name="type" className="input-field h-[54px]">
                      <option>Emergency</option>
                      <option>Outpatient</option>
                      <option>IPD Surgery</option>
                      <option>Diagnostics</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-4">
                   <button type="button" className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400" onClick={() => setShowClaimModal(false)}>Discard</button>
                   <button type="submit" className="flex-[2] btn-primary py-4 text-[10px] uppercase tracking-widest shadow-xl">Authorize & Dispatch Claim</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-shell-premium animate-fade-in">
       {/* HEADER SECTION */}
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="flex items-center gap-3">
              Insurance & Payer Governance
              <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">Fiscal Node</span>
           </h1>
           <p className="dim-label">Institutional payer relationships, coverage thresholds, and clinical claim ecosystems for {providers[0]?.tenant_name || 'Authorized Facility'}.</p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Payer Connectivity Active • Claim endpoints operational
           </p>
        </div>
        <div className="flex items-center gap-3">
            <button className="clinical-btn !rounded-xl px-6 py-2.5 shadow-lg shadow-blue-500/10 min-w-[160px] text-[10px] font-black uppercase tracking-widest" onClick={() => setShowRegister(true)}>
               <Plus className="w-3.5 h-3.5 mr-2" />
               Provision Payer
            </button>
        </div>
      </header>

       {/* METRICS STRIP */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-emerald-500">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Providers</p>
                <h4 className="stat-value tabular-nums mt-1">{providers.length}</h4>
                <p className="text-[9px] font-black text-emerald-600 mt-2 uppercase tracking-widest">✓ Operational Registry</p>
             </div>
             <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <Building2 className="w-7 h-7" />
             </div>
          </div>

          <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-amber-500">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pending Claims</p>
                <h4 className="stat-value tabular-nums mt-1">{stats.pending}</h4>
                <p className="text-[9px] font-black text-amber-600 mt-2 uppercase tracking-widest">⚠ High-priority Queue</p>
             </div>
             <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Calendar className="w-7 h-7" />
             </div>
          </div>

          <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-blue-500">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Coverage Volume</p>
                <h4 className="stat-value tabular-nums mt-1">₹{(stats.total / 100000).toFixed(1)}L</h4>
                <p className="text-[9px] font-black text-blue-600 mt-2 uppercase tracking-widest">↗ Total Liquidity</p>
             </div>
             <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7" />
             </div>
          </div>
       </div>

       {/* MAIN LISTING TABLE */}
       <article className="glass-panel p-0 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-slate-50/30">
             <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Institutional Payer Directory</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Coverage institutions and secure claim endpoints</p>
             </div>
             <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                   placeholder="Search institutional registry..." 
                   className="input-field pl-6 pr-12 py-4 w-full lg:w-96 text-sm font-bold bg-white" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full">
                <thead>
                   <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Provider Hub</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Class</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Threshold</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Connectivity</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Operational Logic</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredProviders.length === 0 ? (
                      <tr>
                         <td colSpan="5" className="px-8 py-24 text-center text-slate-400 italic font-medium">No institutional providers detected in current clinical shard.</td>
                      </tr>
                   ) : filteredProviders.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-110 transition-transform">
                                  {p.name[0]}
                               </div>
                               <div>
                                  <div className="text-sm font-black text-slate-900">{p.name}</div>
                                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ref: {p.id.slice(0, 8).toUpperCase()}</div>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200">
                               {p.type}
                            </span>
                         </td>
                         <td className="px-8 py-6 font-bold text-slate-800 text-sm">
                            {currency(p.coverageLimit)}
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                               <div className={`w-2 h-2 rounded-full ${p.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{p.status}</span>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex justify-end gap-3">
                               <button 
                                  onClick={() => { setSelectedProviderId(p.id); setActiveTab('detail'); }}
                                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                               >
                                  Details
                               </button>
                               <button 
                                  onClick={() => { setSelectedProviderId(p.id); setActiveTab('detail'); }}
                                  className="btn-primary py-2 px-5 text-[10px] uppercase tracking-widest shadow-md flex items-center gap-2"
                               >
                                  <ExternalLink className="w-3 h-3" />
                                  Manage
                               </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </article>

       {/* REGISTER MODAL */}
       {showRegister && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
             <div className="glass-panel w-full max-w-2xl p-10 animate-fade-in shadow-2xl relative">
                <button onClick={() => setShowRegister(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <Plus className="w-6 h-6 rotate-45 text-slate-400" />
                </button>

                <div className="mb-10">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Provision New Payer Endpoint</h3>
                   <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Initialize institutional relationship & coverage threshold</p>
                </div>

                <form className="space-y-8" onSubmit={handleCreateProvider}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2 md:col-span-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Identity</label>
                         <input name="name" className="input-field py-4 font-bold" required placeholder="HealthGuard Assurance Global" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asset Classification</label>
                         <select name="type" className="input-field h-[56px] font-bold">
                            <option value="Private">Private Corporate</option>
                            <option value="Government">Government / Public</option>
                            <option value="Corporate">Dedicated Employee Payer</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initial Liability Cap (₹)</label>
                         <input name="coverageLimit" type="number" className="input-field py-4 font-mono font-bold" defaultValue="500000" required />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lead Liaison Officer</label>
                         <input name="contactPerson" className="input-field py-4" required placeholder="Name of primary contact" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Comm Line</label>
                         <input name="phone" className="input-field py-4" required placeholder="+91 ..." />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Official Endpoint (Email)</label>
                         <input name="email" type="email" className="input-field py-4" required placeholder="corporate@payer-endpoint.com" />
                      </div>
                   </div>

                   <div className="pt-10 border-t border-slate-100 flex gap-4">
                      <button type="button" className="flex-1 py-4 text-[11px] font-black uppercase tracking-[.2em] text-slate-400" onClick={() => setShowRegister(false)}>Discard</button>
                      <button type="submit" className="flex-2 btn-primary py-4 px-12 text-[11px] uppercase tracking-[.2em] shadow-xl">Finalize Provisioning</button>
                   </div>
                </form>
             </div>
          </div>
       )}
    </div>
  );
}

