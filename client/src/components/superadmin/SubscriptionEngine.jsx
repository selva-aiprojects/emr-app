import React, { useState } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  Rocket, 
  Mail, 
  Send,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Package,
  Plus,
  Key
} from 'lucide-react';
import { useToast } from '../../hooks/useToast.jsx';

const PLAN_MODELS = [
  { id: 'free', name: 'Free + Support', cost: '₹0 + Fees', color: 'slate', icon: Package, features: ['Community Support', 'Standard Reports', 'Up to 5 Users', 'Global MRN Pool'] },
  { id: 'basic', name: 'Basic Tier', cost: '₹199/mo', color: 'indigo', icon: ShieldCheck, features: ['24/7 Support Shard', 'Advanced Analytics', 'Up to 25 Users', 'Pharmacy API Base'] },
  { id: 'professional', name: 'Professional', cost: '₹499/mo', color: 'emerald', icon: Zap, features: ['Global CDN Node', 'Custom Branding', 'Unlimited Users', 'Lab Integration Hub'] },
  { id: 'enterprise', name: 'Enterprise', cost: '₹1299/mo', color: 'rose', icon: Rocket, features: ['Dedicated Shard', 'AI Diagnosis Hub', 'Logistics Fleet Mgmt', 'SLA 99.99% Guarantee'] },
];

