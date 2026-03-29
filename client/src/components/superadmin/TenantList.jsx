import React from 'react';
import { Building2, Users, Globe, Shield, Activity, ChevronRight, Crown, Star, Zap } from 'lucide-react';

const TIER_CONFIG = {
  Enterprise: { color: '#4f46e5', bg: '#eef2ff', label: 'Enterprise', icon: Crown },
  Professional: { color: '#d97706', bg: '#fffbeb', label: 'Professional', icon: Star },
  Basic: { color: '#0891b2', bg: '#ecfeff', label: 'Basic', icon: Activity },
  Free: { color: '#7c3aed', bg: '#f5f3ff', label: 'Free', icon: Zap },
};

function TierBadge({ tier }) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.Basic;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function StatusDot({ status }) {
  const active = status === 'active';
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}
        style={active ? { boxShadow: '0 0 0 3px rgba(16,185,129,0.2)' } : {}} />
      <span className={`text-[11px] font-black uppercase tracking-wider ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
        {active ? 'Active' : status || 'Inactive'}
      </span>
    </div>
  );
}

export default function TenantList({ tenants = [], onSelect }) {
  return (
    <section className="clinical-card mb-8">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Building2 className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Hospital Nodes</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Facilities connected to platform · {tenants.length} registered</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="p-6">
        {tenants.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold">No tenants provisioned yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tenants.map((tenant, i) => {
              const initials = (tenant.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const tier = tenant.subscription_tier || 'Basic';
              const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.Basic;

              return (
                <div
                  key={tenant.id || i}
                  className="group flex items-center gap-5 p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 bg-white transition-all duration-200 cursor-pointer"
                  onClick={() => onSelect && onSelect(tenant)}
                >
                  {/* Avatar */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-black shrink-0 shadow-md"
                    style={{ background: `linear-gradient(135deg, ${tierCfg.color}, ${tierCfg.color}99)` }}
                  >
                    {initials}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1.5">
                      <h4 className="text-sm font-black text-slate-900 truncate">{tenant.name}</h4>
                      <TierBadge tier={tier} />
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      {tenant.subdomain && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                          <Globe className="w-3 h-3" />
                          {tenant.subdomain}.healthezee.app
                        </div>
                      )}
                      {tenant.contact_email && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Shield className="w-3 h-3" />
                          {tenant.contact_email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-8 shrink-0">
                    <div className="text-center">
                      <div className="text-xl font-black text-slate-900 tabular-nums leading-none">
                        {tenant.patient_count ?? 0}
                      </div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Patients</div>
                    </div>
                    <div className="text-center">
                      <StatusDot status={tenant.status} />
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Node Status</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[11px] font-bold text-slate-500 tabular-nums">
                        {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                      </div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Provisioned</div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-indigo-600 flex items-center justify-center transition-all ml-2 shrink-0">
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
