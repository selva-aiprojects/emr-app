import React from 'react';
import { 
  IndianRupee, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Server,
  Zap,
  CreditCard,
  History,
  AlertCircle
} from 'lucide-react';

import { useToast } from '../../hooks/useToast.jsx';

export default function FiscalGovernance({ tenants = [] }) {
  const { showToast } = useToast();

  // Actuals Calculation Shard
  const receivables = tenants.reduce((acc, t) => {
    const tier = t.tier || (t.doctors > 10 ? 'enterprise' : t.doctors > 5 ? 'professional' : t.doctors > 0 ? 'basic' : 'free');
    const price = tier === 'enterprise' ? 1299 : tier === 'professional' ? 499 : tier === 'basic' ? 199 : 0;
    return acc + price;
  }, 0);

  const payables = (tenants.length * 150) + 2450; // Infra base + per node cost
  const netSurplus = receivables - payables;

  return (
    <div className="space-y-12 animate-fade-in px-2">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Fiscal Hub & Global Ledger</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic">* Financial Shards: Consolidated Inbound & Outbound Logic</p>
         </div>
         <div className="flex gap-3">
            <button className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">Generate Dividend</button>
            <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors shadow-lg">Audit Ledger</button>
         </div>
      </header>

      {/* Numerical Financial Summary with Colorful Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {[
            { label: 'Accounts Receivable', value: `₹${receivables.toLocaleString()}`, icon: ArrowUpRight, color: 'emerald', gradient: 'from-emerald-500 to-teal-600', sub: `${tenants.length} Active Node Subs` },
            { label: 'Accounts Payable', value: `₹${payables.toLocaleString()}`, icon: ArrowDownRight, color: 'rose', gradient: 'from-rose-500 to-pink-600', sub: 'Cluster Infra + Ops' },
            { label: 'Net Platform Surplus', value: `₹${netSurplus.toLocaleString()}`, icon: Wallet, color: 'indigo', gradient: 'from-indigo-500 to-blue-600', sub: 'Monthly Growth Velocity' },
         ].map((stat, i) => (
            <div key={i} className="relative group overflow-hidden rounded-[40px] p-0.5">
               <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-20 group-hover:opacity-100 transition-opacity duration-500`} />
               
               <div className="relative bg-white p-10 rounded-[39px] h-full flex flex-col justify-between">
                  <div>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white flex items-center justify-center mb-8 shadow-lg shadow-${stat.color}-500/20 group-hover:scale-110 transition-transform`}>
                       <stat.icon size={28} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                    <p className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter mb-2 leading-none">{stat.value}</p>
                    <p className={`text-[10px] font-black text-${stat.color}-600 uppercase tracking-widest`}>{stat.sub}</p>
                  </div>
                  
                  <div className={`mt-10 h-1 rounded-full bg-${stat.color}-50 overflow-hidden`}>
                     <div className={`h-full bg-gradient-to-r ${stat.gradient} transition-all duration-1000`} style={{ width: '65%' }} />
                  </div>
               </div>
            </div>
         ))}
      </section>

      {/* Visual Analytics / Breakup Zone */}
      <section className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
               <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest">Platform Operational Spend</h3>
               <p className="text-3xl font-black tracking-tight mt-1 leading-none">Cluster Expense Matrix</p>
            </div>
            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-indigo-400 tracking-widest">
               Fiscal Forecast: +₹1,240.22 Monthly Surplus
            </div>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
               { label: 'AWS/Azure Shards', val: '₹14,200', icon: Server, color: 'indigo' },
               { label: 'CDN Throughput', val: '₹1,450', icon: Zap, color: 'emerald' },
               { label: 'Hub Ops & Support', val: '₹4,500', icon: Building2, color: 'amber' }
            ].map((exp, i) => (
               <div key={i} className="p-8 bg-white/5 rounded-[32px] border border-white/5 group hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden">
                  <div className={`w-12 h-12 rounded-2xl bg-${exp.color}-500/20 text-${exp.color}-400 flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                     <exp.icon size={24} />
                  </div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">{exp.label}</h4>
                  <p className="text-2xl font-black text-white tabular-nums tracking-tight">{exp.val}</p>
                  {/* Decorative background shadow */}
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-${exp.color}-500/5 blur-3xl rounded-full`} />
               </div>
            ))}
         </div>

         <div className="mt-12 bg-indigo-600/20 border border-indigo-500/30 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative group overflow-hidden">
            <div className="flex items-center gap-6 relative z-10">
               <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 group-hover:rotate-12 transition-transform">
                  <AlertCircle size={32} />
               </div>
               <div>
                  <h4 className="text-lg font-black tracking-tight leading-none uppercase mb-2">Automated Payout Lock</h4>
                  <p className="text-sm font-medium text-indigo-200 leading-relaxed max-w-[400px]">Strategic fiscal safety triggered: Payments over <span className="text-white font-black">₹50,000</span> require manual Root Identity authorization.</p>
               </div>
            </div>
            <button className="px-10 py-5 bg-white text-indigo-800 rounded-3xl text-sm font-black uppercase tracking-[0.2em] relative z-10 hover:bg-indigo-50 transition-colors shadow-2xl">Override Security Protocol</button>
            <div className="absolute top-0 left-0 w-full h-full bg-indigo-500/5 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
         </div>
      </section>

      {/* Transaction Records Placeholder */}
      <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/10">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Fiscal Audit Stream</h3>
            <div className="flex gap-2">
               <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-900"><CreditCard size={18} /></button>
               <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-900"><Wallet size={18} /></button>
            </div>
         </div>
         <div className="p-6 md:p-10 text-center space-y-4">
            <p className="text-sm text-slate-500 font-medium italic opacity-60">Real-time ledger entries from clinical nodes are being synchronized...</p>
            <div className="flex justify-center flex-wrap gap-3">
               {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-10 w-24 bg-slate-100 rounded-xl animate-pulse" />
               ))}
            </div>
         </div>
      </section>
    </div>
  );
}