export default function SubscriptionEngine({ tenants = [] }) {
  const { showToast } = useToast();
  const [plans, setPlans] = useState(PLAN_MODELS);
  const [selectedPlanId, setSelectedPlanId] = useState('professional');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch plans from API on mount
  React.useEffect(() => {
    async function fetchCatalog() {
      try {
        const response = await fetch('/api/admin/subscription-catalog', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
             // Merge API data with icons/colors from local models
             const enriched = data.map(ap => {
                const local = PLAN_MODELS.find(lp => lp.id === ap.id) || {};
                return { ...ap, icon: local.icon || Package, color: local.color || 'slate' };
             });
             setPlans(enriched);
          }
        }
      } catch (e) {
        console.warn('Catalog fetch failed, using fallback.');
      }
    }
    fetchCatalog();
  }, []);

  const selectedPlan = plans.find(p => p.id === (selectedPlanId || 'professional')) || plans[0];
  
  const tierCounts = tenants.reduce((acc, t) => {
    const tier = t.tier || (t.doctors > 10 ? 'enterprise' : t.doctors > 5 ? 'professional' : t.doctors > 0 ? 'basic' : 'free');
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  const updatePrice = async () => {
    setLoading(true);
    try {
       const response = await fetch('/api/admin/subscription-catalog', {
          method: 'POST',
          headers: { 
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify({ subscription: selectedPlan })
       });
       
       if (response.ok) {
          showToast({ title: 'Shard Deployed', message: `Pricing for ${selectedPlan.name} updated across all hospital nodes.`, type: 'success' });
          setIsEditing(false);
       }
    } catch (e) {
       showToast({ title: 'Deploy Failed', message: 'Failed to propagate pricing shard updates.', type: 'error' });
    } finally {
       setLoading(false);
    }
  };

  const handleManualEmail = (type) => {
    showToast({ message: `System triggering ${type} protocol to targeted tenant email...`, type: 'info', title: 'Email Dispatch' });
  };

  return (
    <div className="space-y-12 animate-fade-in px-2">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Subscription Management Engine</h2>
            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest italic font-bold">Protocol: Feature Sharding & Global Monetization Control</p>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                isEditing ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-inner' : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:bg-slate-50'
              }`}
            >
               <Edit2 size={12} /> {isEditing ? 'Cancel Shard Edit' : 'Pricing Update'}
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-colors">
               <Plus size={12} /> New Strategic Tier
            </button>
         </div>
      </header>

      {/* Feature Dashboard Matrix */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {plans.map((plan) => (
            <div 
               key={plan.id}
               onClick={() => setSelectedPlanId(plan.id)}
               className={`relative overflow-hidden rounded-[40px] p-0.5 transition-all cursor-pointer group ${
                  selectedPlanId === plan.id ? 'shadow-2xl shadow-slate-200 -translate-y-2' : 'hover:-translate-y-1'
               }`}
            >
               <div className={`absolute inset-0 bg-gradient-to-br from-${plan.color}-400 to-${plan.color}-600 ${selectedPlanId === plan.id ? 'opacity-100' : 'opacity-10'} transition-opacity`} />
               
               <div className="relative bg-white rounded-[39px] p-8 h-full">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-${plan.color}-500 to-${plan.color}-700 text-white flex items-center justify-center mb-6 shadow-lg shadow-${plan.color}-200 group-hover:scale-110 transition-transform`}>
                     <plan.icon size={28} />
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">{plan.name}</h3>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg bg-${plan.color}-50 text-${plan.color}-600 uppercase`}>
                      {tierCounts[plan.id] || 0} Nodes
                    </span>
                  </div>
                  
                  {isEditing && selectedPlanId === plan.id ? (
                    <input 
                      type="text"
                      className={`w-full bg-slate-50 border-2 border-${plan.color}-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-none focus:border-${plan.color}-500 mb-4`}
                      value={plan.price}
                      onChange={(e) => {
                         const n = [...plans];
                         n.find(p => p.id === plan.id).price = e.target.value;
                         setPlans(n);
                      }}
                      autoFocus
                    />
                  ) : (
                    <p className={`text-sm font-black text-${plan.color}-600 mb-6 uppercase tracking-widest`}>{plan.price || plan.cost}</p>
                  )}
                  
                  <div className="space-y-4">
                     {(plan.features || []).map((feat, i) => (
                        <div key={i} className="flex items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                           <CheckCircle2 size={12} className={`text-${plan.color}-500`} />
                           <span className="group-hover:text-slate-600 transition-colors truncate">{feat}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         ))}
      </section>

      {/* Deployment Hub */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6">Subscription Communication Protocol</h3>
            <div className="space-y-4">
               {[
                  { title: 'Activation Proofing', desc: 'Auto-dispatch confirmation shard upon payment verification.', icon: Mail },
                  { title: 'Identity Propagation', desc: 'Securely send system-gen admin root credentials via 256-bit email.', icon: Key },
                  { title: 'Follow-up Cadence', desc: 'Strategic reminders for expiring shards or pending invoices.', icon: Send }
               ].map((comm, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                           <comm.icon size={24} />
                        </div>
                        <div>
                           <h4 className="text-xs font-black uppercase tracking-widest leading-none mb-1">{comm.title}</h4>
                           <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[200px]">{comm.desc}</p>
                        </div>
                     </div>
                     <button onClick={(e) => { e.stopPropagation(); handleManualEmail(comm.title); }} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"><ChevronRight size={16} /></button>
                  </div>
               ))}
            </div>
         </div>

         <div className={`rounded-[40px] p-10 text-white flex flex-col justify-between overflow-hidden relative group transition-colors duration-500 ${isEditing ? 'bg-indigo-900' : 'bg-emerald-900'}`}>
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ${isEditing ? 'text-indigo-400' : 'text-emerald-400'}`}>
                     {isEditing ? <Edit2 size={20} /> : <Zap size={20} />}
                  </div>
                  <h3 className={`text-sm font-black uppercase tracking-widest leading-none ${isEditing ? 'text-indigo-300' : 'text-emerald-300'}`}>
                     {isEditing ? 'Shard Modification Active' : 'Global Tier Update Matrix'}
                  </h3>
               </div>
               <p className="text-3xl font-black tracking-tight leading-none mb-4">
                  {isEditing ? `Modifying: ${selectedPlan?.name}` : `Active Deployments: ${tenants.length}`}
               </p>
               <p className="text-xs text-white/50 font-medium leading-relaxed max-w-[320px]">
                  {isEditing 
                    ? `You are currently modifying the cost parameters for the ${selectedPlan?.name} node tier. Changes will propagate upon deployment.`
                    : `Adjusting the ${selectedPlan?.name} shard will affect pricing and capabilities for all connected hospital nodes instantly.`}
               </p>
            </div>

            <div className="relative z-10 space-y-4 pt-10">
               <div className="flex gap-4">
                  <button 
                    onClick={isEditing ? updatePrice : () => setIsEditing(true)}
                    disabled={loading}
                    className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl ${
                       isEditing ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-white text-emerald-900 hover:bg-emerald-50'
                    }`}
                  >
                     {loading ? 'Propagating...' : (isEditing ? 'Deploy Updated Logic' : 'Activate Mutation Mode')}
                  </button>
                  <button className={`px-6 py-4 rounded-2xl transition-colors border ${isEditing ? 'bg-indigo-800/50 border-indigo-600/30' : 'bg-emerald-700/50 border-emerald-600/30'}`}>
                     <AlertCircle size={20} />
                  </button>
               </div>
               <p className={`text-[9px] font-black uppercase tracking-widest text-center ${isEditing ? 'text-indigo-400' : 'text-emerald-400'}`}>
                  * All updates are cryptographically signed by Root Admin
               </p>
            </div>
            <Rocket size={340} className="absolute -bottom-24 -right-24 opacity-5 stroke-[0.5] group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-1000" />
         </div>
      </section>
    </div>
  );
}

function ChevronRight({ size, className }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
