import { useState } from 'react';
import PatientSearch from '../components/PatientSearch.jsx';

export default function PatientsPage({
  activeUser, session, patients, activePatient, activePatientId,
  setActivePatientId, onCreatePatient, onAddClinical, onPrint
}) {
  const [activeView, setActiveView] = useState('list'); // 'list' | 'register'
  const clinicalRecords = activePatient?.medicalHistory?.clinicalRecords || [];

  return (
    <div className="page-shell-premium">
      <div className="action-bar-premium">
        <div className="panel-title-group">
          <h2 className="panel-title-text">Clinical Registry Management</h2>
          <p className="panel-subtitle-text">Master Patient Index & Records</p>
        </div>
        <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200 gap-1">
          <button 
            className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === 'list' ? 'bg-[var(--primary)] shadow-md shadow-[var(--primary)]/20 text-white' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveView('list')}
          >
            Master Registry
          </button>
          {activeUser.role !== 'Patient' && (
            <button 
              className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === 'register' ? 'bg-[var(--primary)] shadow-md shadow-[var(--primary)]/20 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveView('register')}
            >
              Admission Protocol
            </button>
          )}
        </div>
      </div>

      <div className="grid-workspace">
        {/* LEFT COLUMN: REGISTRY & SEARCH */}
        {activeView === 'list' && (
          <aside className="col-span-4 space-y-6">
            <article className="premium-panel p-6">
              <h3 className="panel-subtitle-text mb-4">Identity Verification</h3>
              <PatientSearch
                tenantId={session?.tenantId}
                onSelect={(p) => setActivePatientId(p.id)}
                initialPatientId={activePatientId}
              />
            </article>

            <article className="premium-panel">
              <div className="panel-header-standard">
                <h3 className="panel-subtitle-text">Recent Clinical Encounters</h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-50">
                {Array.isArray(patients) && patients.slice(0, 10).map(p => (
                  <button
                    key={p.id}
                    className={`w-full flex items-center gap-3 p-4 transition-all text-left border-l-4 ${activePatientId === p.id ? 'bg-primary-soft/30 border-[var(--primary)]' : 'border-transparent hover:bg-slate-50'}`}
                    onClick={() => setActivePatientId(p.id)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${activePatientId === p.id ? 'bg-[var(--primary)] text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {(p.firstName || 'P')[0]}
                    </div>
                    <div className="flex-1 min-width-0">
                      <div className={`text-sm font-bold truncate ${activePatientId === p.id ? 'text-[var(--primary)]' : 'text-slate-800'}`}>{p.firstName} {p.lastName}</div>
                      <div className="text-xs text-slate-400 font-bold tracking-wider">MRN-{p.mrn}</div>
                    </div>
                    {p.bloodGroup && (
                      <div className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white border border-slate-100 text-slate-500 shadow-sm">
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
            <article className="premium-panel max-w-4xl mx-auto">
              <div className="panel-header-standard">
                <div className="panel-title-group">
                  <h3 className="panel-title-text">Patient Admission Protocol</h3>
                  <p className="panel-subtitle-text">Clinical Intake Registry</p>
                </div>
              </div>

              <form className="p-8 space-y-6" onSubmit={onCreatePatient}>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="panel-subtitle-text text-[var(--primary)]">Identity & Demographics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-400">First Name</label>
                        <input name="firstName" className="input-field" required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-400">Surname</label>
                        <input name="lastName" className="input-field" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-400">Date of Birth</label>
                        <input name="dob" type="date" className="input-field" required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-400">Clinical Gender</label>
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
                    <h4 className="panel-subtitle-text text-[var(--primary)]">Clinical Configuration</h4>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-400">Blood Group</label>
                      <input name="bloodGroup" className="input-field" placeholder="ABO / Rh" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-400">Primary Contact</label>
                      <input name="phone" className="input-field" placeholder="Emergency Mobile" required />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-8 border-t border-slate-100">
                  <button type="submit" className="btn-primary px-10 py-3 text-sm">Finalize Admission</button>
                  <button type="button" className="text-xs font-bold uppercase tracking-widest text-slate-400 px-6 hover:text-slate-600 transition-colors" onClick={() => setActiveView('list')}>Abort Protocol</button>
                </div>
              </form>
            </article>
          ) : activePatient ? (
            <div className="space-y-8">
              {/* PROFILE HEADER */}
              <header className="rounded-2xl flex items-center justify-between bg-slate-900 border-none relative overflow-hidden p-6 group shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/20 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:scale-110"></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-[var(--primary)] flex items-center justify-center text-2xl font-bold text-white shadow-lg transition-transform">
                    {(activePatient.firstName || 'P')[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold text-white tracking-tight">{activePatient.firstName} {activePatient.lastName}</h2>
                      <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 text-[var(--primary-soft)]">MRN-{activePatient.mrn}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-white/60 font-bold uppercase tracking-widest">
                      <span>DOB: {new Date(activePatient.dob).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-white/30"></span>
                      <span>Gender: {activePatient.gender}</span>
                      <span className="w-1 h-1 rounded-full bg-white/30"></span>
                      <span>{activePatient.insurance || 'Default Registry'}</span>
                    </div>
                  </div>
                </div>
                <button 
                  className="px-5 py-2 bg-white/5 border border-white/10 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--primary)] hover:border-[var(--primary)] transition-all shadow-md relative z-10" 
                  onClick={() => onPrint('health-record')}
                >
                  Generate Abstract
                </button>
              </header>

              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8 space-y-8">
                  {/* CLINICAL JOURNAL */}
                  <article className="premium-panel">
                    <div className="panel-header-standard">
                      <div className="panel-title-group">
                        <h3 className="panel-title-text">Clinical Journal</h3>
                        <p className="panel-subtitle-text">Longitudinal Healthcare Ledger</p>
                      </div>
                      <span className="text-xs font-bold uppercase px-3 py-1 bg-primary-soft text-[var(--primary)] rounded-full">{clinicalRecords.length} Nodes</span>
                    </div>

                    <div className="p-4">
                      {activeUser.role !== 'Patient' && (
                        <div className="mb-6 bg-slate-50/80 rounded-xl border border-slate-200">
                          <form className="flex items-center" onSubmit={onAddClinical}>
                            <select name="section" className="bg-transparent border-r border-slate-200 text-xs font-bold px-4 py-3 text-slate-600 focus:outline-none focus:ring-0 w-36 cursor-pointer">
                              <option value="caseHistory">Observation</option>
                              <option value="medications">Prescription</option>
                              <option value="testReports">Lab Result</option>
                            </select>
                            <input name="text" className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm flex-1 px-4 py-3 placeholder-slate-400" placeholder="Capture findings..." required />
                            <div className="pr-1.5 flex shrink-0">
                              <button type="submit" className="btn-primary px-4 py-2 text-[11px] font-bold uppercase rounded-lg">Commit</button>
                            </div>
                          </form>
                        </div>
                      )}

                      <div className="relative space-y-4 before:absolute before:left-3 before:top-1 before:bottom-0 before:w-0.5 before:bg-slate-100">
                        {clinicalRecords.length > 0 ? (
                          clinicalRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((rec, idx) => (
                            <div key={idx} className="relative pl-8 slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
                              <div className="absolute left-2.5 w-1.5 h-1.5 rounded-full bg-[var(--primary)] border border-white top-1"></div>
                              <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="px-1.5 py-0.5 bg-primary-soft text-[var(--primary)] rounded text-xs font-bold uppercase tracking-widest">{rec.section}</span>
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(rec.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                </div>
                                <div className="text-xs font-medium text-slate-700 leading-relaxed">
                                  {rec.payload || rec.content}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-xs text-slate-400 italic">No events recorded.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                </div>

                <aside className="col-span-4 space-y-6">
                  <article className="premium-panel p-6 border-l-4 border-[var(--primary)] group">
                    <div className="panel-subtitle-text mb-1">Serology Status</div>
                    <div className="text-4xl font-bold text-slate-800 tracking-tighter group-hover:text-[var(--primary)] transition-colors">{activePatient.bloodGroup || 'N/A'}</div>
                    <div className="text-xs font-bold text-emerald-600 mt-2 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Verified Profile
                    </div>
                  </article>

                  <article className="premium-panel p-6">
                    <h4 className="panel-subtitle-text mb-6">Risk Stratification</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-rose-50 border border-secondary-soft rounded-2xl">
                        <div className="text-xs font-bold text-rose-700 uppercase tracking-widest mb-1.5">Allergy Matrix</div>
                        <div className="text-xs font-medium text-rose-900/70 leading-relaxed">
                          {activePatient.medicalHistory?.allergies || 'No allergies detected.'}
                        </div>
                      </div>
                      <div className="p-4 bg-amber-50 border border-warning-soft rounded-2xl">
                        <div className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1.5">Chronic Condition Index</div>
                        <div className="text-xs font-medium text-amber-900/70 leading-relaxed">
                          {activePatient.medicalHistory?.chronicConditions || 'Baseline status.'}
                        </div>
                      </div>
                    </div>
                  </article>
                </aside>
              </div>
            </div>
          ) : (
            <article className="premium-panel h-full flex flex-col items-center justify-center py-32 text-center border-dashed border-2 bg-slate-50/10">
              <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-200 mb-8">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">No Patient Selected</h3>
              <p className="text-sm text-slate-500 max-w-xs mt-3 leading-relaxed">Select a record from the registry to initiate clinical oversight.</p>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}


