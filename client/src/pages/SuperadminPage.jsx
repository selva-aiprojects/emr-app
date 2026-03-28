import { useState } from 'react';
import { api, provisionTenantAdmin } from '../api.js';
import DashboardMetrics from '../components/superadmin/DashboardMetrics.jsx';
import TenantList from '../components/superadmin/TenantList.jsx';
import TenantCreationForm from '../components/superadmin/TenantCreationForm.jsx';
import TenantAdminProvisioningForm from '../components/superadmin/TenantAdminProvisioningForm.jsx';
import ResetPasswordForm from '../components/superadmin/ResetPasswordForm.jsx';
import IssuesTable from '../components/superadmin/IssuesTable.jsx';
import TicketStatus from '../components/superadmin/TicketStatus.jsx';
import InfraUsage from '../components/superadmin/InfraUsage.jsx';

function SuperadminPage({ superOverview: propOverview, tenants = [], onCreateTenant, onRefresh, issues = [], tickets = [], infra = {} }) {
  const superOverview = propOverview || {};

  const metrics = {
    tenants: superOverview?.totals?.tenants ?? 0,
    users: superOverview?.totals?.users ?? 0,
    issues: issues.length,
    tickets: tickets.length,
  };

  async function handleProvisionAdmin(tenantId, data) {
    const result = await provisionTenantAdmin(tenantId, data);
    if (onRefresh) onRefresh();
    return result;
  }

  return (
    <div className="intelligence-hub slide-up">

      {/* 1. Platform Metrics — Full Width */}
      <DashboardMetrics {...metrics} />

      {/* 2. PRIMARY: Tenant Node Registry — Full Width */}
      <TenantList tenants={tenants} onSelect={() => {}} />

      {/* 3. Operations: Create + Provision + Reset — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <TenantCreationForm onCreate={onCreateTenant} />
        <TenantAdminProvisioningForm tenants={tenants} onProvision={handleProvisionAdmin} />
        <ResetPasswordForm tenants={tenants} />
      </div>

      {/* 4. SECONDARY: Issues + Infra + Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2">
          <IssuesTable issues={issues} />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <InfraUsage {...infra} />
          <TicketStatus tickets={tickets} />
        </div>
      </div>

    </div>
  );
}

export default SuperadminPage;
