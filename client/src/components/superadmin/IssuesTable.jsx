import React from 'react';
import { EmptyState } from '../ui/index.jsx';
import { ShieldCheck } from 'lucide-react';

export default function IssuesTable({ issues }) {
  return (
    <article className="clinical-card mb-8">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
         <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Issues Reported</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Infrastructure fault reports</p>
         </div>
      </div>
      <div className="premium-table-container">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Created</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {issues.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <EmptyState 
                    title="No system faults identified" 
                    subtitle="Platform infrastructure nodes are reporting nominal status. No active issues detected."
                    icon={ShieldCheck}
                  />
                </td>
              </tr>
            ) : issues.map((iss, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td><div className="font-black text-slate-900">{iss.tenant}</div></td>
                <td><div className="text-[11px] font-medium text-slate-700">{iss.title}</div></td>
                <td>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${iss.severity === 'critical' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                    {iss.severity}
                  </span>
                </td>
                <td><span className="text-[10px] font-bold text-slate-500 uppercase">{iss.status}</span></td>
                <td><div className="text-[10px] text-slate-500">{iss.created}</div></td>
                <td><div className="text-[10px] text-slate-500">{iss.updated}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
