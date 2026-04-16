import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, Search, DollarSign, Table, Plus, X, Edit2, 
  Check, Settings, Activity, LayoutGrid, 
  ShieldCheck, Zap, Crown, Box, TrendingUp, 
  BarChart3, CreditCard, Save, RefreshCcw, Layers, 
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '../../api.js';
import { useToast } from '../../hooks/useToast.jsx';

// ─── Icon map by plan id ─────────────────────────────────────────────────────
const PLAN_ICONS = { free: Box, basic: ShieldCheck, professional: Zap, enterprise: Crown };
const PLAN_COLORS = { free: 'slate', basic: 'blue', professional: 'indigo', enterprise: 'emerald' };

// ─── Fallback catalog when API is unavailable ────────────────────────────────
const FALLBACK_PLANS = [
  { id: 'free',         name: 'Starter',      cost: '0',    period: 'Forever', color: 'slate',   moduleKeys: ['dashboard','patients','appointments','emr','reports','support','communication','documents','hospital_settings'], features: ['Community Support','Standard Reports','Up to 5 Users'] },
  { id: 'basic',        name: 'Basic',        cost: '199',  period: 'per mo',  color: 'blue',    moduleKeys: ['dashboard','patients','appointments','emr','reports','support','communication','documents','inventory','pharmacy','ambulance','lab','hospital_settings','departments'], features: ['Email Support','Advanced Analytics','Up to 25 Users'] },
  { id: 'professional', name: 'Professional', cost: '499',   period: 'per mo',  color: 'indigo',   moduleKeys: ['dashboard','patients','appointments','emr','reports','support','communication','documents','inventory','pharmacy','ambulance','lab','inpatient','billing','accounts','insurance','service_catalog','hospital_settings','departments','bed_management'], features: ['24/7 Support','Custom Branding','Unlimited Users'] },
  { id: 'enterprise',   name: 'Enterprise',   cost: '1299', period: 'per mo',  color: 'emerald', moduleKeys: ['dashboard','patients','appointments','emr','reports','admin','users','support','communication','documents','inventory','pharmacy','ambulance','lab','inpatient','billing','accounts','accounts_receivable','accounts_payable','insurance','service_catalog','hospital_settings','departments','bed_management','employees','hr','payroll','donor','ai_analysis','document_vault'], features: ['Dedicated Server','AI Assistance Matrix','99.9% SLA Guarantee'] },
];

const FALLBACK_MODULES = [
  { key: 'dashboard', label: 'Dashboard' }, { key: 'patients', label: 'Patient Registry' },
  { key: 'appointments', label: 'Appointments' }, { key: 'emr', label: 'Clinical EMR' },
  { key: 'inpatient', label: 'Inpatient / IPD' }, { key: 'pharmacy', label: 'Pharmacy' },
  { key: 'lab', label: 'Laboratory' }, { key: 'billing', label: 'Billing' },
  { key: 'accounts', label: 'Accounts' }, { key: 'accounts_receivable', label: 'Accounts Receivable' },
  { key: 'accounts_payable', label: 'Accounts Payable' }, { key: 'insurance', label: 'Insurance' },
  { key: 'inventory', label: 'Inventory' }, { key: 'employees', label: 'Employees' },
  { key: 'hr', label: 'HR Management' }, { key: 'payroll', label: 'Payroll' },
  { key: 'reports', label: 'Reports & Analytics' }, { key: 'service_catalog', label: 'Service Catalog' },
  { key: 'ambulance', label: 'Ambulance' }, { key: 'donor', label: 'Blood Bank / Donors' },
  { key: 'bed_management', label: 'Bed Management' }, { key: 'departments', label: 'Departments' },
  { key: 'hospital_settings', label: 'Hospital Settings' }, { key: 'communication', label: 'Communication' },
  { key: 'document_vault', label: 'Document Vault' }, { key: 'ai_analysis', label: 'AI Image Analysis' },
  { key: 'support', label: 'Support' }, { key: 'users', label: 'User Management' },
  { key: 'admin', label: 'Admin Console' },
];

