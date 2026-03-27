import React from 'react';

export default function TenantList({ tenants, onSelect }) {
  return (
    <article className="clinical-card mb-8">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
         <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Tenants</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Facilities connected to platform</p>
         </div>
      </div>
      <div className="premium-table-container">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Domain</th>
              <th>Tier</th>
              <th>Patients</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tenants.map((tenant, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td><div className="font-black text-slate-900">{tenant.name}</div></td>
                <td><span className="text-[11px] font-mono text-slate-500">{tenant.domain}</span></td>
                <td>
                   <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                     tenant.subscription_tier === 'Enterprise' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                     tenant.subscription_tier === 'Professional' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                     tenant.subscription_tier === 'Free' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                     'bg-slate-50 text-slate-600 border-slate-200'
                   }`}>
                     {tenant.subscription_tier || 'Basic'}
                   </span>
                 </td>
                 <td>
                    <div className="flex flex-col">
                       <span className="text-[12px] font-black text-slate-900">{tenant.patient_count || 0}</span>
                       <span className="text-[9px] font-medium text-slate-400 -mt-0.5 tracking-tight">Active Nodes</span>
                    </div>
                 </td>
                 <td>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${tenant.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {tenant.status}
                  </span>
                </td>
                <td><div className="text-[10px] text-slate-500">{tenant.created}</div></td>
                <td>
                  <button 
                    className="p-2 px-3 rounded-lg bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm" 
                    onClick={() => onSelect(tenant)}
                  >
                    Manage Features
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
