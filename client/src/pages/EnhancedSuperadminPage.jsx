import React, { useState, useEffect } from 'react';
import { 
  Server, Shield, Box, CreditCard, Activity, 
  MessageSquare, HelpCircle, ChevronRight, 
  Search, Bell, Plus, Users, Globe, Database,
  DollarSign, Ticket, Tag, History
} from 'lucide-react';

// New Core Modules
import GlobalDashboard from '../components/superadmin/GlobalDashboard.jsx';
import SubscriptionEngine from '../components/superadmin/SubscriptionEngine.jsx';
import TenantControlCenter from '../components/superadmin/TenantControlCenter.jsx';
import InfraOpsManager from '../components/superadmin/InfraOpsManager.jsx';
import FiscalGovernance from '../components/superadmin/FiscalGovernance.jsx';
import CommunicationCenter from '../components/superadmin/CommunicationCenter.jsx';
import CommunicationHub from './CommunicationHub.jsx';
import OfferManagement from '../components/superadmin/OfferManagement.jsx';

import '../styles/superadmin.css';

export default function EnhancedSuperadminPage({ 
  view: initialView = 'superadmin', 
  tenants = [], 
  users = [],
  superOverview = {},
  tickets = [],
  onRefresh,
  apiClient,
  setView
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
    { id: 'comm_history',      label: 'Signal History', icon: History },
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
        return <TenantControlCenter tenants={tenants} onRefresh={onRefresh} apiClient={apiClient} setView={setView} />;
      case 'infra_health':
        return <InfraOpsManager tenants={tenants} overview={superOverview} apiClient={apiClient} />;
      case 'financial_control':
        return <FiscalGovernance tenants={tenants} />;
      case 'communication':
        return <CommunicationCenter tenants={tenants} apiClient={apiClient} />;
      case 'comm_history':
        return <CommunicationHub />;
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
    <div className="flex flex-col min-h-full bg-transparent">
      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col relative">
        {/* TOP COMMAND BAR REMOVED: Managed by parent AppLayout to prevent redundancy */}

        {/* DYNAMIC VIEW ZONE */}
        <section className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 scroll-smooth relative bg-[#f1f5f9]/30 custom-scrollbar">
           {/* Decorative glows disabled for stability */}
           
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
