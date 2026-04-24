import React, { useState, useMemo } from 'react';
import { Tag, Percent, ArrowUpRight, Zap, Shield, Rocket, CheckCircle2, Package, Save, Plus, Calendar, Flame, Wind, Sun, CloudRain, Trash2, Edit3, Globe, Sparkles, X, Building, TrendingUp } from 'lucide-react';
import { useToast } from '../../hooks/useToast.jsx';

export default function OfferManagement({ tenants = [] }) {
  const { showToast } = useToast();
  
  const tierCounts = useMemo(() => {
    const counts = { Essentials: 0, Professional: 0, Enterprise: 0 };
    (tenants || []).forEach(t => {
      const tier = t.subscription_tier || 'Essentials';
      if (counts[tier] !== undefined) counts[tier]++;
    });
    return counts;
  }, [tenants]);

  const [tiers, setTiers] = useState([
    { id: 1, name: 'Essentials', price: 199, coreFeatures: 'Up to 5 Users, Standard Dashboard, IPD/OPD Registry', icon: Package, color: 'slate' },
    { id: 2, name: 'Professional', price: 499, coreFeatures: 'Up to 25 Users, Pharmacy/Lab Integration, Advance Billing', icon: Zap, color: 'indigo' },
    { id: 3, name: 'Enterprise', price: 1299, coreFeatures: 'Unlimited Users, AI Vision, Logistics Hub, Support Node', icon: Rocket, color: 'rose' }
  ]);

  const [isMasterEnabled, setIsMasterEnabled] = useState(() => {
    return localStorage.getItem('platform_advertising_enabled') !== 'false';
  });

  const [activeOffers, setActiveOffers] = useState(() => {
    const saved = localStorage.getItem('platform_campaign_roster');
    if (saved) return JSON.parse(saved);
    return [
      { id: 101, title: 'Monsoon Resilience Pack', targetTier: 'Professional', discount: '15%', status: 'Active', season: 'Monsoon', demand: 'High', color: 'blue' },
      { id: 102, title: 'Summer Expansion Drive', targetTier: 'Enterprise', discount: '10%', status: 'Stopped', season: 'Summer', demand: 'Medium', color: 'amber' },
      { id: 103, title: 'Winter Wellness Festival', targetTier: 'Essentials', discount: '20%', status: 'Active', season: 'Winter', demand: 'Peak', color: 'indigo' },
    ];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newOffer, setNewOffer] = useState({
    title: '',
    targetTier: 'Professional',
    discount: '',
    season: 'All Year',
    demand: 'Normal',
    color: 'indigo'
  });

  const seasons = {
    'Summer': Sun,
    'Monsoon': CloudRain,
    'Winter': Wind,
    'Spring': Sparkles,
    'All Year': Globe
  };

  const handleUpdatePrice = (id, newPrice) => {
    setTiers(tiers.map(t => t.id === id ? { ...t, price: Number(newPrice) } : t));
  };

  const handleSave = () => {
    const activeOffer = activeOffers.find(o => o.status === 'Active');
    localStorage.setItem('platform_campaign_roster', JSON.stringify(activeOffers));
    localStorage.setItem('platform_advertising_enabled', String(isMasterEnabled));
    
    if (activeOffer && isMasterEnabled) {
      localStorage.setItem('active_seasonal_campaign', JSON.stringify(activeOffer));
      showToast({ message: `Strategic campaign "${activeOffer.title}" deployed to all eligible nodes.`, type: 'success', title: 'Global Deployment' });
    } else {
      localStorage.removeItem('active_seasonal_campaign');
      showToast({ message: 'All active campaigns revoked from global nodes.', type: 'info', title: 'Global Economics' });
    }
    // Trigger a storage event for same-window updates
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddOffer = () => {
    if (!newOffer.title) return;
    const offer = {
      ...newOffer,
      id: Date.now(),
      status: 'Active',
    };
    setActiveOffers([offer, ...activeOffers]);
    setIsAdding(false);
    setNewOffer({ title: '', targetTier: 'Professional', discount: '', season: 'All Year', demand: 'Normal', color: 'indigo' });
    showToast({ message: `New seasonal campaign "${offer.title}" is now live.`, type: 'success' });
  };

  const toggleStatus = (id) => {
    setActiveOffers(activeOffers.map(o => {
      if (o.id === id) {
        const newStatus = o.status === 'Active' ? 'Stopped' : 'Active';
        showToast({ 
          message: `Campaign "${o.title}" ${newStatus === 'Active' ? 'enabled' : 'stopped'}.`, 
          type: newStatus === 'Active' ? 'success' : 'info' 
        });
        return { ...o, status: newStatus };
      }
      return o;
    }));
  };

  const handleRevoke = (id) => {
    setActiveOffers(activeOffers.filter(o => o.id !== id));
    showToast({ message: 'Campaign revoked and removed from global nodes.', type: 'info' });
  };

  const handleSystemReset = () => {
    if (window.confirm('HARD SYSTEM RESET: This will purge all campaigns and reset the advertising engine to factory defaults. Continue?')) {
      localStorage.removeItem('active_seasonal_campaign');
      localStorage.removeItem('platform_advertising_enabled');
      localStorage.removeItem('platform_campaign_roster');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-12 animate-fade-in">
      {/* PHASE 1: MARKET CONTROL CENTER */}
      <header className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
           <div className="space-y-2">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <Rocket className="text-white" size={24} />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black tracking-tight uppercase">Economic Engine</h2>
                    <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em]">Platform Monetization & Ad Sharding</p>
                 </div>
              </div>
           </div>

           <div className="flex flex-wrap items-center gap-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl flex items-center gap-6">
                 <div>
                    <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Advertising Engine</p>
                    <div className="flex items-center gap-2">
                       <span className={`text-xs font-black uppercase ${isMasterEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {isMasterEnabled ? 'Global Broadcast Active' : 'Broadcast Halted'}
                       </span>
                    </div>
                 </div>
                 <button 
                    onClick={() => setIsMasterEnabled(!isMasterEnabled)}
                    className={`w-14 h-8 rounded-full relative transition-all duration-300 ${isMasterEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-slate-700'}`}
                 >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${isMasterEnabled ? 'left-7' : 'left-1'}`} />
                 </button>
              </div>

              <div className="flex flex-col gap-2">
                 <button onClick={handleSave} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2">
                    <Globe size={16} /> Finalize & Deploy to Nodes
                 </button>
                 <button onClick={handleSystemReset} className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] hover:text-rose-400 transition-colors">
                    Emergency Infrastructure Reset
                 </button>
              </div>
           </div>
        </div>

        {/* Decorative background shards */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full" />
      </header>

      {/* PHASE 2: GLOBAL PRICING CATALOG */}
      <section className="space-y-8">
        <div className="flex items-end justify-between px-2">
           <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">Baseline Pricing Catalog</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Subscription tier definitions and infrastructure costs</p>
           </div>
           <div className="flex gap-4">
              <div className="text-right">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Avg. Node Revenue</p>
                 <p className="text-xl font-black text-slate-900 tabular-nums">₹412.50</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <article key={tier.id} className={`bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden`}>
               <div className="flex justify-between items-start mb-8">
                  <div className={`w-14 h-14 rounded-2xl bg-${tier.color}-50 text-${tier.color}-600 flex items-center justify-center group-hover:rotate-6 transition-transform`}>
                     <tier.icon size={28} />
                  </div>
                  <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Base Price</p>
                     <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-slate-400">₹</span>
                        <input 
                           type="number" 
                           value={tier.price} 
                           onChange={(e) => handleUpdatePrice(tier.id, e.target.value)}
                           className="w-16 text-xl font-black text-slate-900 bg-transparent border-none p-0 focus:ring-0 text-right tabular-nums translate-y-[-1px]"
                        />
                     </div>
                  </div>
               </div>

               <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                     <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{tier.name}</h3>
                     <span className={`text-[9px] font-black px-3 py-1 rounded-full bg-${tier.color}-100 text-${tier.color}-700 border border-${tier.color}-200`}>
                        {tierCounts[tier.name]} Active Nodes
                     </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 leading-relaxed h-10 overflow-hidden line-clamp-2">{tier.coreFeatures}</p>
               </div>

               <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <button className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">Manage Full Feature Shard</button>
                  <ArrowUpRight size={14} className="text-slate-300" />
               </div>
            </article>
          ))}
        </div>
      </section>

      {/* PHASE 3: STRATEGIC CAMPAIGN DEPLOYMENT */}
      <section className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-10">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Campaign Deployment Hub</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Active ads boost platform conversion by 14% on average</p>
            </div>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isAdding ? 'bg-rose-50 text-rose-600' : 'bg-slate-900 text-white hover:bg-slate-700 shadow-lg shadow-slate-900/10'}`}
            >
               {isAdding ? <><X size={16} /> Abort Creation</> : <><Plus size={16} /> New Strategic Ad</>}
            </button>
         </div>

         {isAdding && (
           <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-in slide-in-from-top-8 duration-500">
              <div className="space-y-3 lg:col-span-2">
                 <label className="text-[10px] font-black uppercase text-indigo-900 tracking-widest flex items-center gap-2">
                    <Sparkles size={12} /> Campaign Visual Title
                 </label>
                 <input 
                    type="text" 
                    value={newOffer.title}
                    onChange={e => setNewOffer({...newOffer, title: e.target.value})}
                    placeholder="e.g. Winter Wellness Expansion Drive"
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-indigo-900 tracking-widest flex items-center gap-2">
                    <Sun size={12} /> Season Shard
                 </label>
                 <select 
                    value={newOffer.season}
                    onChange={e => setNewOffer({...newOffer, season: e.target.value})}
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm appearance-none cursor-pointer"
                 >
                    {Object.keys(seasons).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-indigo-900 tracking-widest flex items-center gap-2">
                    <Building size={12} /> Target Infrastructure
                 </label>
                 <select 
                    value={newOffer.targetTier}
                    onChange={e => setNewOffer({...newOffer, targetTier: e.target.value})}
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm appearance-none cursor-pointer"
                 >
                    {tiers.map(t => <option key={t.name} value={t.name}>{t.name} Tier</option>)}
                 </select>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-indigo-900 tracking-widest flex items-center gap-2">
                    <Percent size={12} /> Discount Pct
                 </label>
                 <input 
                    type="text" 
                    value={newOffer.discount}
                    onChange={e => setNewOffer({...newOffer, discount: e.target.value})}
                    placeholder="e.g. 20%"
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm"
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-indigo-900 tracking-widest flex items-center gap-2">
                    <TrendingUp size={12} /> Forecast
                 </label>
                 <select 
                    value={newOffer.demand}
                    onChange={e => setNewOffer({...newOffer, demand: e.target.value})}
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm appearance-none cursor-pointer"
                 >
                    {['Normal', 'High', 'Peak', 'Low-Traffic Recovery'].map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
              </div>
              <div className="lg:col-span-2 flex items-end">
                 <button 
                    onClick={handleAddOffer}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                 >
                    Inject Campaign into Management Plane
                 </button>
              </div>
           </div>
         )}

         {/* REDESIGNED HORIZONTAL CARD GRID FOR CAMPAIGNS */}
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeOffers.map((offer) => {
              const SeasonIcon = seasons[offer.season] || Globe;
              const isActive = offer.status === 'Active';
              
              return (
                <div 
                  key={offer.id} 
                  className={`
                    group relative rounded-[32px] p-1 transition-all duration-500 overflow-hidden
                    ${isActive 
                      ? `bg-gradient-to-br from-${offer.color}-500 to-${offer.color}-700 shadow-xl shadow-${offer.color}-500/20` 
                      : 'bg-slate-200 shadow-inner'}
                  `}
                >
                  <div className={`
                    rounded-[31px] p-6 h-full transition-all duration-500
                    ${isActive ? 'bg-white/95 backdrop-blur-md' : 'bg-slate-50/80'}
                  `}>
                    {/* Header: Title & Season */}
                    <div className="flex justify-between items-start mb-6">
                      <div className={`
                        w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12
                        ${isActive ? `bg-${offer.color}-50 text-${offer.color}-600` : 'bg-slate-200 text-slate-400'}
                      `}>
                        <SeasonIcon size={24} />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {offer.season} SHARD
                        </span>
                        <div className="flex items-center gap-1.5 font-black text-2xl tracking-tighter text-slate-900 tabular-nums">
                          <Percent size={18} className="text-indigo-500" />
                          {offer.discount}
                        </div>
                      </div>
                    </div>

                    {/* Campaign Title */}
                    <div className="mb-6">
                      <h4 className={`text-lg font-black tracking-tight leading-none mb-2 ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                        {offer.title}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Target: {offer.targetTier} Infrastructure
                      </p>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex items-center gap-1.5">
                        <Flame size={12} className={offer.demand === 'Peak' ? 'text-rose-500' : 'text-slate-300'} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${offer.demand === 'Peak' ? 'text-rose-600' : 'text-slate-500'}`}>
                          {offer.demand} Demand
                        </span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                      <div className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {offer.status}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                      <button 
                         onClick={() => toggleStatus(offer.id)}
                         className={`
                           flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                           ${isActive 
                             ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' 
                             : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}
                         `}
                      >
                         {isActive ? 'Revoke Ad' : 'Deploy Ad'}
                      </button>
                      <button 
                        onClick={() => handleRevoke(offer.id)}
                        className="p-3 bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Delete Permanently"
                      >
                         <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
         </div>
      </section>
    </div>
  );
}
