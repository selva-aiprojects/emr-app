import { useState, useEffect } from 'react';
import { UserCircle } from 'lucide-react';
import { api } from '../api.js';
import DashboardMetrics from '../components/superadmin/DashboardMetrics.jsx';
import TenantList from '../components/superadmin/TenantList.jsx';
import TenantCreationForm from '../components/superadmin/TenantCreationForm.jsx';
import IssuesTable from '../components/superadmin/IssuesTable.jsx';
import TicketStatus from '../components/superadmin/TicketStatus.jsx';
import InfraUsage from '../components/superadmin/InfraUsage.jsx';


function SuperadminPage({ viewMode = 'superadmin', superOverview: propOverview, tenants = [], onCreateTenant, onCreateUser, issues = [], tickets = [], infra = {} }) {
  const superOverview = propOverview || {};

  const metrics = {
    tenants: superOverview?.totals?.tenants ?? 0,
    users: superOverview?.totals?.users ?? 0,
    issues: issues.length,
    tickets: tickets.length,
  };

  return (
    <div className="intelligence-hub slide-up">
      <DashboardMetrics {...metrics} />

      {viewMode === 'superadmin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            <TenantList tenants={tenants} onSelect={() => {}} />
            <IssuesTable issues={issues} />
          </div>
          <div className="lg:col-span-1 space-y-8">
            <InfraUsage {...infra} />
            <TicketStatus tickets={tickets} />
          </div>
        </div>
      )}

      {viewMode === 'tenant_management' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-1">
             <TenantCreationForm onCreate={onCreateTenant} />
          </div>
          <div className="lg:col-span-2">
            <TenantList tenants={tenants} onSelect={() => {}} />
          </div>
        </div>
      )}

      {viewMode === 'user_provisioning' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-1">
             <section className="clinical-card p-6">
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center shadow">
                   <UserCircle className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">User Provisioning</h2>
                   <p className="text-xs text-slate-400 mt-0.5">Assign administrative identity to a target node</p>
                 </div>
               </div>
               <form onSubmit={onCreateUser} className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Target Organization</label>
                   <select name="tenantId" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800" required>
                     <option value="">Select Tenant...</option>
                     {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                   <input type="text" name="name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800" required />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Work Email</label>
                   <input type="email" name="email" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800" required />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Designated Role</label>
                   <select name="role" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800" required>
                     <option value="Admin">Tenant Admin</option>
                     <option value="Doctor">Clinical Practitioner</option>
                     <option value="Nurse">Medical Staff</option>
                     <option value="Lab">Lab Technician</option>
                   </select>
                 </div>
                 <button type="submit" className="w-full py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-sky-700 transition-all shadow-lg">Provision Access</button>
               </form>
             </section>
          </div>
          <div className="lg:col-span-2">
            <IssuesTable issues={[]} title="Recent Provisioning Requests" />
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperadminPage;
