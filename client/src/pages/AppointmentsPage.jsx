import { useState } from 'react';
import PatientSearch from '../components/PatientSearch.jsx';
import AppointmentActions from '../components/AppointmentActions.jsx';
import { patientName, userName } from '../utils/format.js';

export default function AppointmentsPage({
  activeUser, session, patients, providers, walkins, appointments, users,
  setView, setActivePatientId, onCreateAppointment, onCreateWalkin,
  onSelfAppointment, onConvertWalkin, onSetAppointmentStatus, onReschedule
}) {
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'walkins'
  const isPatient = activeUser.role === 'Patient';

  return (
    <div className="page-shell-premium">
      <div className="action-bar-premium">
        <div className="panel-title-group">
          <h2 className="panel-title-text">Scheduling Intelligence</h2>
          <p className="panel-subtitle-text">Resource Co-ordination & Flow</p>
        </div>
        <div className="premium-tab-bar">
          <button 
            className={`premium-tab-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            Clinical Schedule
          </button>
          {!isPatient && (
            <button 
              className={`premium-tab-item ${activeTab === 'walkins' ? 'active' : ''}`}
              onClick={() => setActiveTab('walkins')}
            >
              Reception Queue
            </button>
          )}
        </div>
      </div>

      <div className="grid-workspace">
        {/* LEFT COLUMN: BOOKING FORMS */}
        <main className="col-span-8 space-y-8">
          {activeTab === 'appointments' ? (
            <article className="premium-panel">
              <div className="panel-header-standard">
                <div className="panel-title-group">
                  <h3 className="panel-title-text">{isPatient ? 'Secure Slot Reservation' : 'Clinical Encounter Booking'}</h3>
                  <p className="panel-subtitle-text">{isPatient ? 'Consultation Window Selection' : 'Scheduled Medical Interaction'}</p>
                </div>
              </div>

              <form className="p-10 space-y-8" onSubmit={isPatient ? onSelfAppointment : onCreateAppointment}>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {!isPatient && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Identity</label>
                        <PatientSearch tenantId={session?.tenantId} />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Specialist</label>
                      <select name="providerId" className="input-field h-[54px]" required>
                        <option value="">Select Practitioner...</option>
                        {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commencement</label>
                        <input name="start" type="datetime-local" className="input-field py-4" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conclusion</label>
                        <input name="end" type="datetime-local" className="input-field py-4" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Encounter Objective</label>
                      <input name="reason" className="input-field py-4" placeholder="Immediate clinical requirement..." required />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <button type="submit" className="btn-primary w-full py-4 text-xs uppercase tracking-widest shadow-lg">
                    {isPatient ? 'Submit Reservation' : 'Authorize Entry'}
                  </button>
                </div>
              </form>
            </article>
          ) : (
            <article className="premium-panel">
              <div className="panel-header-standard">
                <div className="panel-title-group">
                  <h3 className="panel-title-text">Direct Reception Entry</h3>
                  <p className="panel-subtitle-text">Unscheduled Queue Placement</p>
                </div>
              </div>

              <form className="p-10 space-y-8" onSubmit={onCreateWalkin}>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="panel-subtitle-text">Full Name</label>
                      <input name="name" className="input-field" placeholder="Patient Identity" required />
                    </div>
                    <div className="space-y-2">
                      <label className="panel-subtitle-text">Contact Number</label>
                      <input name="phone" className="input-field" placeholder="Emergency Mobile" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="panel-subtitle-text mb-1 block">Objective</label>
                    <textarea name="reason" className="input-field h-[104px] py-4" placeholder="Immediate requirement..." required />
                  </div>
                </div>
                <div className="pt-8 border-t border-slate-100">
                  <button type="submit" className="btn btn-primary px-10 rounded-xl">Initialize Queue Status</button>
                </div>
              </form>
            </article>
          )}
        </main>

        {/* RIGHT COLUMN: LEDGER & QUEUE */}
        <aside className="col-span-4 space-y-8">
          <section className="premium-panel">
            <div className="panel-header-standard">
              <h3 className="panel-subtitle-text">Encounter Ledger</h3>
              <span className="text-xs font-bold text-[var(--primary)]">{appointments.length} Slots</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-50">
              {appointments.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm italic">Ledger empty</div>
              ) : (
                appointments.sort((a, b) => new Date(a.start) - new Date(b.start)).map((a, idx) => (
                  <div key={a.id} className={`p-4 hover:bg-slate-50 transition-all slide-up ${a.status} border-b border-slate-50/50`} style={{ animationDelay: `${idx * 40}ms` }}>
                    <div className="flex items-start gap-4">
                      <div className="text-center min-w-[56px] pt-1">
                        <div className="text-[11px] font-black text-slate-900 leading-none">{new Date(a.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">{new Date(a.start).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 hover:text-[var(--primary)] cursor-pointer truncate tracking-tight" onClick={() => { setActivePatientId(a.patientId); setView('patients'); }}>
                          {patientName(a.patientId, patients)}
                        </div>
                        <div className="text-[9px] font-black text-slate-400 uppercase mt-0.5 tracking-widest">WITH {userName(a.providerId, users)}</div>
                        <div className="mt-2 flex items-center gap-2">
                           <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                             a.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                             a.status === 'scheduled' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                             a.status === 'checked_in' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-[0_0_8px_rgba(99,102,241,0.2)]' :
                             'bg-slate-50 text-slate-500 border-slate-100'
                           }`}>{a.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-50 flex justify-end">
                      <AppointmentActions
                        appointment={a}
                        user={activeUser}
                        onStatus={(status) => onSetAppointmentStatus(a.id, status)}
                        onReschedule={() => onReschedule(a)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {!isPatient && (
            <section className="premium-panel border-l-4 border-l-warning">
              <div className="panel-header-standard">
                <h3 className="panel-subtitle-text">Reception Queue</h3>
                <span className="text-xs font-bold text-warning">{walkins.length} Active</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50">
                {walkins.length === 0 ? (
                  <div className="p-8 text-center text-slate-300 text-xs italic">Queue cleared</div>
                ) : (
                  walkins.map((w, idx) => (
                  <div key={w.id} className="p-4 flex items-center gap-4 slide-up hover:bg-slate-50 border-b border-slate-50/50" style={{ animationDelay: `${idx * 40}ms` }}>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs border border-amber-100 shadow-sm">
                      {(w.name || 'P')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate tracking-tight">{w.name}</div>
                      <div className="text-[10px] font-medium text-slate-500 truncate mt-0.5">{w.reason}</div>
                    </div>
                    {w.status !== 'converted' ? (
                      <button onClick={() => onConvertWalkin(w.id)} className="btn-primary px-3 py-1.5 text-[10px] uppercase tracking-widest shadow-md">ADMIT</button>
                    ) : (
                      <span className="text-[10px] font-black text-slate-300 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">LOGGED</span>
                    )}
                  </div>
                  ))
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}


