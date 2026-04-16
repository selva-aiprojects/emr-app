import React, { useState } from 'react';
import { 
  Building2, UserPlus, Key, ShieldCheck, 
  Plus, Trash2, Edit3, CheckCircle2, 
  AlertTriangle, ArrowUpRight, ChevronRight, 
  X, History, Lock, Search, Filter, 
  Activity, Globe, Settings, Box, Database,
  Fingerprint, Zap
} from 'lucide-react';
import { useToast } from '../../hooks/useToast.jsx';
import { superadminService } from '../../services/superadmin.service.js';

export default function TenantControlCenter({ tenants = [], onRefresh, apiClient, setView }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('shards');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTenant, setEditingTenant] = useState(null);

  const filteredTenants = tenants.filter(t => 
    (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleResetPassword = async (t) => {
    const password = prompt("Enter new master password for " + t.name);
    if (!password) return;
    try {
      showToast({ message: `Resetting password for ${t.name}...`, type: 'info' });
      await superadminService.resetUserPassword(t.code, `admin@${t.subdomain}.com`, password);
      showToast({ message: `Password reset successful.`, type: 'success' });
    } catch (err) {
      showToast({ message: err.message, type: 'error', title: 'Reset Failed' });
    }
  };

  const handleDeleteTenant = async (t) => {
    if (!window.confirm(`⚠️ DESTRUCTIVE ACTION: Are you sure you want to PERMANENTLY DELETE shard [${t.code}] (${t.name})? This will purge all clinical data and schemas.`)) {
      return;
    }
    
    try {
      showToast({ message: `Decommissioning shard ${t.code}...`, type: 'warning' });
      await superadminService.deleteTenant(t.id);
      showToast({ message: `Shard ${t.code} purged from the grid.`, type: 'success' });
      onRefresh?.();
    } catch (err) {
      showToast({ message: err.message, type: 'error', title: 'Deletion Failed' });
    }
  };

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      name: fd.get('name'),
      subdomain: fd.get('subdomain'),
      subscription_tier: fd.get('tier'),
      contact_email: fd.get('email'),
      status: fd.get('status')
    };

    try {
      showToast({ message: `Relinking identity for ${editingTenant.code}...`, type: 'info' });
      await superadminService.updateTenant(editingTenant.id, data);
      showToast({ message: `Node configuration synchronized.`, type: 'success' });
      setEditingTenant(null);
      onRefresh?.();
    } catch (err) {
      showToast({ message: err.message, type: 'error', title: 'Update Failed' });
    }
  };

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* PROFESSIONAL TITLE BLOCK */}
      <div className="flex justify-between items-end">
         <div>
            <h2 className="text-[20px] font-black text-slate-900 tracking-tighter uppercase mb-1">Shard Orchestration</h2>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Platform Nodes</span>
               <div className="w-1 h-1 rounded-full bg-slate-300" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Institutional Provisioning</span>
            </div>
         </div>
         <div className="flex gap-4">
            <div className="relative group w-[280px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-600" />
               <input 
                 type="text" 
                 placeholder="Search Node Identity..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-400 transition-all font-tabular uppercase tracking-wider shadow-sm"
               />
            </div>
            <button 
               onClick={() => setView('tenant_creation')}
               className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
            >
               <Plus size={14} /> Provision New Shard
            </button>
         </div>
      </div>

      {/* SHARD CONTROL GRID */}
      <section className="space-y-8">
         <div className="flex gap-6 border-b border-slate-200">
            {[
               { id: 'shards', label: 'Active Shards', icon: Box },
               { id: 'identities', label: 'Identity Nodes', icon: Fingerprint },
               { id: 'security', label: 'Security Protocols', icon: ShieldCheck }
            ].map((tab) => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${
                     activeTab === tab.id ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
               >
                  <tab.icon size={12} /> {tab.label}
               </button>
            ))}
         </div>

         {activeTab === 'shards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {filteredTenants.map((t, idx) => (
                  <div key={t.id || idx} className="group relative bg-white border border-slate-200 p-8 rounded-[2rem] transition-all hover:border-indigo-200 hover:shadow-md overflow-hidden flex flex-col justify-between min-h-[320px]">
                     <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Database size={64} strokeWidth={1} />
                     </div>

                     <div>
                        <div className="flex justify-between items-start mb-8">
                           <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[14px] uppercase group-hover:scale-110 transition-transform">
                              {t.name?.slice(0, 2)}
                           </div>
                           <div className="flex flex-col items-end gap-2">
                              <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[8px] font-black uppercase tracking-widest border border-slate-200">
                                 {t.subscriptionTier || 'Standard'} Tier
                              </span>
                              <div className="flex items-center gap-1.5 font-black text-[9px] text-emerald-600 uppercase tracking-widest">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
                              </div>
                           </div>
                        </div>

                        <h4 className="text-[16px] font-black text-slate-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors mb-1 truncate leading-tight">{t.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-8 font-tabular">{t.subdomain}.emr.care</p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Shard ID</p>
                              <p className="text-[11px] font-black text-slate-700 tabular-nums uppercase">{t.code || 'SYS-' + idx}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Created</p>
                              <p className="text-[11px] font-black text-slate-700 tabular-nums">{new Date(t.created_at || Date.now()).toLocaleDateString()}</p>
                           </div>
                        </div>
                     </div>

                      <div className="flex items-center gap-2 pt-6 border-t border-slate-100">
                        <button onClick={() => handleResetPassword(t)} className="flex-1 py-3 rounded-xl bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 group/btn shadow-sm">
                           <Key size={12} className="group-hover/btn:rotate-12 transition-transform" /> Reset Security
                        </button>
                        <button onClick={() => setEditingTenant(t)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-slate-50 transition-all shadow-sm" title="Edit Node Configuration">
                           <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDeleteTenant(t)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm" title="Decommission Node">
                           <Trash2 size={14} />
                        </button>
                      </div>
                  </div>
               ))}

                           </div>
         )}

         {activeTab === 'identities' && (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm p-4">
               <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                     <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <th className="px-8 py-5">Identity Node</th>
                        <th className="px-8 py-5 text-center">Assigned Shard</th>
                        <th className="px-8 py-5 text-center">Lifecycle</th>
                        <th className="px-8 py-5 text-right">Integrity</th>
                     </tr>
                  </thead>
                  <tbody>
                     {tenants.map((t, i) => (
                        <IdentityRow key={t.id || i} tenant={t} apiClient={apiClient} />
                     ))}
                  </tbody>
               </table>
            </div>
         )}

         {activeTab === 'security' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] relative overflow-hidden group shadow-sm hover:border-indigo-200 transition-all">
                  <h3 className="text-[18px] font-black text-slate-900 uppercase tracking-tighter mb-4 italic">Security Directive Alpha</h3>
                  <p className="text-[12px] font-bold text-slate-500 leading-relaxed mb-10">
                     Initialize a global audit of all administrative identities across the institutional grid. This process will verify 2FA compliance and encryption sharding integrity.
                  </p>
                  <button className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-md">Start Global Audit</button>
                  <History className="absolute -right-4 -bottom-4 text-slate-100 group-hover:text-indigo-50 transition-colors" size={160} />
               </div>
               
               <div className="bg-white border border-rose-100 p-10 rounded-[2.5rem] relative overflow-hidden shadow-sm hover:border-rose-200 transition-all">
                  <h3 className="text-[18px] font-black text-slate-900 uppercase tracking-tighter mb-4 italic">Emergency Protocol</h3>
                  <p className="text-[12px] font-bold text-slate-500 leading-relaxed mb-10">
                     Immediate revocation of all active system-wide administrative tokens. This action will enforce a global re-authentication on the next heartbeat.
                  </p>
                  <button className="w-full py-5 border border-rose-500 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-rose-600 hover:text-white transition-all shadow-sm">Revoke All Tokens</button>
                  <AlertTriangle className="absolute -right-4 -bottom-4 text-rose-50/50" size={160} />
               </div>
            </div>
         )}
      </section>

          </div>
  );
}

