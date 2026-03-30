import React, { useState, useMemo } from 'react';
import { Tag, Percent, ArrowUpRight, Zap, Shield, Rocket, CheckCircle2, Package, Save, Plus, Calendar, Flame, Wind, Sun, CloudRain, Trash2, Edit3, Globe, Sparkles, X } from 'lucide-react';
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
    <div className="space-y-10 animate-fade-in p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-2xl border border-slate-100 shadow-sm gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Tag size={16} />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Economic Tier & Offer Engine</h2>
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Global Subscription Management & Strategic Discounting</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto items-center">
           <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 mr-2">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Master Ad Switch</span>
              <button 
                onClick={() => setIsMasterEnabled(!isMasterEnabled)}
                className={`w-10 h-6 rounded-full relative transition-colors ${isMasterEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isMasterEnabled ? 'left-5' : 'left-1'}`} />
              </button>
           </div>
           <button 
             onClick={handleSystemReset}
             className="px-4 py-4 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition-all"
             title="Purge all campaign cache"
           >
              Hard Reset
           </button>
           <button onClick={handleSave} className="flex-1 md:flex-none px-8 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 hover:bg-black transition-colors">
              <Save size={14} /> Commit & Deploy
           </button>
        </div>
      </header>

      {/* TIER CONFIGURATION */}
      <section>
        <div className="mb-6 px-2 flex items-center justify-between">
           <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Global Pricing Tiers</h3>
           <span className="text-[9px] font-bold text-indigo-500 italic">Adjusting these values updates the Pricing Catalog instantly</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <article key={tier.id} className={`bg-white rounded-[32px] p-8 border-2 transition-all relative overflow-hidden group hover:border-${tier.color}-500/50 hover:shadow-2xl`}>
               <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-${tier.color}-50 text-${tier.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                     <tier.icon size={28} />
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Billing</p>
                     <div className="flex items-center justify-end gap-1">
                        <span className="text-sm font-black text-slate-400">₹</span>
                        <input 
                          type="number" 
                          value={tier.price} 
                          onChange={(e) => handleUpdatePrice(tier.id, e.target.value)}
                          className="w-20 text-3xl font-black text-slate-900 bg-transparent border-none p-0 focus:ring-0 text-right tabular-nums translate-y-[-2px]"
                        />
                     </div>
                  </div>
               </div>

               <div className="mb-8 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                     <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{tier.name} Tier</h3>
                     <span className={`px-2 py-0.5 rounded-full bg-${tier.color}-50 text-${tier.color}-600 text-[8px] font-black uppercase tracking-widest border border-${tier.color}-100`}>
                        {tierCounts[tier.name]} Active Installs
                     </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-6 h-12 overflow-hidden">{tier.coreFeatures}</p>
                  <div className="space-y-3">
                     {['Global CDN Node', 'Priority Response (24h)', 'Cloud Backup S3'].map((feat, i) => (
                       <div key={i} className="flex items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                          <CheckCircle2 size={12} className={`text-${tier.color}-500`} />
                          <span>{feat}</span>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                  <button className={`text-[10px] font-black uppercase tracking-widest text-${tier.color}-600 flex items-center gap-1 group/btn`}>
                     Edit Feature Matrix <ArrowUpRight size={12} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </button>
               </div>
            </article>
          ))}
        </div>
      </section>

      {/* SEASONAL STRATEGIC OFFERS */}
      <section className="glass-panel bg-white p-8 border border-slate-100 shadow-sm rounded-3xl">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Seasonal Strategic Campaigns</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Boost demand with targeted temporal offerings</p>
            </div>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isAdding ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
            >
               {isAdding ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Campaign</>}
            </button>
         </div>

         {isAdding && (
           <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4">
              <div className="space-y-2">
                 <label className="text-[9px] font-bold uppercase text-slate-400 block px-1">Campaign Title</label>
                 <input 
                   type="text" 
                   value={newOffer.title}
                   onChange={e => setNewOffer({...newOffer, title: e.target.value})}
                   placeholder="e.g. Winter Wellness Expansion"
                   className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-bold uppercase text-slate-400 block px-1">Seasonality</label>
                 <select 
                   value={newOffer.season}
                   onChange={e => setNewOffer({...newOffer, season: e.target.value})}
                   className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold appearance-none"
                 >
                    {Object.keys(seasons).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-bold uppercase text-slate-400 block px-1">Target Tier</label>
                 <select 
                   value={newOffer.targetTier}
                   onChange={e => setNewOffer({...newOffer, targetTier: e.target.value})}
                   className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold appearance-none"
                 >
                    {tiers.map(t => <option key={t.name} value={t.name}>{t.name} Tier</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-bold uppercase text-slate-400 block px-1">Discount (%)</label>
                 <input 
                   type="text" 
                   value={newOffer.discount}
                   onChange={e => setNewOffer({...newOffer, discount: e.target.value})}
                   placeholder="e.g. 20%"
                   className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-bold uppercase text-slate-400 block px-1">Demand Context</label>
                 <select 
                   value={newOffer.demand}
                   onChange={e => setNewOffer({...newOffer, demand: e.target.value})}
                   className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold appearance-none"
                 >
                    {['Normal', 'High', 'Peak', 'Low-Traffic Recovery'].map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
              </div>
              <div className="flex items-end">
                 <button 
                   onClick={handleAddOffer}
                   className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black"
                 >
                    Publish Campaign
                 </button>
              </div>
           </div>
         )}

         <div className="premium-table-container">
            <table className="premium-table">
               <thead>
                  <tr>
                     <th className="tracking-[.2em]">Campaign Manifest</th>
                     <th className="tracking-[.2em]">Seasonality</th>
                     <th className="tracking-[.2em]">Target / Value</th>
                     <th className="tracking-[.2em]">Demand Context</th>
                     <th className="text-right tracking-[.2em]">Execution</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {activeOffers.map((offer) => {
                    const SeasonIcon = seasons[offer.season] || Globe;
                    return (
                      <tr key={offer.id} className="hover:bg-slate-50/50 transition-colors">
                        <td>
                           <div className="flex items-center gap-3">
                              <div className={`w-1.5 h-8 rounded-full bg-${offer.color}-500`} />
                              <div>
                                 <div className="text-sm font-black text-slate-800">{offer.title}</div>
                                 <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${offer.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                       {offer.status === 'Active' ? 'LIVE NOW' : 'STOPPED'}
                                    </span>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{offer.status} Deployment</div>
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td>
                           <div className="flex items-center gap-2">
                              <SeasonIcon size={14} className="text-slate-400" />
                              <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">{offer.season}</span>
                           </div>
                        </td>
                        <td>
                           <div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{offer.targetTier} Tier</div>
                              <div className="flex items-center gap-1.5 text-indigo-600 font-black">
                                 <Percent size={12} />
                                 <span className="text-sm tabular-nums">{offer.discount}</span>
                              </div>
                           </div>
                        </td>
                        <td>
                           <div className="flex items-center gap-2">
                              <Flame size={12} className={offer.demand === 'Peak' ? 'text-rose-500' : 'text-slate-300'} />
                              <span className={`text-[10px] font-black uppercase tracking-widest ${offer.demand === 'Peak' ? 'text-rose-600' : 'text-slate-500'}`}>{offer.demand}</span>
                           </div>
                        </td>
                        <td className="text-right">
                           <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => toggleStatus(offer.id)}
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                  offer.status === 'Active' 
                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white' 
                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                                }`}
                              >
                                 {offer.status === 'Active' ? 'Stop Ad' : 'Enable Ad'}
                              </button>
                              <button 
                                onClick={() => handleRevoke(offer.id)}
                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                              >
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
         </div>
      </section>
    </div>
  );
}
