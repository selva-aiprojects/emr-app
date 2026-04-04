import DashboardMetrics from '../components/superadmin/DashboardMetrics.jsx';
import TenantList from '../components/superadmin/TenantList.jsx';
import TenantCreationForm from '../components/superadmin/TenantCreationForm.jsx';
import IssuesTable from '../components/superadmin/IssuesTable.jsx';
import TicketStatus from '../components/superadmin/TicketStatus.jsx';
import InfraUsage from '../components/superadmin/InfraUsage.jsx';
import TenantAdminProvisioningForm from '../components/superadmin/TenantAdminProvisioningForm.jsx';
import ResetPasswordForm from '../components/superadmin/ResetPasswordForm.jsx';
import PlatformAccounts from '../components/superadmin/PlatformAccounts.jsx';
import OfferManagement from '../components/superadmin/OfferManagement.jsx';

function SectionShell({ title, description, children }) {
  return (
    <section className="clinical-card p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">{title}</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{description}</p>
      </div>
      {children}
    </section>
  );
}

function SuperadminPage({
  viewMode = 'superadmin',
  superOverview: propOverview,
  tenants = [],
  onCreateTenant,
  onCreateUser,
  issues = [],
  tickets = [],
  infra = {}
}) {
  const superOverview = propOverview || {};

  const metrics = {
    tenants: superOverview?.totals?.tenants ?? 0,
    doctors: superOverview?.totals?.doctors ?? 0,
    patients: superOverview?.totals?.patients ?? 0,
    tickets: superOverview?.totals?.openTickets ?? tickets.length,
  };

  const infraMetrics = {
    ...(superOverview?.infra || infra || {}),
    bedsAvailable: superOverview?.totals?.bedsAvailable ?? 0,
    ambulancesAvailable: superOverview?.totals?.ambulancesAvailable ?? 0,
    insuranceCapacity: superOverview?.totals?.insuranceCapacity ?? 0,
  };

  const dashboardView = (
    <>
      <DashboardMetrics {...metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2">
          <TenantList tenants={tenants} onSelect={() => {}} />
          <IssuesTable issues={issues} />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <InfraUsage {...infraMetrics} />
          <TicketStatus tickets={tickets} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TenantCreationForm onCreate={onCreateTenant} />
        <TenantAdminProvisioningForm tenants={tenants} onProvision={onCreateUser} />
      </div>
    </>
  );

  const infraView = (
    <div className="space-y-8">
      <DashboardMetrics {...metrics} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TenantList tenants={tenants} onSelect={() => {}} />
        </div>
        <div className="lg:col-span-1">
          <InfraUsage {...infraMetrics} />
        </div>
      </div>
      <TicketStatus tickets={tickets} />
    </div>
  );

  const contentByView = {
    superadmin: dashboardView,
    tenant_provision: (
      <SectionShell
        title="Tenant Provisioning"
        description="Create and activate new hospital nodes without opening tenant data directly"
      >
        <TenantCreationForm onCreate={onCreateTenant} />
      </SectionShell>
    ),
    user_provision: (
      <SectionShell
        title="Tenant Admin Provisioning"
        description="Create initial admin identities for tenant nodes from the control plane"
      >
        <TenantAdminProvisioningForm tenants={tenants} onProvision={onCreateUser} />
      </SectionShell>
    ),
    password_reset: (
      <SectionShell
        title="Credential Recovery"
        description="Reset tenant user passwords centrally without entering the tenant workspace"
      >
        <ResetPasswordForm tenants={tenants} />
      </SectionShell>
    ),
    infra_health: infraView,
    financial_control: <PlatformAccounts tenants={tenants} />,
    subscription_mgmt: <OfferManagement tenants={tenants} />,
    ad_manager: <OfferManagement tenants={tenants} />,
  };

  return (
    <div className="intelligence-hub slide-up">
      {contentByView[viewMode] || dashboardView}
    </div>
  );
}

export default SuperadminPage;
