import React, { useState } from 'react';
import { Tag, Percent, ArrowUpRight, Zap, Shield, Rocket, CheckCircle2, Package, Save, Plus } from 'lucide-react';
import { useToast } from '../../hooks/useToast.jsx';

export default function OfferManagement() {
  const { showToast } = useToast();
  const [tiers, setTiers] = useState([
    { id: 1, name: 'Essentials', price: 199, coreFeatures: 'Up to 5 Users, Standard Dashboard, IPD/OPD Registry', icon: Package, color: 'slate' },
    { id: 2, name: 'Professional', price: 499, coreFeatures: 'Up to 25 Users, Pharmacy/Lab Integration, Advance Billing', icon: Zap, color: 'indigo' },
    { id: 3, name: 'Enterprise', price: 1299, coreFeatures: 'Unlimited Users, AI Vision, Logistics Hub, Support Node', icon: Rocket, color: 'rose' }
  ]);

  const [activeOffers, setActiveOffers] = useState([
    { id: 101, title: 'Summer Launch Discount', targetTier: 'Professional', discount: '15%', status: 'Active', expiry: '2024-06-30' },
    { id: 102, title: 'Early Adopter Phase 2', targetTier: 'Enterprise', discount: '10%', status: 'Scheduled', expiry: '2024-12-31' },
  ]);

  const handleUpdatePrice = (id, newPrice) => {
    setTiers(tiers.map(t => t.id === id ? { ...t, price: Number(newPrice) } : t));
  };

  const handleSave = () => {
    showToast({ message: 'Offer & Tier configurations persisted.', type: 'success', title: 'Global Economics' });
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
        <div className="flex gap-4 w-full md:w-auto">
           <button onClick={handleSave} className="flex-1 md:flex-none px-8 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2">
              <Save size={14} /> Commit Changes
           </button>
        </div>
      </header>

      {/* TIER CONFIGURATION */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <article key={tier.id} className={`bg-white rounded-[32px] p-8 border-2 transition-all relative overflow-hidden group hover:border-${tier.color}-500/50 hover:shadow-2xl`}>
             <div className="flex justify-between items-start mb-8 relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-${tier.color}-50 text-${tier.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                   <tier.icon size={28} />
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Billing</p>
                   <div className="flex items-center justify-end gap-1">
                      <span className="text-sm font-black text-slate-400">$</span>
                      <input 
                        type="number" 
                        value={tier.price} 
                        onChange={(e) => handleUpdatePrice(tier.id, e.target.value)}
                        className="w-20 text-3xl font-black text-slate-900 bg-transparent border-none p-0 focus:ring-0 text-right tabular-nums"
                      />
                   </div>
                </div>
             </div>

             <div className="mb-8 relative z-10">
                <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">{tier.name} Tier</h3>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-6">{tier.coreFeatures}</p>
                <div className="space-y-3">
                   {['Global CDN Node', 'Priority Response (24h)', 'Cloud Backup S3'].map((feat, i) => (
                     <div key={i} className="flex items-center gap-3 text-slate-400">
                        <CheckCircle2 size={12} className={`text-${tier.color}-500`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{feat}</span>
                     </div>
                   ))}
                </div>
             </div>

             <div className="pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                <button className={`text-[10px] font-black uppercase tracking-widest text-${tier.color}-600 flex items-center gap-1 group/btn`}>
                   Edit Feature Matrix <ArrowUpRight size={12} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </button>
             </div>

             {/* Background decorative element */}
             <div className={`absolute -bottom-10 -right-10 w-40 h-40 bg-${tier.color}-50 rounded-full opacity-0 group-hover:opacity-40 transition-opacity`}></div>
          </article>
        ))}
      </section>

      {/* STRATEGIC OFFERS SECTION */}
      <section className="glass-panel bg-white p-8 border border-slate-100 shadow-sm">
         <div className="flex justify-between items-center mb-10 pb-4 border-b border-slate-50">
            <div>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Strategic Offers</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Managed discount pools & campaign nodes</p>
            </div>
            <button className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
               <Plus size={18} />
            </button>
         </div>

         <div className="premium-table-container">
            <table className="premium-table">
               <thead>
                  <tr>
                     <th className="tracking-[.2em]">Offer Title / Manifest</th>
                     <th className="tracking-[.2em]">Target Entity</th>
                     <th className="tracking-[.2em]">Value</th>
                     <th className="tracking-[.2em]">Operational Status</th>
                     <th className="text-right tracking-[.2em]">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {activeOffers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-slate-50/50 transition-colors">
                       <td>
                          <div className="text-sm font-black text-slate-800">{offer.title}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Expires: {offer.expiry}</div>
                       </td>
                       <td>
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-slate-200">{offer.targetTier} Tier</span>
                       </td>
                       <td>
                          <div className="flex items-center gap-2 text-indigo-600 font-black">
                             <Percent size={14} />
                             <span className="text-sm tabular-nums">{offer.discount}</span>
                          </div>
                       </td>
                       <td>
                          <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${offer.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                             <span className={`text-[10px] font-black uppercase tracking-widest ${offer.status === 'Active' ? 'text-emerald-700' : 'text-slate-500'}`}>{offer.status}</span>
                          </div>
                       </td>
                       <td className="text-right">
                          <button className="text-[10px] font-black uppercase text-rose-500 hover:underline">Revoke Offer</button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </section>
    </div>
  );
}
