import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ambulance,
  ArrowRight,
  Building2,
  Crown,
  HeartPulse,
  Layers3,
  LifeBuoy,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users
} from 'lucide-react';
import TenantCreationForm from '../components/superadmin/TenantCreationForm.jsx';
import IssuesTable from '../components/superadmin/IssuesTable.jsx';
import TicketStatus from '../components/superadmin/TicketStatus.jsx';
import InfraUsage from '../components/superadmin/InfraUsage.jsx';
import TenantAdminProvisioningForm from '../components/superadmin/TenantAdminProvisioningForm.jsx';
import ResetPasswordForm from '../components/superadmin/ResetPasswordForm.jsx';
import PlatformAccounts from '../components/superadmin/PlatformAccounts.jsx';
import OfferManagement from '../components/superadmin/OfferManagement.jsx';
import FeatureManager from '../components/superadmin/FeatureManager.jsx';

function PageSection({ eyebrow, title, description, children, compact = false }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
      <div className={`border-b border-slate-100 ${compact ? 'px-5 py-4' : 'px-6 py-5 md:px-7'}`}>
        {eyebrow && <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{eyebrow}</div>}
        <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
        {description && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      <div className={compact ? 'p-5' : 'p-6 md:p-7'}>{children}</div>
    </section>
  );
}

function SummaryCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
          <div className="mt-2 text-sm text-slate-500">{detail}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function TenantListItem({ tenant, active, onSelect }) {
  const tierStyles = {
    Free: 'bg-emerald-50 text-emerald-700',
    Basic: 'bg-sky-50 text-sky-700',
    Professional: 'bg-amber-50 text-amber-700',
    Enterprise: 'bg-violet-50 text-violet-700'
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-[20px] border px-4 py-4 text-left transition-all ${
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-md'
          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{tenant.name}</div>
          <div className={`mt-1 truncate text-[11px] uppercase tracking-[0.18em] ${active ? 'text-white/55' : 'text-slate-400'}`}>
            {tenant.code} · {tenant.subdomain || 'node pending'}
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${active ? 'bg-white/10 text-white' : tierStyles[tenant.subscription_tier] || 'bg-slate-100 text-slate-700'}`}>
          {tenant.subscription_tier || 'Basic'}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${tenant.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span className={`text-xs font-medium capitalize ${active ? 'text-white/80' : 'text-slate-600'}`}>{tenant.status || 'active'}</span>
        </div>
        <div className={`text-xs ${active ? 'text-white/70' : 'text-slate-500'}`}>
          {tenant.patient_count ?? 0} patients
        </div>
      </div>
    </button>
  );
}

function TenantRail({ tenants, focusedTenant, onSelect }) {
  return (
    <PageSection
      eyebrow="Tenant Directory"
      title="Active Tenant Network"
      description="Select a tenant to inspect subscription status, feature controls, and operational posture."
      compact
    >
      <div className="space-y-3">
        {tenants.map((tenant) => (
          <TenantListItem
            key={tenant.id}
            tenant={tenant}
            active={focusedTenant?.id === tenant.id}
            onSelect={() => onSelect(tenant.id)}
          />
        ))}
        {!tenants.length && (
          <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No tenants are available yet.
          </div>
        )}
      </div>
    </PageSection>
  );
}

function TenantOverviewCard({ tenant, onOpenGovernance }) {
  if (!tenant) {
    return (
      <PageSection
        eyebrow="Tenant Overview"
        title="No tenant selected"
        description="Choose a tenant from the list to review its current state."
      >
        <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Tenant-specific controls will appear here.
        </div>
      </PageSection>
    );
  }

  const stats = [
    { label: 'Status', value: tenant.status || 'active' },
    { label: 'Tier', value: tenant.subscription_tier || 'Basic' },
    { label: 'Patients', value: tenant.patient_count ?? 0 },
    { label: 'Provisioned', value: tenant.created_at ? new Date(tenant.created_at).toLocaleDateString('en-IN') : 'Unknown' },
  ];

  return (
    <PageSection
      eyebrow="Tenant Overview"
      title={tenant.name}
      description={`${tenant.contact_email || 'No contact email recorded'} · ${tenant.subdomain || 'No subdomain assigned yet'}`}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
            <div className="mt-2 text-lg font-semibold capitalize text-slate-950">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Governance Action</div>
          <div className="mt-1 text-sm text-slate-600">Open subscription and feature controls for this tenant.</div>
        </div>
        <button
          onClick={onOpenGovernance}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-[11px] font-semibold text-white transition-colors hover:bg-slate-800"
        >
          Open Feature Governance
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </PageSection>
  );
}

function DashboardView({ metrics, platformCards, issues, infraMetrics, focusedTenant, onOpenGovernance }) {
  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)] md:px-8">
        <div className="max-w-3xl">
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Superadmin Console</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl" style={{ color: '#ffffff' }}>Platform dashboard</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">
            Monitor tenant growth, infrastructure posture, support pressure, and one selected tenant from a single operational view.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        {platformCards.map((item) => (
          <SummaryCard key={item.label} {...item} />
        ))}
      </div>

      <div className="space-y-6">
        <PageSection
          eyebrow="Operational Signals"
          title="Infrastructure and incident posture"
          description="Shared platform health and issue visibility across all active tenants."
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <IssuesTable issues={issues} />
            <InfraUsage {...infraMetrics} />
          </div>
        </PageSection>

        <TenantOverviewCard tenant={focusedTenant} onOpenGovernance={onOpenGovernance} />
      </div>
    </div>
  );
}

function SuperadminPage({
  viewMode = 'superadmin',
  superOverview: propOverview,
  tenants = [],
  users = [],
  onCreateTenant,
  onCreateUser,
  issues = [],
  tickets = [],
  infra = {},
  onResolveTicket,
  onRefresh
}) {
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [governanceOpen, setGovernanceOpen] = useState(false);
  const superOverview = propOverview || {};

  const focusedTenant = useMemo(() => {
    if (!tenants.length) return null;
    return tenants.find((tenant) => tenant.id === selectedTenantId) || tenants[0];
  }, [selectedTenantId, tenants]);

  const overviewTenantMetrics = superOverview?.tenants || [];
  const fallbackTenantCount = tenants.length;
  const overviewDoctors = overviewTenantMetrics.reduce((sum, tenant) => sum + Number(tenant.doctors || 0), 0);
  const overviewPatients = overviewTenantMetrics.reduce((sum, tenant) => sum + Number(tenant.patients || tenant.patient_count || 0), 0);
  const fallbackDoctorsFromUsers = users.filter((user) => String(user.role || '').toLowerCase() === 'doctor').length;
  const fallbackDoctorsFromTenants = tenants.reduce((sum, tenant) => sum + Number(tenant.doctors_count || tenant.doctors || 0), 0);
  const fallbackPatientsFromTenants = tenants.reduce((sum, tenant) => sum + Number(tenant.patient_count || 0), 0);
  const fallbackDoctors = overviewDoctors || fallbackDoctorsFromTenants || fallbackDoctorsFromUsers;
  const fallbackPatients = overviewPatients || fallbackPatientsFromTenants;
  const fallbackBeds = overviewTenantMetrics.reduce((sum, tenant) => sum + Number(tenant.bedsAvailable || 0), 0)
    || tenants.reduce((sum, tenant) => sum + Number(tenant.beds_available || tenant.bedsAvailable || 0), 0);
  const fallbackAmbulances = overviewTenantMetrics.reduce((sum, tenant) => sum + Number(tenant.ambulancesAvailable || 0), 0)
    || tenants.reduce((sum, tenant) => sum + Number(tenant.ambulances_available || tenant.ambulancesAvailable || 0), 0);
  const fallbackInsurance = overviewTenantMetrics.reduce((sum, tenant) => sum + Number(tenant.insuranceCapacity || 0), 0)
    || tenants.reduce((sum, tenant) => sum + Number(tenant.insurance_capacity || tenant.insuranceCapacity || 0), 0);

  const metrics = {
    tenants: superOverview?.totals?.tenants || fallbackTenantCount,
    doctors: superOverview?.totals?.doctors || fallbackDoctors,
    patients: superOverview?.totals?.patients || fallbackPatients,
    tickets: superOverview?.totals?.openTickets || tickets.length,
  };

  const infraMetrics = {
    ...(superOverview?.infra || infra || {}),
    bedsAvailable: superOverview?.totals?.bedsAvailable || fallbackBeds,
    ambulancesAvailable: superOverview?.totals?.ambulancesAvailable || fallbackAmbulances,
    insuranceCapacity: superOverview?.totals?.insuranceCapacity || fallbackInsurance,
  };

  const openTicketCount = tickets.filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'closed').length;
  const activeTenantCount = tenants.filter((tenant) => tenant.status === 'active').length;
  const tierBreakdown = useMemo(() => {
    return tenants.reduce((acc, tenant) => {
      const tier = tenant.subscription_tier || 'Basic';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});
  }, [tenants]);

  const platformCards = [
    {
      icon: Building2,
      label: 'Tenants',
      value: metrics.tenants,
      detail: `${activeTenantCount} active organizations`
    },
    {
      icon: Stethoscope,
      label: 'Doctors',
      value: metrics.doctors,
      detail: 'Federated clinical capacity'
    },
    {
      icon: Users,
      label: 'Patients',
      value: metrics.patients,
      detail: 'Aggregate, privacy-safe count'
    },
    {
      icon: LifeBuoy,
      label: 'Open tickets',
      value: openTicketCount,
      detail: issues.length ? `${issues.length} active issues detected` : 'No active issue pressure'
    },
    {
      icon: HeartPulse,
      label: 'Beds available',
      value: infraMetrics.bedsAvailable,
      detail: 'Network-wide bed capacity'
    },
    {
      icon: Ambulance,
      label: 'Ambulances',
      value: infraMetrics.ambulancesAvailable,
      detail: 'Vehicles ready for dispatch'
    },
    {
      icon: ShieldCheck,
      label: 'Insurance capacity',
      value: infraMetrics.insuranceCapacity,
      detail: 'Coverage engines currently available'
    },
    {
      icon: AlertTriangle,
      label: 'Issue queue',
      value: issues.length,
      detail: issues.length ? 'Requires operational review' : 'No incidents reported'
    }
  ];

  const dashboardView = (
    <DashboardView
      metrics={metrics}
      platformCards={platformCards}
      issues={issues}
      infraMetrics={infraMetrics}
      focusedTenant={focusedTenant}
      onOpenGovernance={() => setGovernanceOpen(true)}
    />
  );

  const infraView = (
    <div className="space-y-6">
      <PageSection
        eyebrow="Infrastructure"
        title="Infrastructure health"
        description="Review incident load, support backlog, and shared capacity across the tenant network."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
          {platformCards.slice(4).map((item) => (
            <SummaryCard key={item.label} {...item} />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <IssuesTable issues={issues} />
          <InfraUsage {...infraMetrics} />
        </div>
      </PageSection>

      <PageSection
        eyebrow="Support"
        title="Support queue"
        description="Outstanding support requests that still need platform intervention."
      >
        <TicketStatus tickets={tickets} onResolveTicket={onResolveTicket} />
      </PageSection>
    </div>
  );

  const subscriptionView = (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <TenantRail tenants={tenants} focusedTenant={focusedTenant} onSelect={setSelectedTenantId} />
      <div className="space-y-6">
        <TenantOverviewCard tenant={focusedTenant} onOpenGovernance={() => setGovernanceOpen(true)} />
        <PageSection
          eyebrow="Subscription Mix"
          title="Tier distribution"
          description="Current spread of subscription tiers across the tenant base."
          compact
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryCard icon={Crown} label="Basic" value={tierBreakdown.Basic || 0} detail="Core platform tenants" />
            <SummaryCard icon={Layers3} label="Professional" value={tierBreakdown.Professional || 0} detail="Expanded operational tier" />
            <SummaryCard icon={Sparkles} label="Enterprise" value={tierBreakdown.Enterprise || 0} detail="Full-service platform tier" />
          </div>
        </PageSection>
      </div>
    </div>
  );

  const tenantProvisionView = (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <TenantRail tenants={tenants} focusedTenant={focusedTenant} onSelect={setSelectedTenantId} />
      <PageSection
        eyebrow="Provisioning"
        title="Tenant provisioning"
        description="Create new tenants and register them into the control plane."
      >
        <TenantCreationForm onCreate={onCreateTenant} />
      </PageSection>
    </div>
  );

  const userProvisionView = (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <TenantRail tenants={tenants} focusedTenant={focusedTenant} onSelect={setSelectedTenantId} />
      <PageSection
        eyebrow="Identity"
        title="Tenant admin provisioning"
        description="Create the initial admin account for any tenant from the Superadmin console."
      >
        <TenantAdminProvisioningForm tenants={tenants} onProvision={onCreateUser} />
      </PageSection>
    </div>
  );

  const passwordResetView = (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <TenantRail tenants={tenants} focusedTenant={focusedTenant} onSelect={setSelectedTenantId} />
      <PageSection
        eyebrow="Access Recovery"
        title="Global password reset"
        description="Reset user credentials centrally without entering the tenant workspace."
      >
        <ResetPasswordForm tenants={tenants} />
      </PageSection>
    </div>
  );

  const contentByView = {
    superadmin: dashboardView,
    tenant_provision: tenantProvisionView,
    user_provision: userProvisionView,
    password_reset: passwordResetView,
    infra_health: infraView,
    financial_control: <PlatformAccounts tenants={tenants} />,
    subscription_mgmt: subscriptionView,
    ad_manager: <OfferManagement tenants={tenants} />,
  };

  return (
    <>
      <div className="space-y-6">
        {contentByView[viewMode] || dashboardView}
      </div>

      {governanceOpen && focusedTenant && (
        <FeatureManager
          tenant={focusedTenant}
          onClose={() => setGovernanceOpen(false)}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
}

export default SuperadminPage;









