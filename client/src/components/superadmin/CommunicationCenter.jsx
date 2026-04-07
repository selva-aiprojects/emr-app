import React, { useState } from 'react';
import { 
  Mail, Send, Users, Plus, Archive, Search, Clock, 
  CheckCircle2, AlertCircle, TrendingUp, Tag, Ban, 
  Package, Sparkles, ChevronRight, MessageSquare,
  Radio, Zap, Shield, Share2, CornerDownRight
} from 'lucide-react';
import { useToast } from '../../hooks/useToast.jsx';
import { superadminService } from '../../services/superadmin.service.js';

const EMAIL_TEMPLATES = [
  { id: 'new_sub', label: 'Onboarding Protocol', desc: 'Secure shard for first-time nodes.', icon: Package, color: 'indigo' },
  { id: 'follow_up', label: 'Fiscal Cadence', desc: 'Reminders for pending subscription shards.', icon: Clock, color: 'emerald' },
  { id: 'suspend', label: 'Isolation Alert', desc: 'Technical alert for node isolation.', icon: Ban, color: 'rose' },
  { id: 'offer', label: 'Strategic Offer', desc: 'Pricing shards for seasonal offers.', icon: Tag, color: 'amber' },
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
    
    const template = EMAIL_TEMPLATES.find(t => t.id === activeTemplate);
    showToast({ message: `Preparing strategic shard for ${selectedRecipient.name}...`, type: 'info' });
    
    try {
      // Use the communication nexus
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
    const template = EMAIL_TEMPLATES.find(t => t.id === activeTemplate);
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
    <div className="space-y-12 max-w-[1600px] mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* PROFESSIONAL TITLE BLOCK */}
      <div className="flex justify-between items-end">
         <div>
            <h2 className="text-[20px] font-black text-white tracking-tighter uppercase mb-1">Signal Nexus</h2>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Communication HUD</span>
               <div className="w-1 h-1 rounded-full bg-slate-700" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Global Broadcast & Targeted Outreach Shards</span>
            </div>
         </div>
         <div className="flex gap-4">
            <button className="px-6 py-2.5 bg-white/[0.04] border border-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">Audit Dispatch Logs</button>
            <button 
               onClick={handleGlobalBroadcast}
               className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all flex items-center gap-2"
            >
               <Radio size={14} className="animate-pulse" /> Global Broadcast
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
         {/* TEMPLATE REPOSITORY */}
         <aside className="col-span-1 space-y-8">
            <div className="flex items-center gap-3 mb-6">
               <Shield size={16} className="text-slate-600" />
               <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Protocol Shards</h3>
            </div>
            <div className="space-y-4">
               {EMAIL_TEMPLATES.map((tpl) => (
                  <button 
                     key={tpl.id}
                     onClick={() => setActiveTemplate(tpl.id)}
                     className={`w-full text-left p-8 rounded-[2.5rem] border-2 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[180px] ${
                        activeTemplate === tpl.id 
                           ? `bg-white/[0.04] border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.1)]` 
                           : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                     }`}
                  >
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        activeTemplate === tpl.id ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-white/[0.03] text-slate-500 group-hover:text-indigo-400'
                     }`}>
                        <tpl.icon size={22} />
                     </div>
                     <div className="mt-6">
                        <h4 className="text-[13px] font-black uppercase text-white tracking-tight mb-1">{tpl.label}</h4>
                        <p className="text-[10px] font-bold text-slate-500 leading-tight italic">{tpl.desc}</p>
                     </div>
                     {activeTemplate === tpl.id && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,1)]" />
                     )}
                  </button>
               ))}
            </div>
         </aside>

         {/* COMMAND DISPATCH CONSOLE */}
         <section className="lg:col-span-3 space-y-12">
            <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-sm group relative">
               <div className="absolute top-0 right-0 p-12 opacity-0 group-hover:opacity-[0.03] transition-opacity">
                  <Share2 size={200} strokeWidth={1} />
               </div>

               <header className="p-10 pb-6 flex items-center justify-between border-b border-white/5 relative z-10">
                  <div>
                     <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Targeted Dispatch Shard</h3>
                     <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic">Manual communication override protocol</p>
                  </div>
                  <div className="px-5 py-2.5 bg-white/[0.04] border border-white/5 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] font-mono">
                     COMMAND_READY::0x1A4F
                  </div>
               </header>

               <div className="p-10 space-y-10 relative z-10">
                  {/* RECIPIENT GRID */}
                  <div className="space-y-4">
                     <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Identity Selection Matrix</label>
                        <div className="relative group">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 group-focus-within:text-indigo-400" />
                          <input 
                            type="text" 
                            placeholder="Filter Shards..."
                            value={tenantSearch}
                            onChange={(e) => setTenantSearch(e.target.value)}
                            className="bg-white/5 border border-white/5 rounded-lg py-1.5 pl-8 pr-3 text-[9px] font-black uppercase tracking-widest text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto no-scrollbar p-1">
                        {filteredTenants.map((t, i) => (
                           <div 
                              key={i} 
                              onClick={() => setSelectedRecipient(t)}
                              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group/item ${
                                 selectedRecipient?.id === t.id 
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.2)]' 
                                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/[0.04]'
                              }`}
                           >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] transition-all ${
                                 selectedRecipient?.id === t.id ? 'bg-white/20 text-white' : 'bg-white/[0.03] text-slate-500 group-hover/item:text-indigo-400'
                              }`}>
                                 {t.name?.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-tighter truncate">{t.name}</span>
                              {selectedRecipient?.id === t.id && (
                                 <CheckCircle2 size={14} className="ml-auto text-white shrink-0" />
                              )}
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* CONTENT SHARD PREVIEW */}
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-1">Payload Shard Preview</label>
                     <div className="min-h-[280px] bg-black/40 border border-white/5 rounded-[2.5rem] p-10 font-mono text-[11px] leading-relaxed relative group/code overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 h-full flex flex-col justify-between opacity-5 group-hover/code:opacity-10 transition-all">
                           <MessageSquare size={120} strokeWidth={1} />
                        </div>
                        
                        <div className="relative z-10 opacity-60 group-hover/code:opacity-100 transition-all font-mono space-y-4">
                           <p className="text-indigo-400 font-black tracking-widest uppercase">// PROTOCOL_HEADER_INIT</p>
                           <div className="space-y-1">
                              <p className="text-slate-500 uppercase tracking-widest"><span className="text-white">SOURCE:</span> NEXUS_CORE_01</p>
                              <p className="text-slate-500 uppercase tracking-widest"><span className="text-white">TARGET:</span> {selectedRecipient?.code || 'SHARD_PENDING'}</p>
                              <p className="text-slate-500 uppercase tracking-widest"><span className="text-white">SUBJECT:</span> [STRAT_{activeTemplate.toUpperCase()}] :: GLOBAL_SIGNAL</p>
                           </div>
                           
                           <div className="pt-4 space-y-4 text-slate-400">
                              <p>GREETINGS NODE ADMIN,</p>
                              <p>THIS COMMUNICATION SHARD IS DISPATCHED REGARDING INSTITUTIONAL NODE: <span className="text-indigo-400 font-black">"{selectedRecipient?.name || 'NULL_IDENTITY'}"</span>.</p>
                              <p>THE GLOBAL OPERATIONS MATRIX REQUIRES IMMEDIATE SYNCHRONIZATION REGARDING THE <span className="text-indigo-400 font-black">"{EMAIL_TEMPLATES.find(t => t.id === activeTemplate)?.label}"</span> PROTOCOL SHARD.</p>
                              <p>PLEASE INGRESS THE NEXUS HUB TO FINALIZE HEARTBEAT COMPLIANCE.</p>
                           </div>

                           <div className="pt-8 border-t border-white/5">
                              <p className="text-slate-600 font-black tracking-tighter uppercase italic tracking-[0.2em]">ROOT_SIGNATURE_AUTH_VERIFIED :: b8ce...a9dc</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="pt-6">
                     <button 
                        onClick={handleDispatch}
                        disabled={!selectedRecipient}
                        className="group w-full py-6 bg-white text-black rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(255,255,255,0.05)] hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-10 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-4 active:scale-[0.98]"
                     >
                        <span className="relative z-10">Authorize Dispatch Shard</span>
                        <Send size={18} className="relative z-10 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                     </button>
                  </div>
               </div>
            </div>

            {/* QUICK TELEMETRY */}
            <div className="grid grid-cols-3 gap-8">
               {[
                  { label: 'Dispatch Success', val: '99.8%', icon: Zap, color: 'emerald' },
                  { label: 'Ingress Rate', val: '72%', icon: Radio, color: 'amber' },
                  { label: 'Active Alerts', val: '0', icon: CheckCircle2, color: 'indigo' }
               ].map((m, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center group hover:bg-indigo-600 transition-all cursor-pointer">
                     <div className={`w-12 h-12 rounded-2xl bg-${m.color}-500/10 text-${m.color}-400 flex items-center justify-center mb-4 group-hover:bg-white/20 group-hover:text-white transition-all`}>
                        <m.icon size={22} />
                     </div>
                     <p className="text-[10px] font-black uppercase text-slate-600 group-hover:text-white/50 tracking-[0.3em] mb-2">{m.label}</p>
                     <p className="text-2xl font-black text-white italic tracking-tighter tabular-nums">{m.val}</p>
                  </div>
               ))}
            </div>
         </section>
      </div>
    </div>
  );
}
