import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Package, Users, Search, 
  DollarSign, Table, Plus, X, Edit2, 
  Check, Settings, Activity, LayoutGrid, 
  ShieldCheck, Zap, Crown, Box, TrendingUp, 
  History, FileText, ArrowUpRight, BarChart3,
  CreditCard
} from 'lucide-react';
import { api } from '../../api.js';
import { useToast } from '../../hooks/useToast.jsx';

const PLAN_MODELS = [
  { id: 'free', name: 'Starter', cost: '0', period: 'Forever', color: 'slate', icon: Box, features: ['Community Support', 'Standard Reports', 'Up to 5 Users'] },
  { id: 'basic', name: 'Basic', cost: '199', period: 'per mo', color: 'blue', icon: ShieldCheck, features: ['Email Support', 'Advanced Analytics', 'Up to 25 Users'] },
  { id: 'professional', name: 'Professional', cost: '499', period: 'per mo', color: 'indigo', icon: Zap, features: ['24/7 Support', 'Custom Branding', 'Unlimited Users'] },
  { id: 'enterprise', name: 'Enterprise', cost: '1299', period: 'per mo', color: 'emerald', icon: Crown, features: ['Dedicated Server', 'AI Assistance Matrix', '99.9% SLM Guarantee'] },
];

export default function SubscriptionEngine({ tenants = [] }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('plans'); 
  const [plans, setPlans] = useState(PLAN_MODELS);
  const [selectedPlanId, setSelectedPlanId] = useState('professional');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const data = await api.get('/admin/subscription-catalog');
        if (data && data.length > 0) {
           setPlans(data.map(ap => ({
              ...ap, 
              icon: (PLAN_MODELS.find(lp => lp.id === ap.id) || {}).icon || Box 
           })));
        }
      } catch (e) {
        console.warn('Catalog fetch failed.');
      }
    }
    fetchCatalog();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    try {
       await api.post('/admin/subscription-catalog', { subscription: selectedPlan });
       showToast({ title: 'Config Committed', message: `Grid configuration for ${selectedPlan.name} updated across all shards.`, type: 'success' });
       setIsEditing(false);
    } catch (e) {
       showToast({ title: 'Commit Failed', message: e.message || 'Nexus core rejected the configuration.', type: 'error' });
    } finally {
       setLoading(false);
    }
  };

  const removeFeature = (idx) => {
    setPlans(prev => prev.map(p => {
      if (p.id === selectedPlanId) {
        const nf = [...p.features];
        nf.splice(idx, 1);
        return { ...p, features: nf };
      }
      return p;
    }));
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setPlans(prev => prev.map(p => {
      if (p.id === selectedPlanId) {
        return { ...p, features: [...(p.features || []), newFeature.trim()] };
      }
      return p;
    }));
    setNewFeature('');
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = tenants.reduce((acc, t) => {
    const plan = plans.find(p => p.id === (t.subscription_tier?.toLowerCase() || 'free')) || plans[0];
    return acc + Number(plan.cost || 0);
  }, 0);

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* PROFESSIONAL TITLE BLOCK */}
      <div className="flex justify-between items-end">
         <div>
            <h2 className="text-[20px] font-black text-slate-900 tracking-tighter uppercase mb-1">Fiscal Governance</h2>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Economy HUD</span>
               <div className="w-1 h-1 rounded-full bg-slate-300" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Subscription Matrix Control Layer</span>
            </div>
         </div>
         <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-200 gap-1 shadow-inner">
            {[
              { id: 'plans', label: 'Unit Pricing', icon: LayoutGrid },
              { id: 'matrix', label: 'Feature Matrix', icon: Table },
              { id: 'clients', label: 'Yield Audit', icon: BarChart3 },
              { id: 'ledger', label: 'Shard Ledger', icon: CreditCard }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                }`}
              >
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
         </div>
      </div>

      {activeTab === 'plans' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                onClick={() => { if(!isEditing) setSelectedPlanId(plan.id); }}
                className={`group relative p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between min-h-[440px] bg-white ${
                    selectedPlanId === plan.id ? 'border-indigo-500 scale-105 z-10 shadow-xl' : 'border-slate-100 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity">
                   <plan.icon size={120} strokeWidth={1} />
                </div>

                <div>
                   <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedPlanId === plan.id ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-slate-100 text-slate-500'}`}>
                         <plan.icon size={22} />
                      </div>
                      {selectedPlanId === plan.id && (
                        <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] border border-indigo-100">Selected Unit</div>
                      )}
                   </div>

                   <h3 className="text-[16px] font-black uppercase tracking-tighter text-slate-900 mb-2">{plan.name}</h3>
                   <div className="flex items-baseline gap-2 mb-8 italic">
                     {isEditing && selectedPlanId === plan.id ? (
                       <div className="flex items-center bg-slate-50 border border-indigo-200 rounded-xl px-4 py-2">
                          <span className="text-[14px] font-black text-slate-400 mr-2 uppercase">₹</span>
                          <input 
                            className="bg-transparent w-32 text-3xl font-black text-slate-900 focus:outline-none font-tabular tracking-tighter"
                            value={plan.cost}
                            onChange={(e) => {
                               const n = [...plans];
                               n.find(p => p.id === plan.id).cost = e.target.value.replace(/[^0-9.]/g, '');
                               setPlans(n);
                            }}
                            autoFocus
                          />
                       </div>
                     ) : (
                       <>
                          <span className={`text-4xl font-black tracking-tighter tabular-nums ${selectedPlanId === plan.id ? 'text-indigo-600' : 'text-slate-900'}`}>₹{plan.cost}</span>
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{plan.period}</span>
                       </>
                     )}
                   </div>

                   <div className="space-y-4 relative z-10">
                     {(plan.features || []).map((feat, i) => (
                       <div key={i} className="flex items-center justify-between group/feat">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight truncate">{feat}</span>
                           </div>
                           {isEditing && selectedPlanId === plan.id && (
                              <button onClick={(e) => { e.stopPropagation(); removeFeature(i); }} className="text-slate-400 hover:text-rose-500 transition-colors">
                                 <X size={14} />
                              </button>
                           )}
                       </div>
                     ))}
                     {isEditing && selectedPlanId === plan.id && (
                       <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                          <input 
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-400"
                            placeholder="Add capability..."
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                          />
                          <button onClick={addFeature} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(79,70,229,0.3)]">
                             <Plus size={14} />
                          </button>
                       </div>
                     )}
                   </div>
                </div>
              </div>
            ))}
          </div>

          {/* DYNAMIC ACTION FLOOR */}
          <div className={`p-8 rounded-[2.5rem] flex items-center justify-between border transition-all duration-500 ${isEditing ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
             <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center ${isEditing ? 'bg-white/20' : 'bg-slate-50 border border-slate-100 text-slate-500'}`}>
                   <Settings size={20} className={isEditing ? 'animate-spin-slow text-white' : 'text-slate-500'} />
                </div>
                <div>
                   <h5 className={`text-[14px] font-black uppercase tracking-tight mb-1 ${isEditing ? 'text-white' : 'text-slate-900'}`}>{isEditing ? 'Live Registry Mutation Active' : 'Operational Constraint Configuration'}</h5>
                   <p className={`text-[10px] font-bold uppercase tracking-[0.2em] italic ${isEditing ? 'text-indigo-200' : 'text-slate-500'}`}>{isEditing ? 'Commit logic will cascade to all active shards instantly.' : 'Select a node tier to modify institutional pricing & provisioned capabilities.'}</p>
                </div>
             </div>
             <div className="flex gap-4">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="px-8 py-3 bg-indigo-500/50 hover:bg-indigo-500 border border-indigo-400/50 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all text-white">Discard</button>
                    <button onClick={handleSave} disabled={loading} className="px-10 py-3 bg-white text-indigo-600 hover:bg-slate-50 border border-transparent rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all flex items-center gap-3 shadow-lg">
                       {loading ? 'Committing...' : <><Check size={16} /> Finalize Mutation</>}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="px-10 py-3 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all flex items-center gap-3 text-slate-700">
                     <Edit2 size={16} /> Refactor Configuration
                  </button>
                )}
             </div>
          </div>
        </div>
      )}

      {/* MATRIX AUDIT VIEW */}
      {activeTab === 'matrix' && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden p-4 animate-in fade-in duration-500 shadow-sm">
           <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                 <tr className="text-[10px] font-black uppercase text-slate-500 tracking-[0.25em]">
                    <th className="px-10 py-6">Cross-Tier Capability Shard</th>
                    {plans.map(p => <th key={p.id} className="px-10 py-6 text-center text-slate-600">{p.name}</th>)}
                 </tr>
              </thead>
              <tbody>
                 {PLAN_MODELS[3].features.map((feat, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-all">
                       <td className="px-10 py-6 bg-white group-hover:bg-transparent first:rounded-l-[2rem] border-y border-l border-slate-100 text-[11px] font-black text-slate-700 uppercase tracking-widest">{feat}</td>
                       {plans.map((p, pIdx) => (
                          <td key={p.id} className={`px-10 py-6 bg-white group-hover:bg-transparent border-y border-slate-100 text-center ${pIdx === plans.length - 1 ? 'last:rounded-r-[2rem] border-r' : ''}`}>
                             {p.features?.includes(feat) 
                                ? <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 mx-auto border border-emerald-100 shadow-sm flex items-center justify-center"><Check size={14} /></div> 
                                : <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mx-auto" />}
                          </td>
                       ))}
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {/* NODE YIELD AUDIT */}
      {activeTab === 'clients' && (
        <div className="space-y-10 animate-in fade-in duration-500">
           <div className="flex justify-between items-center">
              <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] ml-1">Shard Yield Distribution</h4>
              <div className="relative group w-[300px]">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                   className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3 text-[11px] font-bold text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-400 uppercase tracking-wider shadow-sm"
                   placeholder="Find Node Identity..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTenants.map(t => {
                const plan = plans.find(p => p.id === (t.subscription_tier?.toLowerCase() || 'free')) || plans[0];
                return (
                  <div key={t.id} className="bg-white border border-slate-200 shadow-sm p-8 rounded-[2.5rem] flex items-center justify-between hover:border-indigo-200 hover:shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity">
                        <BarChart3 size={80} strokeWidth={1} text-indigo-600/>
                     </div>
                     <div className="flex items-center gap-6 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center font-black text-[12px] group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all">{t.code?.substring(0,2)}</div>
                        <div>
                           <div className="text-[14px] font-black text-slate-900 uppercase tracking-tighter leading-tight mb-1">{t.name}</div>
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{plan.name} Node</span>
                              <div className="w-1 h-1 rounded-full bg-slate-300" />
                              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{t.subdomain}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-1 relative z-10">
                        <div className="text-[16px] font-black text-slate-900 tabular-nums tracking-tighter italic">₹{plan.cost}</div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Yield / Mo</span>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>
      )}

      {/* SHARD LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-12 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                 { label: 'Aggregate Yield', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, trend: '+12.4%', color: 'emerald' },
                 { label: 'Node Count', value: tenants.length, icon: Box, trend: 'STABLE', color: 'indigo' },
                 { label: 'Avg Node Yield', value: `₹${Math.round(totalRevenue/tenants.length || 0).toLocaleString()}`, icon: TrendingUp, trend: '+4.2%', color: 'amber' },
                 { label: 'Platform Scaling', value: 'α-PHASE', icon: Activity, trend: 'OPTIMAL', color: 'emerald' },
              ].map((s, i) => (
                 <div key={i} className="bg-white border border-slate-200 shadow-sm p-8 rounded-[2.5rem] flex flex-col justify-between group hover:border-indigo-200 transition-all min-h-[160px]">
                    <div className="flex justify-between items-start">
                       <div className={`w-10 h-10 rounded-2xl bg-${s.color}-50 border border-${s.color}-100 text-${s.color}-600 flex items-center justify-center`}>
                          <s.icon size={18} />
                       </div>
                       <span className={`text-[10px] font-black text-${s.color}-700 uppercase tracking-widest bg-${s.color}-50 px-2 py-0.5 rounded-full border border-${s.color}-100`}>{s.trend}</span>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{s.label}</p>
                       <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{s.value}</p>
                    </div>
                 </div>
              ))}
           </div>

           <div className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] overflow-hidden p-4">
              <table className="w-full text-left border-separate border-spacing-y-2">
                 <thead>
                    <tr className="text-[10px] font-black uppercase text-slate-500 tracking-[0.25em]">
                       <th className="px-10 py-6">Facility Shard</th>
                       <th className="px-10 py-6 text-center">Authorization Tier</th>
                       <th className="px-10 py-6 text-center">Provisioned Date</th>
                       <th className="px-10 py-6 text-right">Settled Yield</th>
                    </tr>
                 </thead>
                 <tbody>
                    {tenants.map(t => {
                       const plan = plans.find(p => p.id === (t.subscription_tier?.toLowerCase() || 'free')) || plans[0];
                       return (
                          <tr key={t.id} className="group hover:bg-slate-50 transition-all">
                             <td className="px-10 py-6 bg-white group-hover:bg-transparent first:rounded-l-[2rem] border-y border-l border-slate-100">
                                <div className="text-[14px] font-black text-slate-900 uppercase tracking-tighter group-hover:text-indigo-600 transition-colors italic">{t.name}</div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] mt-0.5">Primary Administrative Node ID: {t.code?.substring(0,8)}</div>
                             </td>
                             <td className="px-10 py-6 bg-white group-hover:bg-transparent border-y border-slate-100 text-center">
                                <span className="px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 uppercase text-[10px] font-black text-slate-600 tracking-widest group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all">
                                   {plan.id} Tier
                                </span>
                             </td>
                             <td className="px-10 py-6 bg-white group-hover:bg-transparent border-y border-slate-100 text-center text-[11px] font-black text-slate-500 tabular-nums">
                                {t.created_at ? new Date(t.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'SYS-ORIGIN'}
                             </td>
                             <td className="px-10 py-6 bg-white group-hover:bg-transparent last:rounded-r-[2rem] border-y border-r border-slate-100 text-right font-black text-slate-900 text-[16px] tabular-nums tracking-tighter italic">
                                ₹{plan.cost}
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
}