export default function SubscriptionEngine({ tenants = [] }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [modules, setModules] = useState(FALLBACK_MODULES);
  const [selectedPlanId, setSelectedPlanId] = useState('professional');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [newFeature, setNewFeature] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModuleGroups, setExpandedModuleGroups] = useState({});

  // ── Load catalog from API ────────────────────────────────────────────────
  const loadCatalog = useCallback(async () => {
    setFetching(true);
    try {
      const data = await api.get('/admin/subscription-catalog');
      if (data?.plans?.length > 0) {
        setPlans(data.plans.map(p => ({ ...p, icon: PLAN_ICONS[p.id] || Box })));
      }
      if (data?.modules?.length > 0) {
        setModules(data.modules);
      }
    } catch (e) {
      console.warn('[SubscriptionEngine] Catalog API unavailable, using defaults:', e.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  // ── Price editor ────────────────────────────────────────────────────────
  const updatePlanField = (field, value) => {
    setPlans(prev => prev.map(p => p.id === selectedPlanId ? { ...p, [field]: value } : p));
  };

  // ── Module toggle in edit mode ───────────────────────────────────────────
  const toggleModule = (moduleKey) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== selectedPlanId) return p;
      const keys = p.moduleKeys || [];
      return {
        ...p,
        moduleKeys: keys.includes(moduleKey) ? keys.filter(k => k !== moduleKey) : [...keys, moduleKey]
      };
    }));
  };

  // ── Feature bullet editor ───────────────────────────────────────────────
  const addFeature = () => {
    if (!newFeature.trim()) return;
    setPlans(prev => prev.map(p => p.id === selectedPlanId ? { ...p, features: [...(p.features || []), newFeature.trim()] } : p));
    setNewFeature('');
  };
  const removeFeature = (idx) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== selectedPlanId) return p;
      const nf = [...p.features]; nf.splice(idx, 1);
      return { ...p, features: nf };
    }));
  };

  // ── Save plan to API ─────────────────────────────────────────────────────
  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/admin/subscription-catalog', { subscription: selectedPlan });
      showToast({ title: 'Plan Saved', message: `${selectedPlan.name} plan configuration committed to all shards.`, type: 'success' });
      setIsEditing(false);
    } catch (e) {
      showToast({ title: 'Save Failed', message: e.message || 'Could not persist plan configuration.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ── Update tenant subscription from the Yield Audit tab ─────────────────
  const updateTenantTier = async (tenantId, planId) => {
    try {
      await api.patch(`/superadmin/tenants/${tenantId}/subscription`, { tier: planId });
      showToast({ title: 'Tier Updated', message: `Subscription tier updated for tenant.`, type: 'success' });
    } catch (e) {
      showToast({ title: 'Update Failed', message: e.message, type: 'error' });
    }
  };

  const filteredTenants = tenants.filter(t =>
    (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = tenants.reduce((acc, t) => {
    const plan = plans.find(p => p.id === (t.subscription_tier?.toLowerCase() || 'free')) || plans[0];
    return acc + Number(plan?.cost || 0);
  }, 0);

  // ── Module groups for organized display ──────────────────────────────────
  const MODULE_GROUPS = [
    { label: 'Core Clinical', keys: ['dashboard','patients','emr','appointments','inpatient'] },
    { label: 'Diagnostics & Pharmacy', keys: ['lab','pharmacy','ambulance','donor'] },
    { label: 'Finance & Billing', keys: ['billing','accounts','accounts_receivable','accounts_payable','insurance','service_catalog'] },
    { label: 'Administration', keys: ['users','admin','employees','hr','payroll','hospital_settings','departments','bed_management'] },
    { label: 'Intelligence & Comms', keys: ['reports','communication','document_vault','ai_analysis','support'] },
  ];

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── HEADER ── */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[20px] font-black text-slate-900 tracking-tighter uppercase mb-1">Fiscal Governance</h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Economy HUD</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Subscription Matrix Control Layer</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCatalog}
            className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-sm"
            title="Reload catalog from server"
          >
            <RefreshCcw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-200 gap-1 shadow-inner">
            {[
              { id: 'plans',   label: 'Unit Pricing',    icon: LayoutGrid },
              { id: 'modules', label: 'Module Mapping',  icon: Layers },
              { id: 'matrix',  label: 'Feature Matrix',  icon: Table },
              { id: 'clients', label: 'Yield Audit',     icon: BarChart3 },
              { id: 'ledger',  label: 'Shard Ledger',    icon: CreditCard }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                }`}
              >
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ TAB: UNIT PRICING ══════════════════════════════════════════════ */}
      {activeTab === 'plans' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const PlanIcon = plan.icon || PLAN_ICONS[plan.id] || Box;
              const isSelected = selectedPlanId === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => { if (!isEditing) setSelectedPlanId(plan.id); }}
                  className={`group relative p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between min-h-[440px] bg-white ${
                    isSelected ? 'border-indigo-500 scale-[1.02] z-10 shadow-xl' : 'border-slate-100 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity">
                    <PlanIcon size={120} strokeWidth={1} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-slate-100 text-slate-500'}`}>
                        <PlanIcon size={22} />
                      </div>
                      {isSelected && (
                        <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] border border-indigo-100">
                          Selected Unit
                        </div>
                      )}
                    </div>

                    <h3 className="text-[16px] font-black uppercase tracking-tighter text-slate-900 mb-2">{plan.name}</h3>

                    {/* Price — editable in edit mode */}
                    <div className="flex items-baseline gap-2 mb-8 italic">
                      {isEditing && isSelected ? (
                        <div className="flex items-center bg-slate-50 border border-indigo-200 rounded-xl px-4 py-2 w-full gap-2">
                          <span className="text-[14px] font-black text-slate-400 uppercase">₹</span>
                          <input
                            className="bg-transparent w-full text-3xl font-black text-slate-900 focus:outline-none font-tabular tracking-tighter"
                            value={plan.cost}
                            onChange={(e) => updatePlanField('cost', e.target.value.replace(/[^0-9.]/g, ''))}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <>
                          <span className={`text-4xl font-black tracking-tighter tabular-nums ${isSelected ? 'text-indigo-600' : 'text-slate-900'}`}>₹{plan.cost}</span>
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{plan.period}</span>
                        </>
                      )}
                    </div>

                    {/* Feature bullets */}
                    <div className="space-y-3 relative z-10">
                      {(plan.features || []).map((feat, i) => (
                        <div key={i} className="flex items-center justify-between group/feat">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight truncate">{feat}</span>
                          </div>
                          {isEditing && isSelected && (
                            <button onClick={(e) => { e.stopPropagation(); removeFeature(i); }} className="text-slate-300 hover:text-rose-500 transition-colors shrink-0 ml-2">
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                      {isEditing && isSelected && (
                        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                          <input
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-400"
                            placeholder="Add feature bullet..."
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                          />
                          <button onClick={addFeature} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all">
                            <Plus size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Module count badge */}
                    <div className="mt-4 pt-4 border-t border-slate-50">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {(plan.moduleKeys || []).length} modules enabled
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action bar */}
          <div className={`p-8 rounded-[2.5rem] flex items-center justify-between border transition-all duration-500 ${isEditing ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
            <div className="flex items-center gap-6">
              <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center ${isEditing ? 'bg-white/20' : 'bg-slate-50 border border-slate-100 text-slate-500'}`}>
                <Settings size={20} className={isEditing ? 'animate-spin-slow text-white' : 'text-slate-500'} />
              </div>
              <div>
                <h5 className={`text-[14px] font-black uppercase tracking-tight mb-1 ${isEditing ? 'text-white' : 'text-slate-900'}`}>
                  {isEditing ? 'Live Registry Mutation Active' : 'Operational Constraint Configuration'}
                </h5>
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] italic ${isEditing ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {isEditing ? 'Commit logic will cascade to all active shards instantly.' : 'Select a plan to modify pricing, feature bullets & enabled modules.'}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              {isEditing ? (
                <>
                  <button onClick={() => { setIsEditing(false); loadCatalog(); }} className="px-8 py-3 bg-indigo-500/50 hover:bg-indigo-500 border border-indigo-400/50 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all text-white">Discard</button>
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

      {/* ══ TAB: MODULE MAPPING ════════════════════════════════════════════ */}
      {activeTab === 'modules' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Plan selector */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Editing Plan:</span>
            <div className="flex bg-white border border-slate-200 p-1 rounded-2xl gap-1 shadow-sm">
              {plans.map(p => {
                const PI = PLAN_ICONS[p.id] || Box;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedPlanId === p.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <PI size={11} /> {p.name}
                  </button>
                );
              })}
            </div>
            <span className="ml-auto text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
              {(selectedPlan?.moduleKeys || []).length} / {modules.length} modules active
            </span>
          </div>

          {/* Module groups */}
          {MODULE_GROUPS.map(group => {
            const groupModules = modules.filter(m => group.keys.includes(m.key));
            const enabledCount = groupModules.filter(m => (selectedPlan?.moduleKeys || []).includes(m.key)).length;
            const isExpanded = expandedModuleGroups[group.label] !== false; // default open

            return (
              <div key={group.label} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                <button
                  onClick={() => setExpandedModuleGroups(prev => ({ ...prev, [group.label]: !isExpanded }))}
                  className="w-full flex items-center justify-between px-8 py-5 hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Layers size={16} className="text-indigo-400" />
                    <span className="text-[12px] font-black text-slate-900 uppercase tracking-wider">{group.label}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                      enabledCount === groupModules.length ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      enabledCount > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {enabledCount}/{groupModules.length} active
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-8 pb-8">
                    {groupModules.map(mod => {
                      const active = (selectedPlan?.moduleKeys || []).includes(mod.key);
                      return (
                        <button
                          key={mod.key}
                          onClick={() => toggleModule(mod.key)}
                          className={`flex items-center justify-between gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                            active
                              ? 'border-emerald-400 bg-emerald-50/60 text-emerald-700'
                              : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-[11px] font-black uppercase tracking-tight">{mod.label}</span>
                          {active
                            ? <ToggleRight size={18} className="text-emerald-500 shrink-0" />
                            : <ToggleLeft size={18} className="text-slate-300 shrink-0" />
                          }
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Save button */}
          <div className="flex justify-end gap-4">
            <button onClick={loadCatalog} className="px-6 py-3 rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all">
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-3 px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all shadow-lg shadow-indigo-100"
            >
              {loading ? 'Saving...' : <><Save size={14} /> Commit Module Map</>}
            </button>
          </div>
        </div>
      )}

      {/* ══ TAB: FEATURE MATRIX ═══════════════════════════════════════════ */}
      {activeTab === 'matrix' && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden p-4 animate-in fade-in duration-500 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black uppercase text-slate-500 tracking-[0.25em]">
                  <th className="px-8 py-6 sticky left-0 bg-white">Module</th>
                  {plans.map(p => {
                    const PI = PLAN_ICONS[p.id] || Box;
                    return (
                      <th key={p.id} className="px-8 py-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <PI size={14} className="text-indigo-400" />
                          <span>{p.name}</span>
                          <span className="text-indigo-400 font-black">₹{p.cost}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => (
                  <tr key={mod.key} className="group hover:bg-slate-50 transition-all">
                    <td className="px-8 py-4 bg-white group-hover:bg-transparent first:rounded-l-2xl border-y border-l border-slate-100 text-[11px] font-black text-slate-700 uppercase tracking-widest sticky left-0">
                      {mod.label}
                    </td>
                    {plans.map((p, pIdx) => {
                      const enabled = (p.moduleKeys || []).includes(mod.key);
                      return (
                        <td key={p.id} className={`px-8 py-4 bg-white group-hover:bg-transparent border-y border-slate-100 text-center ${pIdx === plans.length - 1 ? 'last:rounded-r-2xl border-r' : ''}`}>
                          {enabled
                            ? <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 mx-auto border border-emerald-100 shadow-sm flex items-center justify-center"><Check size={14} /></div>
                            : <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mx-auto" />
                          }
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ TAB: YIELD AUDIT ══════════════════════════════════════════════ */}
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
              const PI = PLAN_ICONS[plan.id] || Box;
              return (
                <div key={t.id} className="bg-white border border-slate-200 shadow-sm p-8 rounded-[2.5rem] flex items-center justify-between hover:border-indigo-200 hover:shadow-md hover:-translate-y-1 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center font-black text-[12px] group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                      {(t.code || '??').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[14px] font-black text-slate-900 uppercase tracking-tighter leading-tight mb-1">{t.name}</div>
                      <div className="flex items-center gap-2">
                        <PI size={10} className="text-indigo-400" />
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{plan.name}</span>
                      </div>
                      {/* Tier changer */}
                      <select
                        className="mt-2 text-[9px] font-black uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 outline-none hover:border-indigo-300 transition-all cursor-pointer"
                        defaultValue={t.subscription_tier?.toLowerCase() || 'free'}
                        onChange={(e) => updateTenantTier(t.id, e.target.value)}
                      >
                        {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-[16px] font-black text-slate-900 tabular-nums tracking-tighter italic">₹{plan.cost}</div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Yield / Mo</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ TAB: SHARD LEDGER ═════════════════════════════════════════════ */}
      {activeTab === 'ledger' && (
        <div className="space-y-12 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Aggregate Yield',  value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, trend: '+12.4%', color: 'emerald' },
              { label: 'Node Count',        value: tenants.length,                       icon: Box,         trend: 'STABLE',  color: 'indigo' },
              { label: 'Avg Node Yield',    value: `₹${Math.round(totalRevenue / (tenants.length || 1)).toLocaleString()}`, icon: TrendingUp,  trend: '+4.2%',  color: 'amber' },
              { label: 'Platform Scaling',  value: 'α-PHASE',                             icon: Activity,    trend: 'OPTIMAL', color: 'emerald' },
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
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mt-0.5">ID: {(t.code || '').substring(0, 8)}</div>
                      </td>
                      <td className="px-10 py-6 bg-white group-hover:bg-transparent border-y border-slate-100 text-center">
                        <span className="px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 uppercase text-[10px] font-black text-slate-600 tracking-widest group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all">
                          {plan.name}
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