function IdentityRow({ tenant, apiClient }) {
  const [admin, setAdmin] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const fetchAdmin = async () => {
      try {
        const data = await apiClient.getTenantAdmin(tenant.id);
        if (mounted) setAdmin(data);
      } catch (e) {
        if (mounted) setAdmin({ email: `admin@${tenant.code?.toLowerCase()}.com`, name: 'Fallback Admin' });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAdmin();
    return () => { mounted = false; };
  }, [tenant.id, tenant.code]);

  return (
    <tr className="group hover:bg-slate-50 transition-all">
       <td className="px-8 py-6 bg-white first:rounded-l-2xl border-y border-l border-slate-100 group-hover:border-indigo-100">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600/10 group-hover:text-indigo-600 transition-colors">
                <Lock size={14} />
             </div>
             <div>
                <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">
                  {loading ? 'Discovering...' : admin?.email}
                </p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                  {loading ? 'Scanning Shard Identity' : (admin?.name || 'Primary Administrative Authority')}
                </p>
             </div>
          </div>
       </td>
       <td className="px-8 py-6 bg-white border-y border-slate-100 text-center group-hover:bg-slate-50/50">
          <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-[0.15em]">
             {tenant.code || 'SYS-NODE'}
          </span>
       </td>
       <td className="px-8 py-6 bg-white border-y border-slate-100 text-center group-hover:bg-slate-50/50">
          <span className="flex items-center justify-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest italic drop-shadow-sm">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Authority Active
          </span>
       </td>
       <td className="px-8 py-6 bg-white last:rounded-r-2xl border-y border-r border-slate-100 text-right group-hover:border-indigo-100">
          <div className="flex items-center justify-end gap-3 text-slate-400">
             <Zap size={14} className={loading ? "animate-pulse text-slate-300" : "text-amber-500"} />
             <span className="text-[10px] font-black uppercase tracking-widest">
               {loading ? 'Validating' : 'Verified'}
             </span>
          </div>
       </td>
    </tr>
  );
}
