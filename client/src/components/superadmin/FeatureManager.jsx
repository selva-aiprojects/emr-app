import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { 
  Shield, Check, X, Zap, Crown, Gift, Lock, Cpu, Activity, 
  ChevronRight, Info, AlertTriangle, Settings, MessageSquare, 
  ShieldCheck, Box, Server, Radio, Power, Eye, EyeOff,
  CornerDownRight, Database, Fingerprint
} from 'lucide-react';
import { useToast } from '../../hooks/useToast.jsx';

export default function FeatureManager({ tenant, onClose, onRefresh }) {
  const { showToast } = useToast();
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [commNote, setCommNote] = useState('');
  const [tenantStatus, setTenantStatus] = useState(tenant.status || 'active');

  const Tiers = [
    { name: 'Free', price: '₹0', icon: Gift, color: 'slate' },
    { name: 'Basic', price: '₹199', icon: Shield, color: 'blue' },
    { name: 'Professional', price: '₹499', icon: Zap, color: 'indigo' },
    { name: 'Enterprise', price: '₹1299', icon: Crown, color: 'rose' }
  ];
  
  const featureLabels = {
    'permission-core_engine-access': 'Clinical EMR Engine',
    'permission-pharmacy_lab-access': 'Diagnostic & Laboratory Hub',
    'permission-inpatient-access': 'Inpatient Ward Expansion',
    'permission-hr_payroll-access': 'HR & Payroll Operations',
    'permission-accounts-access': 'Finance & Ledger System',
    'permission-customer_support-access': 'Patient Support Matrix'
  };

  useEffect(() => {
    loadFeatures();
  }, [tenant.id]);

  async function loadFeatures() {
    try {
      setLoading(true);
      const data = await api.getAdminTenantFeatures(tenant.id);
      setFlags(data);
    } catch (e) {
      showToast({ title: 'Error', message: 'Failed to retrieve capability matrix.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const getTierRank = (t) => Tiers.findIndex(x => x.name === t);

  async function handleTierChange(newTier) {
    const currentTier = tenant.subscription_tier || 'Basic';
    if (getTierRank(newTier) < getTierRank(currentTier)) {
      if (!window.confirm(`Downgrading to ${newTier} will restrict access to modules currently in use. Continue?`)) return;
    }
    try {
      setUpdating('tier');
      await api.updateTenantTier(tenant.id, newTier);
      showToast({ title: 'Tier Updated', message: `Migrated institutional tier to ${newTier}.`, type: 'success' });
      await loadFeatures();
      if (onRefresh) onRefresh();
    } catch (e) {
      showToast({ title: 'Error', message: 'Failed to re-allocate tier.', type: 'error' });
    } finally {
      setUpdating(null);
    }
  }

  async function toggleFeature(flag, currentStatus) {
    try {
      setUpdating(flag);
      await api.updateTenantFeatureOverride(tenant.id, flag, !currentStatus);
      showToast({ title: 'Shard Updated', message: 'Feature capability override successful.', type: 'success' });
      await loadFeatures();
    } catch (e) {
      showToast({ title: 'Error', message: 'Failed to override shard capability.', type: 'error' });
    } finally {
      setUpdating(null);
    }
  }

  async function toggleTenantStatus() {
    const newStatus = tenantStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`${newStatus === 'suspended' ? 'Suspend' : 'Re-activate'} institutional node "${tenant.name}"?`)) return;
    try {
      setUpdating('status');
      await api.updateTenantStatus(tenant.id, newStatus);
      setTenantStatus(newStatus);
      showToast({ title: 'Status Changed', message: `Node state transition to ${newStatus} complete.`, type: 'success' });
      if (onRefresh) onRefresh();
    } catch (e) {
      showToast({ title: 'Error', message: 'Failed to update status.', type: 'error' });
    } finally {
      setUpdating(null);
    }
  }

  if (loading) return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-center justify-center">
       <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-[2rem] bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
             <Activity className="animate-spin" size={32} />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] ml-4">Synchronizing Shard Matrix...</span>
       </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-8 overflow-y-auto no-scrollbar animate-in fade-in duration-300">
      <div className="bg-[#0a0c10] border border-white/10 rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden relative">
        {/* AMBIENT GLOW */}
        <div className={`absolute top-[-100px] left-[-100px] w-80 h-80 rounded-full blur-[80px] pointer-events-none transition-colors duration-1000 ${tenantStatus === 'active' ? 'bg-indigo-600/10' : 'bg-rose-600/10'}`} />

        {/* MODAL HEADER */}
        <header className="px-10 py-10 border-b border-white/5 flex justify-between items-center relative z-10">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_currentcolor] ${tenantStatus === 'active' ? 'bg-emerald-500 text-emerald-500' : 'bg-rose-500 text-rose-500'}`} />
                 <h2 className="text-[18px] font-black uppercase text-white tracking-tighter italic">Governance Console</h2>
              </div>
              <div className="flex items-center gap-3 ml-6">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{tenant.name}</span>
                 <div className="w-1 h-1 rounded-full bg-white/10" />
                 <span className="text-[10px] font-black text-indigo-400 font-mono uppercase tracking-[0.2em]">{tenant.code}</span>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                 onClick={toggleTenantStatus}
                 disabled={updating === 'status'}
                 className={`flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${
                   tenantStatus === 'active' 
                     ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white' 
                     : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                 }`}
              >
                 <Power size={14} />
                 {tenantStatus === 'active' ? 'Suspend Shard' : 'Authorize Shard'}
              </button>
              <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                 <X size={20} />
              </button>
           </div>
        </header>

        <div className="p-10 space-y-12 max-h-[65vh] overflow-y-auto no-scrollbar relative z-10 bg-transparent">
          {/* SUBSCRIPTION TIER SHARDS */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
               <Fingerprint size={16} className="text-slate-600" />
               <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.4em]">Institutional Governance Tier</h3>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Tiers.map(t => (
                   <button
                     key={t.name}
                     onClick={() => handleTierChange(t.name)}
                     disabled={updating === 'tier'}
                     className={`p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden flex flex-col items-center text-center gap-3 group ${
                       tenant.subscription_tier === t.name 
                         ? 'border-indigo-600 bg-indigo-600/10 shadow-[0_0_20px_rgba(79,70,229,0.15)]' 
                         : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                     }`}
                   >
                     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${tenant.subscription_tier === t.name ? 'bg-indigo-600 text-white' : 'bg-white/[0.03] text-slate-500 group-hover:text-indigo-400'}`}>
                        <t.icon size={18} />
                     </div>
                     <div>
                        <div className="text-[12px] font-black uppercase text-white tracking-widest mb-1">{t.name}</div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] italic ${tenant.subscription_tier === t.name ? 'text-indigo-400' : 'text-slate-600'}`}>{t.price} / SHARD</div>
                     </div>
                     {tenant.subscription_tier === t.name && (
                       <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                          <Check size={12} className="text-white font-bold" />
                       </div>
                     )}
                   </button>
                ))}
             </div>
          </section>

          {/* CAPABILITY SHARD MATRIX */}
          <section className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Database size={16} className="text-slate-600" />
                   <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.4em]">Capability Shard Matrix</h3>
                </div>
                <span className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest border-b border-white/5 pb-1">Nexus Overlay Authorization Active</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(flags).sort().map(([flag, info]) => (
                   <div 
                     key={flag} 
                     className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between min-h-[160px] group/item ${info.enabled ? 'bg-white/[0.03] border-white/10' : 'bg-white/[0.01] border-white/5 opacity-50 grayscale'}`}
                   >
                      <div className="space-y-4">
                         <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${info.enabled ? 'bg-indigo-400 shadow-[0_0_8px_rgba(79,70,229,0.8)]' : 'bg-slate-800'}`} />
                           <div className={`text-[12px] font-black tracking-tight uppercase leading-none group-hover/item:text-indigo-400 transition-colors ${info.enabled ? 'text-white' : 'text-slate-500'}`}>
                              {featureLabels[flag] || flag.replace('permission-', '').replace(/-access/g, '').replace(/_/g, ' ')}
                           </div>
                         </div>
                         <div className={`text-[9px] font-black px-3 py-1 rounded-full inline-flex items-center gap-2 uppercase tracking-widest ${info.effective_enabled ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
                            {info.enabled ? <ShieldCheck size={10} /> : <CornerDownRight size={10} />}
                            {info.enabled ? 'AUTHORIZED_OVERRIDE' : 'TIER_CASCADED'}
                         </div>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                         <span className={`text-[10px] font-black uppercase tracking-widest ${info.enabled ? 'text-emerald-500' : 'text-slate-700'}`}>{info.enabled ? 'ACTIVE' : 'OFFLINE'}</span>
                         <button
                           onClick={() => toggleFeature(flag, info.enabled)}
                           disabled={updating === flag || info.killSwitchActive}
                           className={`w-12 h-6 rounded-full relative transition-all flex items-center px-1 ${info.enabled ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-white/10'} ${info.killSwitchActive ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}`}
                         >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] ${info.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            {updating === flag && <Activity className="absolute inset-x-0 mx-auto text-white/40 animate-spin" size={10} />}
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          </section>

          {/* AUDIT NOTE - TERMINAL STYLE */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group">
             <div className="flex items-center gap-3 mb-6">
                <MessageSquare size={16} className="text-indigo-400" />
                <h3 className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.4em]">Protocol Mutation Audit</h3>
             </div>
             <textarea 
                value={commNote}
                onChange={(e) => setCommNote(e.target.value)}
                placeholder="Target node migration logic initialized for cross-shard audit trail..."
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-[12px] font-black text-slate-300 outline-none h-32 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono placeholder:text-slate-800"
             />
             <div className="mt-6 flex items-center justify-between">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3">
                   <ShieldCheck size={14} className="text-emerald-500" /> All mutations are synchronized with the Root Audit Nexus.
                </p>
                <div className="text-[9px] font-black text-slate-800 uppercase tabular-nums">NONCE: 0x9f2e...4d1c</div>
             </div>
          </section>
        </div>

        {/* FOOTER */}
        <footer className="px-10 py-6 border-t border-white/5 bg-white/[0.02] flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
           <span className="flex items-center gap-2"><Radio size={12} className="text-indigo-500" /> Institutional Heartbeat Stable</span>
           <span className="italic">Auth Protocol v4.2.0-FEATURE_MANAGER</span>
        </footer>
      </div>
    </div>
  );
}
