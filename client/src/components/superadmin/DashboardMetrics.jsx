import React from 'react';
import { Server, Stethoscope, Users, LifeBuoy } from 'lucide-react';

export default function DashboardMetrics({ tenants, doctors, patients, tickets }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <div className="bg-white rounded-xl p-5 border-l-4 border-emerald-500 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Tenants</span>
          <Server className="w-4 h-4 text-emerald-500" />
        </div>
        <span className="text-3xl font-black text-slate-800 tabular-nums mt-3">{tenants}</span>
        <p className="text-[10px] font-black text-emerald-600 mt-2 uppercase tracking-tight">Platform Scalability Stable</p>
      </div>

      <div className="bg-white rounded-xl p-5 border-l-4 border-blue-500 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Doctors</span>
          <Stethoscope className="w-4 h-4 text-blue-500" />
        </div>
        <span className="text-3xl font-black text-slate-800 tabular-nums mt-3">{doctors}</span>
        <p className="text-[10px] font-black text-blue-600 mt-2 uppercase tracking-tight">Aggregate Clinical Capacity</p>
      </div>

      <div className="bg-white rounded-xl p-5 border-l-4 border-rose-500 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Patients</span>
          <Users className="w-4 h-4 text-rose-500" />
        </div>
        <span className="text-3xl font-black text-slate-800 tabular-nums mt-3">{patients}</span>
        <p className="text-[10px] font-black text-rose-600 mt-2 uppercase tracking-tight">No Row-Level PHI Exposed</p>
      </div>

      <div className="bg-white rounded-xl p-5 border-l-4 border-amber-500 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Pending Tickets</span>
          <LifeBuoy className="w-4 h-4 text-amber-500" />
        </div>
        <span className="text-3xl font-black text-slate-800 tabular-nums mt-3">{tickets}</span>
        <p className="text-[10px] font-black text-amber-600 mt-2 uppercase tracking-tight">ETA Tracking Enabled</p>
      </div>
    </section>
  );
}
