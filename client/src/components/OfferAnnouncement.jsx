import React, { useState, useEffect } from 'react';
import { Zap, X, ArrowRight, Gift, Sparkles, ShieldCheck, Flame, Sun, CloudRain, Wind, Globe } from 'lucide-react';

export default function OfferAnnouncement({ tenant }) {
  const [isVisible, setIsVisible] = useState(true);
  const [activeCampaign, setActiveCampaign] = useState(null);

  const TIER_ORDER = {
    'Essentials': 1,
    'Professional': 2,
    'Enterprise': 3
  };

  const SEASONS = {
    'Summer': Sun,
    'Monsoon': CloudRain,
    'Winter': Wind,
    'Spring': Sparkles,
    'All Year': Globe
  };

  useEffect(() => {
    const syncCampaign = () => {
      const isGlobalEnabled = localStorage.getItem('platform_advertising_enabled');
      const isMasterDisabled = isGlobalEnabled === 'false';
      const stored = localStorage.getItem('active_seasonal_campaign');
      
      console.log('ORCHESTRATION_SYNC:', { isMasterDisabled, hasStored: !!stored });

      if (stored && !isMasterDisabled) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.status === 'Active' || parsed.id)) {
            setActiveCampaign(parsed);
          } else {
            setActiveCampaign(null);
          }
        } catch (e) {
          console.error('Failed to parse campaign', e);
          setActiveCampaign(null);
        }
      } else {
        setActiveCampaign(null);
      }
    };

    syncCampaign();
    window.addEventListener('storage', syncCampaign);
    return () => window.removeEventListener('storage', syncCampaign);
  }, []);

  // NEW LOGIC: Only show to lower tier tenants to encourage upgrades
  const currentLevel = TIER_ORDER[tenant?.subscription_tier] || TIER_ORDER[tenant?.subscriptionTier] || 1;
  const targetLevel = TIER_ORDER[activeCampaign?.targetTier] || 2;

  if (!isVisible || !activeCampaign || currentLevel >= targetLevel) return null;

  const SeasonIcon = SEASONS[activeCampaign.season] || Globe;

  return (
    <div className="relative mb-8 group animate-fade-in">
      <div className={`absolute -inset-1 bg-gradient-to-r ${activeCampaign.color === 'blue' ? 'from-blue-500 via-cyan-400 to-indigo-500' : 'from-amber-500 via-yellow-400 to-orange-500'} rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200`}></div>
      
      <div className="relative bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-2xl flex flex-col md:flex-row items-stretch">
        <div className={`bg-gradient-to-br ${activeCampaign.color === 'blue' ? 'from-blue-600 to-indigo-700' : 'from-amber-500 to-orange-600'} p-8 flex flex-col justify-between md:w-1/3 text-white overflow-hidden relative`}>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 shadow-lg border border-white/20">
              <SeasonIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-black leading-tight uppercase tracking-tighter italic">
              {activeCampaign.title.split(' ')[0]}<br />
              {activeCampaign.title.split(' ').slice(1).join(' ')}
            </h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black">{activeCampaign.discount.includes('%') ? 'EXTRA ' + activeCampaign.discount : activeCampaign.discount}</span>
              {activeCampaign.oldPrice && <span className="text-xs font-bold text-white/60 uppercase line-through">{activeCampaign.oldPrice}</span>}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mt-2 italic">
               Limited {activeCampaign.season} Institutional Offer
            </p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          {activeCampaign.demand === 'Peak' && <Flame className="absolute top-4 right-4 w-5 h-5 text-rose-300 animate-pulse" />}
        </div>

        <div className="p-8 flex-1 flex flex-col justify-center">
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-300 hover:text-slate-500"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className={`px-3 py-1 ${activeCampaign.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'} text-[10px] font-black uppercase tracking-[0.2em] rounded-full border`}>
              {activeCampaign.season} Strategy Campaign
            </div>
            <div className="flex -space-x-2">
               {[1,2,3].map(i => (
                 <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500">
                   {String.fromCharCode(64 + i)}
                 </div>
               ))}
            </div>
            <span className="text-[10px] font-bold text-slate-400 ml-1">Joined by 120+ Institutions</span>
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-4">
            Scale your clinical node to <span className="text-indigo-600">{activeCampaign.targetTier}</span> version today.
          </h2>

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8">
            {[
              "Advanced Clinical Engine",
              "Inventory & Pharmacy Hub",
              "Premium Support Node",
              "Unlimited S3 Storage"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95 group">
              Upgrade to {activeCampaign.targetTier}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
              Operational details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
