import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  Users, 
  Plus, 
  Archive, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Tag,
  Ban,
  Package,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useToast } from '../../hooks/useToast.jsx';
import { superadminService } from '../../services/superadmin.service.js';

const EMAIL_TEMPLATES = [
  { id: 'new_sub', label: 'New Subscription Protocol', desc: 'Secure onboarding shard for first-time nodes.', icon: Package, color: 'indigo' },
  { id: 'follow_up', label: 'Monthly Fee Cadence', desc: 'Financial reminders for pending subscription shards.', icon: Clock, color: 'emerald' },
  { id: 'suspend', label: 'Suspend Notification', desc: 'Legal & technical alert for inactive node isolation.', icon: Ban, color: 'rose' },
  { id: 'offer', label: 'Ad Pricing Communication', desc: 'Strategic pricing shards for current seasonal offers.', icon: Tag, color: 'amber' },
];

export default function CommunicationCenter({ tenants = [] }) {
  const { showToast } = useToast();
  const [activeTemplate, setActiveTemplate] = useState('new_sub');
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const handleDispatch = async () => {
    if (!selectedRecipient) {
      showToast({ message: "Node Selection Required", type: 'error' });
      return;
    }
    
    const template = EMAIL_TEMPLATES.find(t => t.id === activeTemplate);
    showToast({ message: `Preparing strategic shard for ${selectedRecipient.name}...`, type: 'info' });
    
    try {
      await superadminService.sendCommunication(selectedRecipient.code, activeTemplate, {
        tenantName: selectedRecipient.name,
        templateName: template.label
      });
      
      showToast({ 
        message: `Strategic Communication Shard [${template.label}] dispatched to ${selectedRecipient.name}.`, 
        type: 'success',
        title: 'Global Dispatch Success'
      });
    } catch (err) {
      showToast({ message: err.message, type: 'error', title: 'Dispatch Failed' });
    }
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Communication Center</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic">Global Outreach Shard & Automated Messaging Protocol</p>
         </div>
         <div className="flex gap-3">
            <button className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">Audit All Outbound</button>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-colors">
               <Plus size={14} className="inline mr-2" /> Global Broadcast
            </button>
         </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Template Hub */}
         <aside className="space-y-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">Protocol Templates</h3>
            <div className="space-y-4">
               {EMAIL_TEMPLATES.map((tpl) => (
                  <button 
                     key={tpl.id}
                     onClick={() => setActiveTemplate(tpl.id)}
                     className={`w-full text-left p-6 rounded-[32px] border-2 transition-all group overflow-hidden relative ${
                        activeTemplate === tpl.id 
                           ? `bg-white border-${tpl.color}-500 shadow-xl` 
                           : 'bg-white border-slate-100 hover:border-slate-300'
                     }`}
                  >
                     <div className={`w-12 h-12 rounded-2xl bg-${tpl.color}-50 text-${tpl.color}-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                        <tpl.icon size={24} />
                     </div>
                     <h4 className="text-sm font-black uppercase text-slate-900 tracking-tight leading-none mb-2">{tpl.label}</h4>
                     <p className="text-[10px] font-medium text-slate-500 leading-relaxed max-w-[200px]">{tpl.desc}</p>
                     
                     {activeTemplate === tpl.id && (
                        <div className={`absolute -right-4 -bottom-4 w-16 h-16 bg-${tpl.color}-500/5 blur-2xl rounded-full`} />
                     )}
                  </button>
               ))}
            </div>
         </aside>

         {/* Dispatch Command Area */}
         <section className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 flex flex-col h-full relative overflow-hidden group">
               <div className="flex items-center justify-between mb-10 relative z-10">
                  <div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Command Dispatch</h3>
                     <p className="text-xs text-slate-500 font-medium mt-1">Manual targeted communication with audit logging</p>
                  </div>
                  <div className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                     Ready: DISPATCH_01
                  </div>
               </div>

               <div className="space-y-8 relative z-10">
                  {/* Recipient Search Matrix */}
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Node Selection Protocol</label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tenants.slice(0, 4).map((t, i) => (
                           <div 
                              key={i} 
                              onClick={() => setSelectedRecipient(t)}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group/item ${
                                 selectedRecipient?.id === t.id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md'
                              }`}
                           >
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-indigo-600 transition-transform group-hover/item:scale-110">
                                    {t.name?.slice(0, 2).toUpperCase()}
                                 </div>
                                 <span className="text-[10px] font-black text-slate-800 uppercase">{t.name}</span>
                              </div>
                              {selectedRecipient?.id === t.id ? (
                                 <CheckCircle2 size={16} className="text-indigo-600" />
                              ) : (
                                 <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                              )}
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Shard Content Layer</label>
                     <div className="min-h-[220px] bg-slate-50 border border-slate-100 rounded-[32px] p-8 text-slate-400 font-mono text-[10px] leading-relaxed relative group overflow-hidden">
                        <div className="relative z-10 opacity-70 group-hover:opacity-100 transition-all">
                           <p className="text-indigo-600 font-bold mb-4">// System generated content shards pending identity merge</p>
                           <p>SUBJECT: [DYNAMIC_PROTOCOL_TITLE] - Healthezee Operations</p>
                           <p className="mt-4">Greetings Node Admin,</p>
                           <p className="mt-4">This communication shard is being dispatched regarding your hospital node: <span className="text-indigo-600 font-bold">{selectedRecipient?.name || '[SELECT_NODE]'}</span>.</p>
                           <p className="mt-4 leading-relaxed">The current platform operations matrix requires immediate synchronization regarding the <span className="text-indigo-600 font-bold">{EMAIL_TEMPLATES.find(t => t.id === activeTemplate)?.label}</span> protocol.</p>
                           <div className="mt-8 pt-8 border-t border-slate-200">
                              <p className="font-bold">PLATFORM_ROOT_SIGNATURE: b8ce...a9dc</p>
                           </div>
                        </div>
                        {/* Decorative BG Icon */}
                        <Mail size={300} className="absolute -bottom-24 -right-24 opacity-5 stroke-[0.2]" />
                     </div>
                  </div>

                  <div className="pt-6">
                     <button 
                        onClick={handleDispatch}
                        disabled={!selectedRecipient}
                        className="w-full py-5 bg-indigo-600 text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group flex items-center justify-center gap-3 overflow-hidden relative"
                     >
                        <span className="relative z-10">Dispatch Protocol Shard</span>
                        <Send size={18} className="relative z-10 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                        <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                     </button>
                  </div>
               </div>
            </div>

            {/* Quick Metrics for Communication */}
            <div className="grid grid-cols-3 gap-6">
               {[
                  { label: 'Outbound Success', val: '99.8%', icon: TrendingUp, color: 'emerald' },
                  { label: 'Global Open Rate', val: '72%', icon: Sparkles, color: 'amber' },
                  { label: 'Unchecked Alerts', val: '0', icon: CheckCircle2, color: 'indigo' }
               ].map((m, i) => (
                  <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group transition-all hover:bg-slate-900 hover:text-white">
                     <div className={`w-10 h-10 rounded-xl bg-${m.color}-50 text-${m.color}-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-white group-hover:text-${m.color}-600 transition-all`}>
                        <m.icon size={20} />
                     </div>
                     <p className="text-[9px] font-black uppercase text-slate-400 group-hover:text-white/50 tracking-widest leading-none mb-2">{m.label}</p>
                     <p className="text-xl font-black tabular-nums">{m.val}</p>
                  </div>
               ))}
            </div>
         </section>
      </div>
    </div>
  );
}
