import React, { useState, useEffect } from 'react';
import { 
  Server, Shield, Box, CreditCard, Activity, 
  MessageSquare, HelpCircle, ChevronRight, 
  Search, Bell, Plus, Users, Globe, Database,
  DollarSign, Ticket, Tag
} from 'lucide-react';

// New Core Modules
import GlobalDashboard from '../components/superadmin/GlobalDashboard.jsx';
import SubscriptionEngine from '../components/superadmin/SubscriptionEngine.jsx';
import TenantControlCenter from '../components/superadmin/TenantControlCenter.jsx';
import InfraOpsManager from '../components/superadmin/InfraOpsManager.jsx';
import FiscalGovernance from '../components/superadmin/FiscalGovernance.jsx';
import CommunicationCenter from '../components/superadmin/CommunicationCenter.jsx';
import OfferManagement from '../components/superadmin/OfferManagement.jsx';

import '../styles/superadmin.css';

export default function EnhancedSuperadminPage({ 
  view: initialView = 'superadmin', 
  tenants = [], 
  users = [],
  superOverview = {},
  tickets = [],
  onRefresh,
  apiClient
}) {
  const [activeView, setActiveView] = useState(initialView);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync active view with parent initial choice
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const sidebarItems = [
    { id: 'superadmin',        label: 'Dashboard',      icon: Globe },
    { id: 'tenant_management', label: 'Shards',         icon: Box },
    { id: 'subscription_mgmt',label: 'Economy',         icon: CreditCard },
    { id: 'financial_control', label: 'Fiscal',         icon: DollarSign },
    { id: 'infra_health',      label: 'Infrastructure', icon: Activity },
    { id: 'communication',     label: 'Directives',     icon: MessageSquare },
    { id: 'offers',            label: 'Offers',         icon: Tag },
    { id: 'support',           label: 'Support',        icon: HelpCircle },
  ];

  const handleMegaSeed = async () => {
    try {
      if (apiClient.megaSeedInstitutional) {
        const res = await apiClient.megaSeedInstitutional();
        if (res && res.success) {
           window.location.reload();
        }
      }
    } catch (e) {
      console.error('Simulation Error:', e);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'superadmin':
        return <GlobalDashboard tenants={tenants} overview={superOverview} />;
      case 'subscription_mgmt':
        return <SubscriptionEngine tenants={tenants} />;
      case 'tenant_management':
        return <TenantControlCenter tenants={tenants} onRefresh={onRefresh} apiClient={apiClient} />;
      case 'infra_health':
        return <InfraOpsManager tenants={tenants} overview={superOverview} apiClient={apiClient} />;
      case 'financial_control':
        return <FiscalGovernance tenants={tenants} />;
      case 'communication':
        return <CommunicationCenter tenants={tenants} apiClient={apiClient} />;
      case 'offers':
        return <OfferManagement tenants={tenants} />;
      case 'support':
      case 'admin':
        return <SuperadminSupportView tickets={tickets} />;
      default:
        return <GlobalDashboard tenants={tenants} overview={superOverview} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col relative">
        {/* TOP COMMAND BAR */}
        <header className="h-[80px] border-b border-slate-200 flex items-center justify-between px-10 z-40 bg-white/80 backdrop-blur-md">
           <div className="relative group w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400" />
              <input 
                type="text" 
                placeholder="Query Shard, Policy or Identity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-[12px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400 transition-all font-tabular"
              />
           </div>

           <div className="flex items-center gap-6">
              <button 
                onClick={handleMegaSeed}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all group"
              >
                 <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                 Institutional Simulation
              </button>
              <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 transition-all group">
                 <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                 {tickets.filter(t => t.status !== 'resolved').length > 0 && (
                   <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 border-2 border-[#1e293b]" />
                 )}
              </button>
              <div className="h-8 w-px bg-white/5" />
              <div className="flex items-center gap-4">
                 <div className="text-right">
                    <p className="text-[12px] font-black text-slate-900 tracking-tight">Root Auditor</p>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Tier 0 Access</p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-indigo-900 border border-white/10 flex items-center justify-center text-white text-[12px] font-black">
                   RA
                 </div>
              </div>
           </div>
        </header>

        {/* DYNAMIC VIEW ZONE */}
        <section className="flex-1 overflow-y-auto p-10 scroll-smooth relative bg-[#f1f5f9]/30 custom-scrollbar">
           {/* Ambient Glows */}
           <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
           <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
           
           <div className="relative z-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
              {renderContent()}
           </div>
        </section>

        {/* LIVE METRICS FLOOR (Command Aesthetic) */}
        <footer className="h-10 bg-white border-t border-slate-200 flex items-center px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] justify-between z-30 shrink-0">
           <div className="flex gap-8">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> PLATFORM KERNEL v4.5.1</span>
              <span className="flex items-center gap-2 text-indigo-400/60"><Activity size={10} /> LATENCY: 24ms</span>
              <span className="flex items-center gap-2 text-slate-500"><Database size={10} /> DB POOL: 14/200</span>
           </div>
           <div className="flex gap-6 items-center">
              <div className="flex items-center gap-2 text-emerald-400/80">
                 <Shield className="w-3 h-3" />
                 ENCRYPTION: AES-256-GCM
              </div>
              <span className="text-slate-100/50 font-tabular">{new Date().toISOString()}</span>
           </div>
        </footer>
      </main>
    </div>
  );
}

// ─── Inline Support Ticket Viewer ───────────────────────────────────────────
function SuperadminSupportView({ tickets = [] }) {
  const open   = tickets.filter(t => t.status !== 'resolved');
  const closed = tickets.filter(t => t.status === 'resolved');

  const priorityColor = (p) => {
    if (!p) return 'text-slate-400 bg-white/5 border-white/10';
    const pl = p.toLowerCase();
    if (pl === 'critical' || pl === 'urgent') return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (pl === 'high') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const statusColor = (s) => {
    if (!s) return 'text-slate-500';
    const sl = s.toLowerCase();
    if (sl === 'resolved') return 'text-emerald-400';
    if (sl === 'in_progress' || sl === 'in progress') return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* TITLE */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[20px] font-black text-white tracking-tighter uppercase mb-1">Support Console</h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Global Ticket Registry</span>
            <div className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cross-Shard Issue Tracking</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] font-black text-rose-400 uppercase tracking-widest">
            {open.length} Open
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            {closed.length} Resolved
          </div>
        </div>
      </div>

      {/* OPEN TICKETS */}
      {open.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-16 text-center">
          <HelpCircle size={48} className="text-emerald-500/40 mx-auto mb-4" />
          <p className="text-[14px] font-black text-slate-500 uppercase tracking-widest">No open tickets across any shard</p>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2 italic">Platform running clean</p>
        </div>
      ) : (
        <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
          <div className="px-10 py-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Open Issues</h3>
          </div>
          <div className="divide-y divide-white/5">
            {open.map((ticket, i) => (
              <div key={ticket.id || i} className="flex items-start gap-6 p-8 hover:bg-white/[0.02] transition-all">
                <div className={`mt-1 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest shrink-0 ${priorityColor(ticket.priority)}`}>
                  {ticket.priority || 'Normal'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-white uppercase tracking-tight truncate mb-1">
                    {ticket.subject || ticket.event || ticket.title || 'Support Request'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-bold truncate">
                    {ticket.description || ticket.details || '—'}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      {ticket.tenantName || ticket.tenant_id || 'Global'}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest tabular-nums">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${statusColor(ticket.status)}`}>
                  {ticket.status || 'Open'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESOLVED TICKETS (collapsed summary) */}
      {closed.length > 0 && (
        <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="px-10 py-6 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">{closed.length} Resolved Tickets</h3>
          </div>
        </div>
      )}
    </div>
  );
}
