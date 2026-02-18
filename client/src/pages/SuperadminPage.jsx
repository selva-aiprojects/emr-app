import MetricCard from '../components/MetricCard.jsx';
import { currency } from '../utils/format.js';
import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function SuperadminPage({ superOverview = {}, tenants = [], onCreateTenant, onCreateUser }) {
  const [killSwitches, setKillSwitches] = useState({});
  const [featureFlags, setFeatureFlags] = useState({});
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch kill switches and feature flags
  useEffect(() => {
    fetchKillSwitches();
  }, []);

  const fetchKillSwitches = async () => {
    try {
      const response = await api.get('/admin/kill-switches');
      setKillSwitches(response.data || {});
    } catch (error) {
      console.error('Error fetching kill switches:', error);
    }
  };

  const fetchTenantFeatures = async (tenantId) => {
    try {
      const response = await api.get(`/tenants/${tenantId}/features`);
      setFeatureFlags(response.data || {});
      setSelectedTenant(tenantId);
    } catch (error) {
      console.error('Error fetching tenant features:', error);
    }
  };

  const toggleKillSwitch = async (featureFlag, enabled) => {
    setLoading(true);
    try {
      await api.post('/admin/kill-switches', {
        featureFlag,
        enabled,
        reason: enabled ? 'Manual enable via admin panel' : 'Manual disable via admin panel'
      });

      setKillSwitches(prev => ({
        ...prev,
        [featureFlag]: enabled
      }));

      // Refresh tenant features if a tenant is selected
      if (selectedTenant) {
        fetchTenantFeatures(selectedTenant);
      }
    } catch (error) {
      console.error('Error toggling kill switch:', error);
      alert('Failed to update kill switch');
    } finally {
      setLoading(false);
    }
  };

  const updateTenantTier = async (tenantId, tier) => {
    setLoading(true);
    try {
      await api.patch(`/tenants/${tenantId}/settings`, {
        // Note: This would need to be implemented in the backend
        subscriptionTier: tier
      });

      alert(`Tenant updated to ${tier} tier`);
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error updating tenant tier:', error);
      alert('Failed to update tenant tier');
    } finally {
      setLoading(false);
    }
  };

  const getTierBadgeColor = (tier) => {
    switch (tier) {
      case 'Enterprise': return '#10b981';
      case 'Professional': return '#3b82f6';
      case 'Basic': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getFeatureDisplayName = (flag) => {
    const names = {
      'permission-core_engine-access': 'Core EMR Engine',
      'permission-hr_payroll-access': 'HR & Payroll',
      'permission-accounts-access': 'Accounts & Billing',
      'permission-customer_support-access': 'Customer Support'
    };
    return names[flag] || flag;
  };
  return (
    <section className="view super-view">
      {/* Analytics Section */}
      <div className="section-header">
        <div className="header-info">
          <h3>Platform Analytics</h3>
          <p>Real-time system-wide monitoring across all healthcare facilities.</p>
        </div>
      </div>

      <div className="grid-4 cards">
        <MetricCard label="Total Tenants" value={superOverview?.totals?.tenants || 0} variant="blue" />
        <MetricCard label="Active Users" value={superOverview?.totals?.users || 0} variant="amber" />
        <MetricCard label="Registered Patients" value={superOverview?.totals?.patients || 0} variant="rose" />
        <MetricCard label="Overall Appointments" value={superOverview?.totals?.appointments || 0} variant="violet" />
      </div>

      <div className="grid-3">
        {/* Tenant Management */}
        <div className="card-column">
          <article className="panel premium-glass">
            <div className="panel-header">
              <div className="icon-badge primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
              </div>
              <h4>Tenant Registry</h4>
            </div>
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Facility</th>
                    <th>Tier</th>
                    <th>Users</th>
                    <th>Revenue</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(superOverview?.tenants || []).map((t) => (
                    <tr key={t.tenantId}>
                      <td>
                        <div className="tenant-cell">
                          <span className="tenant-name">{t.tenantName}</span>
                          <span className="tenant-subdomain">{t.subdomain}.medflow.io</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="tier-badge"
                          style={{ backgroundColor: getTierBadgeColor(t.subscriptionTier || 'Basic') }}
                        >
                          {t.subscriptionTier || 'Basic'}
                        </span>
                      </td>
                      <td><span className="count-pill">{t.users}</span></td>
                      <td><span className="yield-text">{currency(t.revenue)}</span></td>
                      <td>
                        <button
                          className="action-btn"
                          onClick={() => fetchTenantFeatures(t.tenantId)}
                        >
                          View Features
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        {/* Feature Flag Management */}
        <div className="card-column">
          <article className="panel premium-glass">
            <div className="panel-header">
              <div className="icon-badge danger">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4m0 4h.01M5 20h14a2 2 0 0 0 1.84-2.75L13.74 4a2 2 0 0 0-3.5 0L3.16 17.25A2 2 0 0 0 5 20z"></path></svg>
              </div>
              <h4>Global Kill Switches</h4>
            </div>
            <div className="kill-switches">
              {Object.entries(killSwitches).map(([flag, enabled]) => (
                <div key={flag} className="kill-switch-item">
                  <div className="switch-info">
                    <div className="feature-name">{getFeatureDisplayName(flag)}</div>
                    <div className="feature-flag">{flag}</div>
                  </div>
                  <div className="switch-control">
                    <button
                      className={`kill-switch-btn ${enabled ? 'active' : 'inactive'}`}
                      onClick={() => toggleKillSwitch(flag, !enabled)}
                      disabled={loading}
                    >
                      {enabled ? 'DISABLED' : 'ENABLED'}
                    </button>
                    {enabled && <span className="kill-warning">⚠️ ACTIVE</span>}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* Tenant Feature Status */}
        <div className="card-column">
          <article className="panel premium-glass">
            <div className="panel-header">
              <div className="icon-badge success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h4>Feature Status {selectedTenant && `- Tenant ${selectedTenant}`}</h4>
            </div>
            {selectedTenant ? (
              <div className="feature-status">
                {Object.entries(featureFlags).map(([flag, status]) => (
                  <div key={flag} className="feature-item">
                    <div className="feature-info">
                      <div className="feature-name">{getFeatureDisplayName(flag)}</div>
                      <div className="feature-status-badges">
                        <span className={`status-badge ${status.enabled ? 'enabled' : 'disabled'}`}>
                          {status.enabled ? '✓ ENABLED' : '✗ DISABLED'}
                        </span>
                        {status.killSwitchActive && (
                          <span className="status-badge kill-switch">⚠️ KILLED</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-selection">
                <p>Select a tenant to view their feature status</p>
              </div>
            )}
          </article>
        </div>
      </div>

      <div className="grid-2-1">
        {/* Administration Actions */}
        <div className="action-column">
          <article className="panel premium-glass accent-panel">
            <div className="panel-header">
              <h4>Onboard New Facility</h4>
            </div>
            <form className="admin-form" onSubmit={onCreateTenant}>
              <div className="form-group">
                <label>Facility Name</label>
                <input name="name" placeholder="E.g. City General Hospital" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Code</label>
                  <input name="code" placeholder="SCH" required />
                </div>
                <div className="form-group">
                  <label>Subdomain</label>
                  <input name="subdomain" placeholder="citygen" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subscription Tier</label>
                  <select name="subscriptionTier" defaultValue="Basic">
                    <option value="Basic">Basic</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Primary Brand</label>
                  <input name="primaryColor" type="color" defaultValue="#10b981" />
                </div>
              </div>
              <div className="form-group">
                <label>Accent</label>
                <input name="accentColor" type="color" defaultValue="#3b82f6" />
              </div>
              <button type="submit" className="primary-btn full-width">Provision Tenant</button>
            </form>
          </article>

          <article className="panel premium-glass secondary-panel">
            <div className="panel-header">
              <h4>System Administrative Access</h4>
            </div>
            <form className="admin-form" onSubmit={onCreateUser}>
              <div className="form-group">
                <label>Assigned Organization</label>
                <select name="tenantId" required>
                  <option value="" disabled selected>Select facility...</option>
                  {Array.isArray(tenants) && tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input name="name" placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input name="email" type="email" placeholder="john@hospital.com" required />
              </div>
              <div className="form-group">
                <label>System Role</label>
                <select name="role">
                  <option>Admin</option>
                  <option>Doctor</option>
                  <option>Nurse</option>
                  <option>Front Office</option>
                  <option>Billing</option>
                  <option>Inventory</option>
                  <option>Patient</option>
                </select>
              </div>
              <button type="submit" className="secondary-btn full-width">Generate Access</button>
            </form>
          </article>
        </div>
      </div>

    </section>
  );
}
