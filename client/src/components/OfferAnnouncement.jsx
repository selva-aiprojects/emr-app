import React, { useState } from 'react';
import { Zap, X, ArrowRight, Gift, Sparkles, ShieldCheck } from 'lucide-react';

export default function OfferAnnouncement() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative mb-8 group">
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      
      <div className="relative bg-white rounded-[2rem] overflow-hidden border border-amber-100 shadow-2xl flex flex-col md:flex-row items-stretch">
        {/* Left Side - Visual Impact */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 flex flex-col justify-between md:w-1/3 text-white overflow-hidden relative">
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 shadow-lg border border-white/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-black leading-tight uppercase tracking-tighter italic">
              Professional<br />Pricing Shard
            </h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black">₹4,999</span>
              <span className="text-xs font-bold text-white/60 uppercase line-through">₹7,500</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-200 mt-2 italic shadow-sm">
              Limited Institutional Offer
            </p>
          </div>
          
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <Sparkles className="absolute top-4 right-4 w-5 h-5 text-white/30 animate-pulse" />
        </div>

        {/* Right Side - Features & CTA */}
        <div className="p-8 flex-1 flex flex-col justify-center">
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-300 hover:text-slate-500"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-amber-100">
              Exclusive Campaign
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
            Scale your clinical node with advanced analytics, inpatient monitoring, and insurance gateway.
          </h2>

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8">
            {[
              "Inpatient Bed Governance",
              "Inventory & Pharmacy Hub",
              "Insurance Reconciliation",
              "Advanced AIS Vision"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95 group">
              Upgrade Subscription
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
              Compare Tiers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
