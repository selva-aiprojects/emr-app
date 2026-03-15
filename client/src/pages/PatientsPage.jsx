import { useState } from 'react';
import PatientSearch from '../components/PatientSearch.jsx';

export default function PatientsPage({
  activeUser, session, patients, activePatient, activePatientId,
  setActivePatientId, onCreatePatient, onAddClinical, onPrint
}) {
  const [activeView, setActiveView] = useState('list'); // 'list' | 'register'
  const clinicalRecords = activePatient?.medicalHistory?.clinicalRecords || [];

  return (
    <div className="patients-intelligence-shard slide-up">
      <header className="mb-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Clinical Registry Management</h2>
            <p className="text-sm text-slate-500">Master Patient Index & Longitudinal Healthcare Records</p>
          </div>
          <div className="clinical-tab-bar">
            <button 
              className={`clinical-tab-item ${activeView === 'list' ? 'active' : ''}`}
              onClick={() => setActiveView('list')}
            >
              Master Registry
            </button>
            {activeUser.role !== 'Patient' && (
              <button 
                className={`clinical-tab-item ${activeView === 'register' ? 'active' : ''}`}
                onClick={() => setActiveView('register')}
              >
                Admission Protocol
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: REGISTRY & SEARCH */}
        {activeView === 'list' && (
          <aside className="col-span-4 space-y-6">
            <article className="card">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Identity Verification</h3>
              <PatientSearch
                tenantId={session?.tenantId}
                onSelect={(p) => setActivePatientId(p.id)}
                initialPatientId={activePatientId}
              />
            </article>

            <article className="card p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Recent Clinical Encounters</h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-50">
                {Array.isArray(patients) && patients.slice(0, 10).map(p => (
                  <button
                    key={p.id}
                    className={`w-full flex items-center gap-3 p-3 transition-all text-left overflow-hidden border-l-4 ${activePatientId === p.id ? 'bg-teal-50/40 border-teal-600' : 'border-transparent hover:bg-slate-50'}`}
                    onClick={() => setActivePatientId(p.id)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[12px] uppercase shrink-0 ${activePatientId === p.id ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {(p.firstName || 'P')[0]}
                    </div>
                    <div className="flex-1 min-width-0">
                      <div className={`text-[13px] font-bold tracking-tight truncate ${activePatientId === p.id ? 'text-teal-900' : 'text-slate-800'}`}>{p.firstName} {p.lastName}</div>
                      <div className="text-[9px] text-slate-400 font-extrabold tracking-widest uppercase">MRN-{p.mrn}</div>
                    </div>
                    {p.bloodGroup && (
                      <div className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white border border-slate-100 uppercase tracking-widest text-slate-500 shadow-sm">
                        {p.bloodGroup}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </article>
          </aside>
        )}

        {/* MAIN COLUMN: PROFILE OR ADMISSION */}
        <main className={`${activeView === 'list' ? 'col-span-8' : 'col-span-12'}`}>
          {activeView === 'register' ? (
            <article className="card max-w-4xl mx-auto border-t-4 border-teal-500">
              <header className="mb-8 border-b border-slate-100 pb-6">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Patient Admission Protocol</h3>
                <p className="text-sm text-slate-500">Standardized clinical intake for institutional registry</p>
              </header>

              <form className="space-y-4" onSubmit={onCreatePatient}>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-teal-600 tracking-widest">Identity & Demographics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400">First Name</label>
                        <input name="firstName" className="input-field" required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400">Surname</label>
                        <input name="lastName" className="input-field" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400">Date of Birth</label>
                        <input name="dob" type="date" className="input-field" required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400">Clinical Gender</label>
                        <select name="gender" className="input-field" required>
                          <option value="">Select...</option>
                          <option>Female</option>
                          <option>Male</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-teal-600 tracking-widest">Clinical Configuration</h4>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400">Blood Group</label>
                      <input name="bloodGroup" className="input-field" placeholder="ABO / Rh" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400">Primary Contact</label>
                      <input name="phone" className="input-field" placeholder="Emergency Mobile" required />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-8 border-t border-slate-100">
                  <button type="submit" className="btn btn-primary px-10 py-3 font-black uppercase tracking-widest">Finalize Admission</button>
                  <button type="button" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-6" onClick={() => setActiveView('list')}>Abort Protocol</button>
                </div>
              </form>
            </article>
          ) : activePatient ? (
            <div className="space-y-8">
              {/* PROFILE HEADER */}
              <header className="card flex-between bg-slate-900 border-none shadow-pro relative overflow-hidden p-8 group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full -mr-48 -mt-48 blur-3xl transition-all group-hover:scale-110"></div>
                <div className="flex items-center gap-8 relative z-10">
                  <div className="w-24 h-24 rounded-2xl bg-teal-600 flex items-center justify-center text-4xl font-black text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
                    {(activePatient.firstName || 'P')[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h2 className="text-3xl font-bold text-white tracking-tight">{activePatient.firstName} {activePatient.lastName}</h2>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 text-teal-400">MRN-{activePatient.mrn}</span>
                    </div>
                    <div className="flex items-center gap-6 text-[11px] text-white/40 font-black uppercase tracking-widest">
                      <span>Born: {new Date(activePatient.dob).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20"></span>
                      <span>Gender: {activePatient.gender}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20"></span>
                      <span>Coverage: {activePatient.insurance || 'Default Registry'}</span>
                    </div>
                  </div>
                </div>
                <button 
                  className="px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 hover:border-teal-500 transition-all shadow-lg relative z-10" 
                  onClick={() => onPrint('health-record')}
                >
                  Generate Abstract
                </button>
              </header>

              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8 space-y-8">
                  {/* CLINICAL JOURNAL */}
                  <article className="card p-0 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex-between bg-slate-50/20">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 tracking-tight">Clinical Journal</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Longitudinal Healthcare Event Sequential Ledger</p>
                      </div>
                      <span className="text-[9px] font-black uppercase px-3 py-1 bg-teal-50 text-teal-600 rounded-full border border-teal-100">{clinicalRecords.length} Clinical Nodes</span>
                    </div>

                    <div className="p-6">
                      {activeUser.role !== 'Patient' && (
                        <div className="mb-8 p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                          <form className="flex gap-1" onSubmit={onAddClinical}>
                            <select name="section" className="bg-white border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2 text-slate-600 focus:ring-0 w-36">
                              <option value="caseHistory">Observation</option>
                              <option value="medications">Prescription</option>
                              <option value="testReports">Lab Result</option>
                            </select>
                            <input name="text" className="bg-transparent border-none focus:ring-0 text-sm font-bold flex-1 px-4 placeholder:text-slate-400 placeholder:font-medium" placeholder="Capture clinical encounter findings..." required />
                            <button type="submit" className="bg-teal-600 text-white px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-colors shadow-lg shadow-teal-900/20">Commit</button>
                          </form>
                        </div>
                      )}

                      <div className="relative space-y-8 before:absolute before:left-4 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
                        {clinicalRecords.length > 0 ? (
                          clinicalRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((rec, idx) => (
                            <div key={idx} className="relative pl-12 slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
                              <div className="absolute left-3 w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-white top-1 shadow-[0_0_0_4px_rgba(20,184,166,0.1)]"></div>
                              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded text-[9px] font-black uppercase tracking-widest border border-teal-100">{rec.section}</span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(rec.created_at).toLocaleString()}</span>
                                </div>
                                <div className="text-sm font-medium text-slate-700 leading-relaxed">
                                  {rec.payload || rec.content}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10">
                            <p className="text-sm text-slate-400 italic">No clinical events identified in this registry shard.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                </div>

                <aside className="col-span-4 space-y-6">
                  <article className="card border-l-4 border-teal-500 group">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Serology Status</div>
                    <div className="text-4xl font-black text-slate-800 tracking-tighter group-hover:text-teal-600 transition-colors">{activePatient.bloodGroup || 'N/A'}</div>
                    <div className="text-[9px] font-black text-emerald-600 mt-2 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                      Verified Clinical Profile
                    </div>
                  </article>

                  <article className="card">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Risk Stratification</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                        <div className="text-[9px] font-black text-rose-700 uppercase tracking-widest mb-1.5">Allergy Matrix</div>
                        <div className="text-xs font-bold text-rose-900/70 leading-relaxed">
                          {activePatient.medicalHistory?.allergies || 'No high-risk allergies detected in master registry.'}
                        </div>
                      </div>
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                        <div className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1.5">Chronic Condition Index</div>
                        <div className="text-xs font-bold text-amber-900/70 leading-relaxed">
                          {activePatient.medicalHistory?.chronicConditions || 'Baseline physiological status identified.'}
                        </div>
                      </div>
                    </div>
                  </article>
                </aside>
              </div>
            </div>
          ) : (
            <article className="card h-full flex flex-col items-center justify-center py-32 text-center border-dashed border-2 border-slate-200 bg-slate-50/30">
              <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-300 mb-8">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">No Patient Selected</h3>
              <p className="text-sm text-slate-500 max-w-xs mt-3 leading-relaxed">Select a clinical identity from the master registry to initiate longitudinal record oversight and longitudinal event tracking.</p>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}


