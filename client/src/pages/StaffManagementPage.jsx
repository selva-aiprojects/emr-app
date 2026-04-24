
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  UserPlus, 
  Briefcase, 
  Search, 
  Filter, 
  Download, 
  Cloud, 
  AlertCircle,
  CheckCircle,
  Archive,
  ArrowRight
} from 'lucide-react';

export default function StaffManagementPage({ tenant, employees = [] }) {
  const [activeTab, setActiveTab] = useState('offers');
  const [searchTerm, setSearchTerm] = useState('');

  const offers = [
    { name: 'Dr. Sarah Jenkins', role: 'Radiologist', date: '2024-04-10', status: 'Accepted' },
    { name: 'Marcus Wong', role: 'Head of Lab', date: '2024-04-11', status: 'Pending Signature' },
    { name: 'Elena Rodriguez', role: 'Senior Nurse', date: '2024-04-12', status: 'Under Review' },
  ];

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10">
        <div>
           <h1 className="page-title-rich flex items-center gap-3 text-white">
              Staff Governance & Workforce
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black backdrop-blur-md">Custodian Node</span>
           </h1>
           <p className="dim-label">Institutional custodianship for {tenant?.name}. Manage workforce contracts and documentation.</p>
           <p className="text-xs font-black text-white/60 uppercase tracking-widest mt-4 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" /> Administrative Logic Active • Workforce Secure
           </p>
        </div>

        <div className="flex flex-col items-end gap-3">
           <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-sm gap-1 w-fit">
            {[
              { id: 'offers', label: 'Offers', icon: UserPlus },
              { id: 'docs', label: 'Docs', icon: FileText },
              { id: 'benefits', label: 'Benefits', icon: Archive },
            ].map(tab => (
              <button 
                key={tab.id}
                className={`clinical-btn !min-h-[40px] px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-3.5 h-3.5 mr-2" /> {tab.label}
              </button>
            ))}
          </div>
          <button className="px-8 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:bg-slate-50 inline-flex items-center gap-2">
              <UserPlus size={14} /> New Offer Deployment
          </button>
        </div>
      </header>

      <main className="space-y-10">
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="action-bar-premium">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  placeholder="Find offer by candidate name..." 
                  className="input-field pl-6 pr-12 py-4 text-sm font-bold bg-white"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                 <Filter size={16} className="text-slate-400" />
                 <select className="input-field py-4 px-6 bg-white w-48 text-[10px] font-black uppercase tracking-widest">
                    <option>All Statuses</option>
                    <option>Accepted</option>
                    <option>Pending</option>
                 </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {offers.map((offer, idx) => (
                 <div key={idx} className="glass-panel p-8 border hover:border-slate-300 transition-all group relative">
                    <div className="flex items-start justify-between mb-8">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                             {offer.name[0]}
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{offer.name}</h4>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{offer.role}</p>
                          </div>
                       </div>
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${offer.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          {offer.status}
                       </span>
                    </div>

                    <div className="flex items-center justify-between py-6 border-t border-slate-50">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sent Date</span>
                          <span className="text-xs font-black text-slate-700">{offer.date}</span>
                       </div>
                       <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#0077B6] hover:gap-3 transition-all">
                          View Documents <ArrowRight size={14} />
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <article className="glass-panel p-0 overflow-hidden">
             <header className="px-10 py-8 border-b border-slate-100 bg-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Personnel Documentation Vault</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional employee records and compliance files</p>
                </div>
                <div className="flex items-center gap-3">
                   <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all text-slate-600">
                      <Download size={16} /> Batch Download
                   </button>
                   <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-4 bg-slate-900 rounded-2xl text-white shadow-xl">
                      <Cloud size={16} /> Upload New Block
                   </button>
                </div>
             </header>

             <div className="premium-table-container !mt-0 !border-0 rounded-none">
                <table className="premium-table">
                   <thead>
                      <tr>
                         <th>Employee Shard</th>
                         <th>Document Type</th>
                         <th>Expirations</th>
                         <th>Operational Status</th>
                         <th style={{ textAlign: 'right' }}>Vault Actions</th>
                      </tr>
                   </thead>
                   <tbody>
                      {employees.map((emp, idx) => (
                        <tr key={idx}>
                           <td>
                              <div className="text-xs font-black text-slate-900">{emp.name}</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase">{emp.code}</div>
                           </td>
                           <td>
                              <div className="flex items-center gap-2">
                                 <FileText size={14} className="text-blue-500" />
                                 <span className="text-xs font-bold text-slate-600">ID Proof, Credentials</span>
                              </div>
                           </td>
                           <td><span className="text-xs font-black text-slate-900 tabular-nums">2027-04-11</span></td>
                           <td>
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Validated</span>
                           </td>
                           <td style={{ textAlign: 'right' }}>
                              <button className="px-5 py-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Retrieve</button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </article>
        )}

        {activeTab === 'benefits' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-panel p-10 bg-slate-900 text-white border-none relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full -mr-40 -mt-40 blur-3xl animate-pulse" />
                 <Briefcase size={40} className="text-indigo-400 mb-8" />
                 <h4 className="text-xl font-black uppercase tracking-tight mb-4 text-white">Gratuity Reserve Shard</h4>
                 <p className="text-xs text-slate-400 leading-relaxed font-bold uppercase tracking-tighter mb-10 max-w-sm">
                   Allocated institutional funds for statutory employee gratuity based on deployment tenure and clinical contribution.
                 </p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tabular-nums">₹2.4M</span>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Allocated</span>
                 </div>
              </div>

              <div className="glass-panel p-10 border-2 border-slate-50 flex flex-col justify-between">
                 <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Retirement Liability Planning</h4>
                    <div className="space-y-4">
                       {[
                         { label: 'Long-term Benefit Provision', value: '45%' },
                         { label: 'Statutory Compliance Level', value: '100%' },
                         { label: 'Gratuity Eligibility List', value: `${employees.length} Members` }
                       ].map((item, i) => (
                         <div key={i} className="flex justify-between items-center py-4 border-b border-slate-50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                            <span className="text-xs font-black text-slate-900">{item.value}</span>
                         </div>
                       ))}
                    </div>
                 </div>
                 <button className="w-full mt-10 py-5 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Generate Liability Report</button>
              </div>
           </div>
        )}

        {activeTab === 'compliance' && (
           <div className="glass-panel p-10 bg-red-50 border-red-100 flex items-start gap-8">
              <div className="w-16 h-16 rounded-3xl bg-white text-red-500 flex items-center justify-center shadow-lg shrink-0">
                 <AlertCircle size={32} />
              </div>
              <div>
                 <h4 className="text-base font-black text-red-900 uppercase tracking-widest mb-3">Institutional Workforce Integrity</h4>
                 <p className="text-[11px] font-bold text-red-700/60 leading-relaxed uppercase tracking-tighter mb-8 max-w-2xl">
                   This module monitors all workforce security clearances and clinical credentialing mandates.
                   Non-compliant nodes will be flagged for immediate administrative review.
                 </p>
                 <div className="flex gap-4">
                    <button className="px-10 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20">Initiate Policy Audit</button>
                    <button className="px-10 py-4 bg-white border border-red-200 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Compliance Status</button>
                 </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}
