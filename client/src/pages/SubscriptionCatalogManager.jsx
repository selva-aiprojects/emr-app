import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { api } from '../api.js';
import { 
  Package, 
  Target, 
  Zap, 
  ShieldCheck, 
  Users, 
  DollarSign, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  RefreshCcw, 
  Edit3, 
  Rocket, 
  BrainCircuit,
  Terminal,
  ChevronRight,
  Info
} from 'lucide-react';
import '../styles/critical-care.css';

export default function SubscriptionCatalogManager() {
  const { showToast } = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('catalog');
  const [editingSubscription, setEditingSubscription] = useState(null);

  // Available feature definitions
  const availableFeatures = [
    {
      id: 'permission-core_engine-access',
      name: 'Core EMR Engine',
      description: 'Fundamental clinical data structures, patient registries, and longitudinal health records',
      category: 'Clinical',
      icon: Activity,
      tier: 'Basic'
    },
    {
      id: 'permission-customer_support-access',
      name: 'Experience Governance',
      description: 'Patient relationship management and institutional support ticketing protocol',
      category: 'Operations',
      icon: ShieldCheck,
      tier: 'Professional'
    },
    {
      id: 'permission-hr_payroll-access',
      name: 'Human Capital & Payroll',
      description: 'Operational workforce management and automated payroll ledger integration',
      category: 'Governance',
      icon: Users,
      tier: 'Enterprise'
    },
    {
      id: 'permission-accounts-access',
      name: 'Financial Intelligence',
      description: 'Enterprise-grade billing, institutional treasury oversight, and revenue cycle management',
      category: 'Finance',
      icon: DollarSign,
      tier: 'Enterprise'
    }
  ];

  // Default subscription templates
  const defaultSubscriptions = [
    {
      id: 'basic',
      name: 'Clinical Core',
      displayName: 'Clinical Core Protocol',
      description: 'Essential medical data management for individual practices and small clinics.',
      price: '$99/mo',
      features: ['permission-core_engine-access'],
      color: 'slate',
      icon: Terminal,
      popular: false
    },
    {
      id: 'professional',
      name: 'Institutional',
      displayName: 'Institutional Professional',
      description: 'Advanced clinical operations with integrated patient experience governance.',
      price: '$299/mo',
      features: ['permission-core_engine-access', 'permission-customer_support-access'],
      color: 'emerald',
      icon: Target,
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Apex',
      displayName: 'Enterprise Apex Tier',
      description: 'The complete digital ecosystem for multi-facility hospital networks.',
      price: '$599/mo',
      features: ['permission-core_engine-access', 'permission-customer_support-access', 'permission-hr_payroll-access', 'permission-accounts-access'],
      color: 'indigo',
      icon: BrainCircuit,
      popular: false
    }
  ];

  useEffect(() => {
    loadSubscriptions();
    loadFeatures();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setSubscriptions(defaultSubscriptions);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async () => {
    setFeatures(availableFeatures);
  };

  const saveSubscription = async (subscription) => {
    try {
      setSaving(true);
      console.log('Synchronizing subscription bundle:', subscription);
      await new Promise(resolve => setTimeout(resolve, 800));
      setSubscriptions(prev => 
        prev.map(sub => sub.id === subscription.id ? subscription : sub)
      );
      setEditingSubscription(null);
      showToast({ message: 'Subscription updated.', type: 'success', title: 'Subscriptions' });
    } catch (error) {
      console.error('Handshake failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const applySubscriptionToTenants = async (subscriptionId) => {
    try {
      const subscription = subscriptions.find(sub => sub.id === subscriptionId);
      if (!subscription) return;
      
      console.log(`Deploying ${subscription.name} protocol to global nodes...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast({ message: 'Subscription deployed to all nodes.', type: 'success', title: 'Subscriptions' });
    } catch (error) {
       console.error('Deployment error:', error);
    }
  };

  const resetToDefaults = () => {
    setSubscriptions(defaultSubscriptions);
  };

  return (
    <div className="page-shell-premium animate-fade-in">
      {/* 1. HEADER */}
      <div className="page-header-premium mb-8">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-900/20 ring-4 ring-indigo-50">
              <Package className="w-7 h-7" />
           </div>
           <div>
              <h1 className="tracking-tight">Subscription Catalog Governance</h1>
              <p className="dim-label uppercase tracking-[0.2em] font-black text-[10px]">Commercial Tiering & Feature Provisioning Registry</p>
           </div>
        </div>
        <div className="flex gap-3">
           <button className="btn-premium flex items-center gap-2">
              <Plus className="w-4 h-4" /> Define New Tier
           </button>
           <button className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-sm" onClick={loadSubscriptions}>
              <RefreshCcw className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="action-bar-premium mb-10 overflow-hidden">
        <div className="flex-1 flex bg-slate-50/50 p-1.5 rounded-2xl w-fit">
           {[
             { id: 'catalog', label: 'Subscription Tiers', icon: Package },
             { id: 'features', label: 'Feature Library', icon: BrainCircuit },
             { id: 'apply', label: 'Global Deployment', icon: Rocket }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                 activeTab === tab.id 
                 ? 'bg-white text-slate-950 shadow-sm border border-slate-200/50' 
                 : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-indigo-500' : 'text-slate-300'}`} />
               {tab.label}
             </button>
           ))}
        </div>
        <div className="flex items-center gap-3 px-6 border-l border-slate-200">
           <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 tabular-nums">Registry Status:</div>
           <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-emerald-100">Synchronized</div>
        </div>
      </div>

      {/* 3. CONTENT AREA */}
      {activeTab === 'catalog' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subscriptions.map(subscription => (
              <article 
                key={subscription.id} 
                className={`clinical-card flex flex-col relative group hover:scale-[1.02] transition-all duration-500 overflow-hidden ${
                  subscription.popular ? 'border-indigo-500 ring-4 ring-indigo-50' : ''
                }`}
              >
                {subscription.popular && (
                  <div className="absolute top-0 right-0 p-3">
                    <div className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg shadow-xl ring-2 ring-white">
                       Institutional Standard
                    </div>
                  </div>
                )}
                
                <div className="mb-8">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${
                     subscription.color === 'slate' ? 'bg-slate-900 text-white' :
                     subscription.color === 'emerald' ? 'bg-emerald-600 text-white' :
                     'bg-indigo-600 text-white'
                   }`}>
                      <subscription.icon className="w-6 h-6" />
                   </div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">{subscription.displayName}</h3>
                   <div className="flex items-baseline gap-2 mt-4">
                      <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">{subscription.price.split('/')[0]}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">/ per facility month</span>
                   </div>
                </div>

                <p className="text-xs font-medium text-slate-500 leading-relaxed mb-10 h-10 overflow-hidden text-ellipsis line-clamp-2">
                   {subscription.description}
                </p>
                
                <div className="flex-1 space-y-4 mb-10">
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 pb-3 border-b border-slate-50">Included Modules</div>
                   {features
                      .filter(feature => subscription.features.includes(feature.id))
                      .map(feature => (
                        <div key={feature.id} className="flex items-start gap-3 group/item">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                          <div>
                            <div className="text-[11px] font-bold text-slate-800 tracking-tight uppercase leading-none">{feature.name}</div>
                            <div className="text-[9px] text-slate-400 font-medium leading-relaxed mt-1">{feature.description}</div>
                          </div>
                        </div>
                      ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                    <button 
                      className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-50 shadow-sm"
                      onClick={() => setEditingSubscription(subscription)}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Modify Bundle
                    </button>
                    <button 
                      className="flex items-center justify-center gap-2 py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[var(--primary)]/20"
                      onClick={() => applySubscriptionToTenants(subscription.id)}
                    >
                      <Rocket className="w-3.5 h-3.5" /> Provision
                    </button>
                </div>
              </article>
            ))}
          </div>

          <div className="p-8 glass-panel border-l-4 border-l-indigo-500 flex items-start gap-6 bg-indigo-50/10">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
               <Info className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 uppercase tracking-tight">Production Environment Handshake</h4>
              <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-5xl mt-1">
                Structural changes to subscription tiers are staged in the catalog registry before being committed to global tenant nodes. Any modifications to feature provisioning will trigger a sequential terminal handshake across all active sessions to normalize access control lists.
              </p>
              <div className="flex gap-3 mt-6">
                 <button className="btn-premium px-8" onClick={() => showToast({ message: 'Catalog publishing initiated.', type: 'success', title: 'Subscriptions' })}>
                    Publish Global Catalog Changes
                 </button>
                 <button className="px-6 py-2.5 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all" onClick={resetToDefaults}>
                    Revert to Default Templates
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <article key={feature.id} className="clinical-card flex gap-6 group hover:border-[var(--primary)] transition-all">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[var(--primary-soft)] group-hover:text-[var(--primary)] transition-all shrink-0">
                   <feature.icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-start mb-2">
                      <h4 className="text-base font-black text-slate-900 tracking-tight uppercase tracking-widest">{feature.name}</h4>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 bg-slate-100 text-slate-500 rounded-md">{feature.category}</span>
                   </div>
                   <p className="text-xs font-medium text-slate-500 leading-relaxed mb-4 max-w-md">
                      {feature.description}
                   </p>
                   <div className="flex items-center gap-2">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Baseline Tier Recommendation:</div>
                      <div className="text-[10px] font-black text-slate-900 uppercase">{feature.tier}</div>
                   </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'apply' && (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
           {subscriptions.map(subscription => (
             <div key={subscription.id} className="glass-panel p-6 flex justify-between items-center bg-white/40 group hover:bg-white transition-all shadow-sm">
                <div className="flex items-center gap-6">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                     subscription.color === 'slate' ? 'bg-slate-900 text-white' :
                     subscription.color === 'emerald' ? 'bg-emerald-600 text-white' :
                     'bg-indigo-600 text-white'
                   }`}>
                      <subscription.icon className="w-5 h-5" />
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">{subscription.displayName}</h4>
                      <div className="flex items-center gap-3 mt-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subscription.features.length} Modules Provisioned</span>
                         <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subscription.price}</span>
                      </div>
                   </div>
                </div>
                <button 
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg shadow-slate-900/10 group-hover:scale-105"
                  onClick={() => applySubscriptionToTenants(subscription.id)}
                >
                   Deploy to All Nodes
                </button>
             </div>
           ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingSubscription && (
        <div className="modal-overlay-premium active animate-fade-in">
          <div className="modal-container-premium max-w-2xl slide-up">
            <div className="modal-header">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                     <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight uppercase tracking-widest">Protocol Override</h2>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Subscription Bundle Definition</p>
                  </div>
               </div>
               <button className="p-2 hover:bg-slate-100 rounded-xl transition-all" onClick={() => setEditingSubscription(null)}>
                  <XCircle className="w-5 h-5 text-slate-400" />
               </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="form-group flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Bundle Name</label>
                  <input 
                    type="text" 
                    value={editingSubscription.displayName}
                    className="input-field"
                    onChange={(e) => setEditingSubscription({
                      ...editingSubscription,
                      displayName: e.target.value
                    })}
                  />
                </div>
                <div className="form-group flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Price Hook</label>
                  <input 
                    type="text" 
                    value={editingSubscription.price}
                    className="input-field"
                    onChange={(e) => setEditingSubscription({
                      ...editingSubscription,
                      price: e.target.value
                    })}
                  />
                </div>
              </div>

              <div className="form-group flex flex-col gap-2 mb-8">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Marketing Narrative</label>
                <textarea 
                  value={editingSubscription.description}
                  className="input-field min-h-[100px] py-4"
                  onChange={(e) => setEditingSubscription({
                    ...editingSubscription,
                    description: e.target.value
                  })}
                />
              </div>

              <div className="form-group mb-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-4">Module Provisioning Registry</label>
                <div className="grid grid-cols-2 gap-4">
                  {features.map(feature => (
                    <label key={feature.id} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all cursor-pointer bg-white group hover:shadow-sm">
                      <div className="mt-1">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={editingSubscription.features.includes(feature.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingSubscription({
                                ...editingSubscription,
                                features: [...editingSubscription.features, feature.id]
                              });
                            } else {
                              setEditingSubscription({
                                ...editingSubscription,
                                features: editingSubscription.features.filter(f => f !== feature.id)
                              });
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
                            <feature.icon className="w-3 h-3 text-slate-400" />
                            <div className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{feature.name}</div>
                         </div>
                         <div className="text-[10px] text-slate-400 font-medium leading-normal">{feature.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-10">
                <button className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-slate-900 transition-all uppercase text-[10px] tracking-[0.2em]" onClick={() => setEditingSubscription(null)}>
                  Cancel Override
                </button>
                <button 
                  className="btn-premium px-8" 
                  onClick={() => saveSubscription(editingSubscription)}
                  disabled={saving}
                >
                  {saving ? 'Synchronizing Registry...' : 'Commit Protocol Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



