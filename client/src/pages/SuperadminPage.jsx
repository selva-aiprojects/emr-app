import { useState, useEffect } from 'react';
import { api } from '../api.js';
import MetricCard from '../components/MetricCard.jsx';
import { currency } from '../utils/format.js';
import { exportToCSV } from '../utils/export.js';
import { 
  Building2, 
  Users, 
  UserCheck, 
  Terminal, 
  Activity,
  AlertCircle,
  Download
} from 'lucide-react';

function SuperadminPage({ superOverview: propOverview, tenants = [], onCreateTenant, onCreateUser }) {
  const superOverview = propOverview || {};
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    const header = ['Facility Name', 'Code', 'Tier', 'Users', 'Patients', 'Revenue ($)'];
    const rows = tenants.map(t => {
      const stats = superOverview?.tenants?.find(s => s.tenantId === t.id) || {};
      return [t.name, t.code, t.subscription_tier, stats.users || 0, stats.patients || 0, (stats.revenue || 0).toFixed(2)];
    });
    exportToCSV([header, ...rows], `MedFlow_Intelligence_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="intelligence-hub slide-up">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard
          label="Active Facilities"
          value={superOverview?.totals?.tenants ?? 0}
          icon={Building2}
          accent="blue"
          change="+2 This Month"
        />
        <MetricCard
          label="Engaged Practitioners"
          value={superOverview?.totals?.users ?? 0}
          icon={Users}
          accent="blue"
        />
        <MetricCard
          label="Clinical Population"
          value={superOverview?.totals?.patients ?? 0}
          icon={UserCheck}
          accent="blue"
          change="Steady Growth"
        />
        <MetricCard
          label="Network Operations"
          value={`${superOverview?.totals?.appointments ?? 0} Events`}
          icon={Terminal}
          accent="blue"
        />
      </section>

      {/* 2. CORE OVERSIGHT GRID */}
      <div className="grid grid-cols-12 gap-8 mb-10">
        {/* Facility Registry (Main 2/3) */}
        <div className="col-span-12 lg:col-span-8 clinical-card">
          <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Facility Registry</h3>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Real-time engagement across the healthcare network</p>
            </div>
            <button className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-all flex items-center gap-2 uppercase tracking-widest" onClick={handleExport}>
              Export Report
            </button>
          </header>
          
          <div className="p-8">
            {/* HEADERS */}
            <div className="grid grid-cols-12 px-4 py-3 bg-slate-50 rounded-lg mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
              <div className="col-span-6">Organization</div>
              <div className="col-span-3 text-center">Identity Tier</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            <div className="space-y-3">
              {tenants.map(tenant => (
                <div key={tenant.id} className="grid grid-cols-12 items-center p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all group shadow-sm">
                  <div className="col-span-6 flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center font-bold text-blue-600">
                      {tenant.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{tenant.name}</div>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{tenant.code}</div>
                    </div>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                      tenant.subscription_tier === 'Enterprise' 
                        ? 'bg-blue-50 text-blue-700 border-blue-100' 
                        : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {tenant.subscription_tier}
                    </span>
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/10">
                      Console
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Integrity (Side 1/3) */}
        <div className="clinical-card p-8 shadow-xl border-l-4 border-l-blue-600">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
               <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Network Integrity</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Global Service Audit</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-4 group hover:border-blue-200 transition-all">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5 group-hover:text-blue-600">Core Engine</div>
                <div className="text-xs font-bold text-slate-700">Participation Nominal</div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-4 group hover:border-blue-200 transition-all">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50"></div>
              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5 group-hover:text-blue-600">Load Balancer</div>
                <div className="text-xs font-bold text-slate-700">Latency: 14ms (Optimal)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ADMINISTRATIVE PROVISIONING GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <article className="clinical-card p-8">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900">Onboard Facility</h3>
            <p className="text-xs text-slate-500 font-medium">Provision a new clinical shard in the MedFlow cluster</p>
          </div>
          <form className="space-y-6" onSubmit={onCreateTenant}>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-2 block tracking-widest">Full Organization Name</label>
              <input name="name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none font-medium" placeholder="E.g. City General Hospital" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block tracking-widest">Shard Code</label>
                <input name="code" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-500 transition-all outline-none font-medium" placeholder="CGH" required />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block tracking-widest">Domain Prefix</label>
                <input name="subdomain" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-500 transition-all outline-none font-medium" placeholder="citygen" required />
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
              Initialize Organization Shard
            </button>
          </form>
        </article>

        <article className="clinical-card p-8">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900">Manage Authorization</h3>
            <p className="text-xs text-slate-500 font-medium">Issue secure access keys for clinical administrators</p>
          </div>
          <form className="space-y-6" onSubmit={onCreateUser}>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-2 block tracking-widest">Target Organization</label>
              <select name="tenantId" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium" required defaultValue="">
                <option value="" disabled>Select facility shard...</option>
                {Array.isArray(tenants) && tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block tracking-widest">Practitioner Name</label>
                <input name="name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium" placeholder="Full Name" required />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block tracking-widest">Access Role</label>
                <select name="role" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium" defaultValue="Admin">
                  <option>Admin</option>
                  <option>Doctor</option>
                  <option>Nurse</option>
                  <option>Billing</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
              Authorize Practitioner
            </button>
          </form>
        </article>
      </div>
    </div>
  );
}

export default SuperadminPage;
