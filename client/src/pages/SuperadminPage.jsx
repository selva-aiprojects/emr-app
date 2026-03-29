import { useState } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { api, provisionTenantAdmin } from '../api.js';
import { Bell, Zap } from 'lucide-react';
import DashboardMetrics from '../components/superadmin/DashboardMetrics.jsx';
import TenantList from '../components/superadmin/TenantList.jsx';
import TenantCreationForm from '../components/superadmin/TenantCreationForm.jsx';
import TenantAdminProvisioningForm from '../components/superadmin/TenantAdminProvisioningForm.jsx';
import ResetPasswordForm from '../components/superadmin/ResetPasswordForm.jsx';
import IssuesTable from '../components/superadmin/IssuesTable.jsx';
import TicketStatus from '../components/superadmin/TicketStatus.jsx';
import InfraUsage from '../components/superadmin/InfraUsage.jsx';
import PlatformAccounts from '../components/superadmin/PlatformAccounts.jsx';
import OfferManagement from '../components/superadmin/OfferManagement.jsx';

function SuperadminPage({ 
  viewMode = 'superadmin',
  superOverview: propOverview, 
  tenants = [], 
  onCreateTenant, 
  onRefresh, 
  issues = [], 
  tickets = [], 
  infra = {} 
}) {
  const { showToast } = useToast();
  const superOverview = propOverview || {};

  const metrics = {
    tenants: superOverview?.totals?.tenants ?? 0,
    users: superOverview?.totals?.users ?? 0,
    issues: issues.length,
    tickets: tickets.length,
  };

  async function handleProvisionAdmin(tenantId, data) {
    try {
      const result = await provisionTenantAdmin(tenantId, data);
      showToast({ message: 'Tenant Admin Provisioned successfully!', type: 'success', title: 'Security node' });
      if (onRefresh) onRefresh();
      return result;
    } catch (err) {
      showToast({ message: err.message, type: 'error', title: 'Provisioning Error' });
      throw err;
    }
  }

  // 1. DASHBOARD VIEW (Metrics, Tickets, Issues, Capacity)
  if (viewMode === 'superadmin') {
    return (
      <div className="intelligence-hub slide-up">
        {/* Platform Metrics */}
        <DashboardMetrics {...metrics} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            <h3 className="section-header-premium mb-4 flex items-center gap-2">
               <Bell className="w-5 h-5" /> Urgent Platform Issues
            </h3>
            <IssuesTable issues={issues} />
          </div>
          <div className="lg:col-span-1 space-y-8">
            <h3 className="section-header-premium mb-4 flex items-center gap-2">
               <Zap className="w-5 h-5" /> Infrastructure Health
            </h3>
            <InfraUsage {...infra} />
            <TicketStatus tickets={tickets} />
          </div>
        </div>
      </div>
    );
  }

  // 2. TENANT MANAGEMENT VIEW (List + Creation)
  if (viewMode === 'tenant_management') {
    return (
      <div className="intelligence-hub slide-up space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <TenantList tenants={tenants} onSelect={() => {}} />
          </div>
          <div className="xl:col-span-1">
             <TenantCreationForm onCreate={onCreateTenant} />
          </div>
        </div>
      </div>
    );
  }

  // 3. USER PROVISIONING VIEW (Provisioning + Password Resets)
  if (viewMode === 'user_provisioning') {
    return (
      <div className="intelligence-hub slide-up space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TenantAdminProvisioningForm tenants={tenants} onProvision={handleProvisionAdmin} />
          <ResetPasswordForm tenants={tenants} />
        </div>
      </div>
    );
  }

  // 4. FINANCIAL CONTROL VIEW (Offers + Platform Accounts)
  if (viewMode === 'financial_control') {
    return (
      <div className="intelligence-hub slide-up space-y-12">
        <PlatformAccounts tenants={tenants} />
        <OfferManagement tenants={tenants} />
      </div>
    );
  }

  return null;
}

export default SuperadminPage;
