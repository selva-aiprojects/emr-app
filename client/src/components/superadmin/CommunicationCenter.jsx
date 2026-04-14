import React, { useState } from 'react';
import { 
  Send, Users, Plus, Archive, Search, Clock, 
  CheckCircle2, AlertCircle, Radio, Zap, Shield, 
  Share2, MessageSquare, History, X
} from 'lucide-react';
import { useToast } from '../../hooks/useToast.jsx';
import { superadminService } from '../../services/superadmin.service.js';

const PROTOCOL_VARIANTS = [
  { id: 'new_sub', label: 'Onboarding Protocol', desc: 'Secure shard for first-time nodes.', icon: Zap, color: 'indigo' },
  { id: 'fiscal', label: 'Fiscal Cadence', desc: 'Reminders for pending subscription shards.', icon: Clock, color: 'emerald' },
  { id: 'isolation', label: 'Isolation Alert', desc: 'Technical alert for node isolation.', icon: Shield, color: 'rose' },
  { id: 'offer', label: 'Strategic Offer', desc: 'Pricing shards for seasonal offers.', icon: Radio, color: 'amber' },
];

export default function CommunicationCenter({ tenants = [], apiClient }) {
  const { showToast } = useToast();
  const [activeTemplate, setActiveTemplate] = useState('new_sub');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [tenantSearch, setTenantSearch] = useState('');

  const filteredTenants = tenants.filter(t => 
    (t.name || '').toLowerCase().includes(tenantSearch.toLowerCase()) ||
    (t.code || '').toLowerCase().includes(tenantSearch.toLowerCase())
  );

  const handleDispatch = async () => {
    if (!selectedRecipient) {
      showToast({ message: "Node Selection Required", type: 'error' });
      return;
    }
    
    const template = PROTOCOL_VARIANTS.find(t => t.id === activeTemplate);
    showToast({ message: `Preparing strategic shard for ${selectedRecipient.name}...`, type: 'info' });
    
    try {
      await superadminService.sendCommunication(selectedRecipient.code, activeTemplate, {
        tenantName: selectedRecipient.name,
        templateName: template.label,
        recipientEmail: selectedRecipient.contactEmail || `admin@${selectedRecipient.subdomain}.com`
      });
      
      showToast({ 
        message: `Signal Shard [${template.label}] dispatched to ${selectedRecipient.name}.`, 
        type: 'success',
        title: 'Global Dispatch Success'
      });
    } catch (err) {
      showToast({ message: err.message, type: 'error', title: 'Dispatch Failed' });
    }
  };

  const handleGlobalBroadcast = async () => {
    const template = PROTOCOL_VARIANTS.find(t => t.id === activeTemplate);
    const subject = `[SYSTEM_BROADCAST] :: Institutional Node Update: ${template.label}`;
    const body = `This is a global broadcast regarding the "${template.label}" protocol. Please check your management console for details.`;

    if (!window.confirm(`⚠️ UNIVERSAL SIGNAL: Dispatch broadcast shard [${template.label}] to ALL ${tenants.length} institutional nodes?`)) {
      return;
    }

    try {
      showToast({ message: "Initializing global signal broadcast...", type: 'info' });
      const result = await apiClient.superadminBroadcast(activeTemplate, subject, body);
      showToast({ 
        message: `Signal synchronized across ${result.dispatched || tenants.length} shards.`, 
        type: 'success',
        title: 'Broadcast Complete'
      });
    } catch (err) {
      showToast({ message: err.message, type: 'error', title: 'Broadcast Failed' });
    }
  }

  return (
    <div className="page-shell-premium animate-in fade-in duration-500 pb-20">
      {/* 🚀 ELITE COMMUNICATION HEADER */}
      <header className="page-header-premium mb-8">
        <div className="flex flex-col gap-2">
           <h1 className="page-title-rich flex items-center gap-4 text-white">
              <Radio className="w-8 h-8 text-indigo-400 rotate-12" />
              Signal Nexus
              <span className="text-[10px] bg-white/10 text-white/80 px-4 py-1.5 rounded-full border border-white/10 uppercase tracking-[0.2em] font-black backdrop-blur-xl">Command Hub</span>
           </h1>
           <p className="dim-label max-w-2xl">Orchestrate cross-institutional directives, global broadcasts, and high-fidelity institutional outreaches.</p>
           <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                 <Shield className="w-3 h-3 text-cyan-300" />
                 <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Administrative Grid Validated</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/10">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                 <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Broadcast Core Live</span>
              </div>
        </div>
        </div>
        
        <div className="flex items-end gap-4 self-end">
           <button 
              onClick={handleGlobalBroadcast}
              className="flex items-center gap-3 px-8 py-3.5 bg-indigo-600 border border-indigo-400 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl hover:bg-indigo-700 hover:scale-105 active:scale-95"
           >
              <Zap className="w-4 h-4" />
              Universal Broadcast
           </button>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* 📋 PROTOCOL SIDEBAR */}
        <aside className="col-span-1 space-y-6">
           <div className="flex items-center gap-3 px-2">
              <History size={16} className="text-slate-400" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocol Repository</h3>
           </div>
           <div className="space-y-3">
              {PROTOCOL_VARIANTS.map((tpl) => (
                <button 
                  key={tpl.id}
                  onClick={() => setActiveTemplate(tpl.id)}
                  className={`w-full text-left p-6 rounded-[2rem] border transition-all flex flex-col gap-4 relative overflow-hidden group ${
                    activeTemplate === tpl.id 
                      ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-100/30 ring-1 ring-indigo-50/50' 
                      : 'bg-white/40 border-slate-100 hover:bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    activeTemplate === tpl.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'
                  }`}>
                    <tpl.icon size={18} />
                  </div>
                  <div>
                    <h4 className={`text-[12px] font-black uppercase tracking-tighter ${activeTemplate === tpl.id ? 'text-slate-900' : 'text-slate-500'}`}>
                      {tpl.label}
                    </h4>
                    <p className="text-[10px] font-medium text-slate-400 leading-tight mt-1">{tpl.desc}</p>
                  </div>
                  {activeTemplate === tpl.id && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  )}
                </button>
              ))}
           </div>
        </aside>

        {/* 📟 DISPATCH CONSOLE */}
        <section className="col-span-1 lg:col-span-3">
           <article className="bg-white border border-slate-200 rounded-[3rem] shadow-2xl overflow-hidden mb-12 animate-in slide-in-from-right-4 duration-500 flex flex-col min-h-[700px]">
              <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex items-center justify-between gap-10">
                 <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                       <Radio size={14} className="text-indigo-600" />
                       <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-tighter italic">Directive Dispatch Console</h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity Selection & Signal Verification</p>
                 </div>
                 <div className="flex-1 relative group max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500" />
                    <input 
                      placeholder="Search Institutional Shards..."
                      value={tenantSearch}
                      onChange={(e) => setTenantSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-[11px] font-black text-slate-700 uppercase tracking-tighter focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                    />
                 </div>
              </div>

              <div className="flex-1 p-10 flex flex-col gap-10">
                 {/* RECIPIENT MATRIX */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[220px] overflow-y-auto pr-4 custom-scrollbar">
                    {filteredTenants.map((t) => (
                      <button 
                        key={t.id}
                        onClick={() => setSelectedRecipient(t)}
                        className={`p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group ${
                          selectedRecipient?.id === t.id 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                            : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-slate-100/50'
                        }`}
                      >
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${
                           selectedRecipient?.id === t.id ? 'bg-white/20 text-white' : 'bg-white text-slate-400 shadow-sm'
                         }`}>
                           {t.name?.slice(0, 2).toUpperCase()}
                         </div>
                         <div className="min-w-0">
                           <p className="text-[10px] font-black uppercase tracking-tighter truncate leading-none">{t.name}</p>
                           <p className={`text-[9px] font-bold uppercase mt-1 ${selectedRecipient?.id === t.id ? 'text-white/60' : 'text-slate-400'}`}>#{t.code}</p>
                         </div>
                      </button>
                    ))}
                 </div>

                 {/* PAYLOAD PREVIEW (DARK TERMINAL) */}
                 <div className="flex-1 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 font-mono text-[11px] relative overflow-hidden group/term self-stretch">
                    <div className="absolute bottom-0 right-0 p-12 opacity-5 pointer-events-none group-hover/term:opacity-10 transition-opacity">
                       <Share2 size={180} strokeWidth={1} className="text-white" />
                    </div>

                    <div className="relative z-10 space-y-6">
                       <div className="flex justify-between items-center pb-6 border-b border-white/5">
                          <p className="text-indigo-400 font-bold tracking-widest text-[9px] flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             SYSTEM_SIGNAL_READY_0X1A4F
                          </p>
                          <p className="text-slate-600 text-[9px] font-bold">SHA-256::B8CE...A9DC</p>
                       </div>

                       <div className="space-y-4 font-mono text-slate-400 italic">
                          <p><span className="text-white font-bold not-italic font-sans mr-2 uppercase tracking-widest text-[9px] opacity-40">Source:</span> Nexus_Command_Hub_v4</p>
                          <p><span className="text-white font-bold not-italic font-sans mr-2 uppercase tracking-widest text-[9px] opacity-40">Target:</span> {selectedRecipient?.name || 'Awaiting Identity Selection...'}</p>
                          <p><span className="text-white font-bold not-italic font-sans mr-2 uppercase tracking-widest text-[9px] opacity-40">Protocol:</span> STRAT_{activeTemplate.toUpperCase()}_DISPATCH</p>
                       </div>

                       <div className="pt-6 space-y-3 leading-relaxed text-slate-300">
                          <p className="text-indigo-400/80">// INIT DISCOURSE</p>
                          <p>Directive [ <span className="text-white font-bold">{PROTOCOL_VARIANTS.find(v => v.id === activeTemplate)?.label}</span> ] initialized for deployment to node <span className="text-indigo-400 italic">"{(selectedRecipient?.name || 'UNDETERMINED').toUpperCase()}"</span>.</p>
                          <p>Please confirm authentication to synchronize this signal across the institutional grid and verify heartbeat compliance.</p>
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={handleDispatch}
                   disabled={!selectedRecipient}
                   className="w-full py-6 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] transition-all shadow-xl shadow-slate-200 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed group flex items-center justify-center gap-4"
                 >
                    Authorize Dispatch Shard
                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </button>
              </div>
           </article>
        </section>
      </div>
    </div>
  );
}
