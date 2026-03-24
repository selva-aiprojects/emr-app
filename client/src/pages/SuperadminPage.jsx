import { useState, useEffect } from 'react';
import { api } from '../api.js';
import DashboardMetrics from '../components/superadmin/DashboardMetrics.jsx';
import TenantList from '../components/superadmin/TenantList.jsx';
import TenantCreationForm from '../components/superadmin/TenantCreationForm.jsx';
import IssuesTable from '../components/superadmin/IssuesTable.jsx';
import TicketStatus from '../components/superadmin/TicketStatus.jsx';
import InfraUsage from '../components/superadmin/InfraUsage.jsx';


function SuperadminPage({ superOverview: propOverview, tenants = [], onCreateTenant, onCreateUser, issues = [], tickets = [], infra = {} }) {
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
    <div className="intelligence-hub slide-up">
      <DashboardMetrics {...metrics} />

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TenantCreationForm onCreate={onCreateTenant} />
        {/* User provisioning form can be modularized similarly if needed */}
      </div>
    </div>
  );
}

export default SuperadminPage;
