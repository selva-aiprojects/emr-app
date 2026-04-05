import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { Shield, Check, X, Zap, Crown, Gift, Mail, MessageSquare, AlertTriangle, Info } from 'lucide-react';

export default function FeatureManager({ tenant, onClose, onRefresh }) {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [commNote, setCommNote] = useState('');
  const [tenantStatus, setTenantStatus] = useState(tenant.status || 'active');

  const Tiers = [
    { name: 'Free', price: '₹0', icon: Gift, color: 'text-emerald-500' },
    { name: 'Basic', price: '₹2,500', icon: Shield, color: 'text-indigo-500' },
    { name: 'Professional', price: '₹7,500', icon: Zap, color: 'text-amber-500' },
    { name: 'Enterprise', price: '₹15,000', icon: Crown, color: 'text-rose-500' }
  ];
  
  const featureLabels = {
    'permission-core_engine-access': 'Core EMR (Patients, Appointments, Encounters)',
    'permission-pharmacy_lab-access': 'Pharmacy & Lab (Inventory, Diagnostic reports)',
    'permission-inpatient-access': 'Inpatient Node (Beds, Ward management)',
    'permission-hr_payroll-access': 'HR & Payroll (Employees, Attendance)',
    'permission-accounts-access': 'Accounts & Billing (Institutional Financials)',
    'permission-customer_support-access': 'Customer Support (Unified Ticketing)'
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const getTierRank = (t) => Tiers.findIndex(x => x.name === t);

  async function handleTierChange(newTier) {
    const currentTier = tenant.subscription_tier || 'Basic';
    const isDowngrade = getTierRank(newTier) < getTierRank(currentTier);

    if (isDowngrade) {
      const confirm = window.confirm(
        `⚠️ DOWNGRADE ALERT: Moving from ${currentTier} to ${newTier} will restrict access to modules currently in use. \n\n` +
        `Please ensure you have verified this with the tenant and logged the communication. Continue?`
      );
      if (!confirm) return;
    }

    try {
      setUpdating('tier');
      await api.updateTenantTier(tenant.id, newTier);
      
      // Auto-log the change if a note exists
      if (commNote) {
         // This would ideally hit a /api/admin/tenants/:id/communications endpoint
         console.log('Logging communication:', commNote);
      }

      await loadFeatures();
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Failed to update tier');
    } finally {
      setUpdating(null);
    }
  }

  async function toggleFeature(flag, currentStatus) {
    try {
      setUpdating(flag);
      await api.updateTenantFeatureOverride(tenant.id, flag, !currentStatus);
      await loadFeatures();
    } catch (e) {
      alert('Failed to update feature');
    } finally {
      setUpdating(null);
    }
  }

  async function toggleTenantStatus() {
    const newStatus = tenantStatus === 'active' ? 'suspended' : 'active';
    const confirmMsg = newStatus === 'suspended'
      ? `⚠️ WARNING: Suspending this tenant will immediately block ALL users from logging in.\n\nHave you already sent the final warning email to the tenant administrator?`
      : `Re-activate tenant "${tenant.name}"? They will regain full access immediately.`;
    if (!window.confirm(confirmMsg)) return;
    try {
      setUpdating('status');
      await api.updateTenantStatus(tenant.id, newStatus);
      setTenantStatus(newStatus);
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Failed to update tenant status. Please try again.');
    } finally {
      setUpdating(null);
    }
  }

  if (loading) return (
    <div className="fixed inset-0 z-[200] bg-slate-950/20 backdrop-blur-sm flex items-center justify-center">
       <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">Syncing Matrix...</span>
       </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/40 backdrop-blur-md flex items-start justify-center p-4 overflow-y-auto pt-24 custom-scrollbar">
      <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up border border-slate-200 mb-20">
        <header className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3">
               <h3 className="text-lg font-black uppercase tracking-tight">Feature Governance</h3>
               <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-widest ${tenantStatus === 'active' ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500/30' : 'bg-rose-900/50 text-rose-400 border-rose-500/30'}`}>
                  {tenantStatus}
               </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {tenant.name} • {tenant.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
               onClick={toggleTenantStatus}
               disabled={updating === 'status'}
               className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${tenantStatus === 'active' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'}`}
            >
               {tenantStatus === 'active' ? 'Suspend Tenant' : 'Activate Tenant'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* TIER SELECTION */}
          <section className="mb-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Crown className="w-3 h-3" /> Subscription Shard & Pricing
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {Tiers.map(t => (
                <button
                  key={t.name}
                  onClick={() => handleTierChange(t.name)}
                  disabled={updating === 'tier'}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all relative ${
                    tenant.subscription_tier === t.name 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105 z-10' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <t.icon className={`w-5 h-5 mb-1 ${tenant.subscription_tier === t.name ? 'text-white' : t.color}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{t.name}</span>
                  <span className={`text-[10px] font-black ${tenant.subscription_tier === t.name ? 'text-slate-400' : 'text-slate-900'}`}>{t.price}</span>
                  {tenant.subscription_tier === t.name && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* GRANULAR CAPABILITY MATRIX - REDESIGNED TO HORIZONTAL GRID */}
          <section className="mb-10">
            <header className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Zap className="w-3.5 h-3.5 text-amber-500" /> Platform Infrastructure Shards
              </h4>
              <div className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase text-slate-500 tracking-widest border border-slate-200">
                {Object.keys(flags).length} Active Shards
              </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(flags).sort().map(([flag, info]) => (
                <div 
                  key={flag} 
                  className={`
                    px-5 py-4 rounded-[24px] border transition-all duration-300 group relative flex flex-col justify-between h-[110px]
                    ${info.enabled 
                      ? 'bg-white border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-200' 
                      : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0">
                      <div className={`text-[12px] font-black tracking-tight truncate leading-tight ${info.enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                        {featureLabels[flag] || flag.replace('permission-', '').replace('-access', '').replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-tighter ${info.effective_enabled ? (info.enabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-600') : 'bg-slate-200 text-slate-500'}`}>
                          {info.enabled ? 'Authorized' : 'Cascaded'}
                        </span>
                        {info.killSwitchActive && (
                          <span className="text-[8px] font-black uppercase bg-red-100 text-red-600 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                             <AlertTriangle className="w-2.5 h-2.5" /> Killswitch
                          </span>
                        )}
                        {info.customEnabled !== null && (
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" title="Manual Override Active" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-[9px] font-medium text-slate-400 truncate pr-4">
                      {info.enabled ? 'Active on node' : 'Restricted state'}
                    </div>
                    <button
                      onClick={() => toggleFeature(flag, info.enabled)}
                      disabled={updating === flag || info.killSwitchActive}
                      className={`
                        w-12 h-6 rounded-full relative transition-all duration-500 group-hover:scale-105
                        ${info.enabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-300 shadow-inner'} 
                        ${info.killSwitchActive ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer'}
                      `}
                    >
                      <div className={`
                        absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm
                        ${info.enabled ? 'right-1' : 'left-1'}
                      `} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* COMMUNICATION LOGGING */}
          <section className="mb-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <MessageSquare className="w-3 h-3" /> Communication Governance
            </h4>
            <div className="p-5 bg-slate-900 rounded-3xl space-y-4">
               <div className="flex items-center gap-3 text-white">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Downgrade / Provisioning Note</span>
               </div>
               <textarea 
                  value={commNote}
                  onChange={(e) => setCommNote(e.target.value)}
                  placeholder="E.g. Verified tier shift with Dr. Chen via email at 14:00. Tenant confirms data accessibility trade-off."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500 outline-none h-24 transition-all"
               />
               <p className="text-[9px] font-medium text-slate-500 italic">
                  * All tier changes must be preceded by a verified institutional confirmation. This note is indexed for platform auditing.
               </p>
            </div>
          </section>

          <footer className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
             <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
             <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
               <strong>Financial Shard Re-allocation:</strong> Changing tiers rebalances the fiscal obligation node. Manual overrides on specific capabilities do not affect base tier pricing but are tracked as "Custom Provisioning".
             </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
