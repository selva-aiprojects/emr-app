import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import DashboardMetrics from '../components/superadmin/DashboardMetrics.jsx';
import TenantList from '../components/superadmin/TenantList.jsx';
import TenantCreationForm from '../components/superadmin/TenantCreationForm.jsx';
import IssuesTable from '../components/superadmin/IssuesTable.jsx';
import TicketStatus from '../components/superadmin/TicketStatus.jsx';
import InfraUsage from '../components/superadmin/InfraUsage.jsx';
import FeatureManager from '../components/superadmin/FeatureManager.jsx';

function SuperadminPage({ superOverview: propOverview, tenants = [], onCreateTenant, onCreateUser, issues = [], tickets = [], onResolveTicket, infra = {}, onRefresh }) {
  const [selectedTenant, setSelectedTenant] = useState(null);
  const superOverview = propOverview || {};
  // Example: issues, tickets, infra would be fetched or passed as props in a real app

  // Dashboard metrics
  const metrics = {
    tenants: superOverview?.totals?.tenants ?? 0,
    users: superOverview?.totals?.users ?? 0,
    issues: issues.length,
    tickets: tickets.length,
  };

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="flex items-center gap-3">
              Platform Governance Hub
              <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">Global Node</span>
           </h1>
           <p className="dim-label">Operational overview of multi-tenant shards and platform infrastructure health across the global ecosystem.</p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Platform Operational • Real-time Monitoring Active
           </p>
        </div>
        <div className="flex bg-white shadow-sm p-1 rounded-2xl border border-slate-200">
           <div className="px-5 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-widest text-slate-600">Infrastructure Stable</span>
           </div>
        </div>
      </header>

      <DashboardMetrics {...metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2">
          <TenantList tenants={tenants} onSelect={(t) => setSelectedTenant(t)} />
          <IssuesTable issues={issues} />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <InfraUsage {...infra} />
          <TicketStatus tickets={tickets} onResolveTicket={onResolveTicket} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TenantCreationForm onCreate={onCreateTenant} />
        {/* User provisioning form can be modularized similarly if needed */}
      </div>

      {selectedTenant && (
        <FeatureManager 
          tenant={selectedTenant} 
          onClose={() => setSelectedTenant(null)} 
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

export default SuperadminPage;
