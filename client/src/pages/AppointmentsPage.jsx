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
    <div className="appointments-workspace slide-up">
      {/* 1. HEADER ORCHESTRATION */}
      <div className="flex-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Scheduling Intelligence</h2>
          <p className="text-sm text-slate-500">Resource Co-ordination & Flow Management</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'appointments' ? 'bg-blue-600 shadow-lg shadow-blue-600/20 text-white' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('appointments')}
          >
            Clinical Schedule
          </button>
          {!isPatient && (
            <button 
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'walkins' ? 'bg-blue-600 shadow-lg shadow-blue-600/20 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('walkins')}
            >
              Reception Queue
            </button>
          )}
        </div>
      </div>

      <div className="grid-3 gap-8 items-start">
        {/* LEFT COLUMN: BOOKING FORMS */}
        <main className="col-span-2 space-y-8" style={{ gridColumn: 'span 2' }}>
          {activeTab === 'appointments' ? (
            <article className="clinical-card p-10">
              <div className="mb-8 border-b border-slate-100 pb-6">
                <h3 className="text-xl font-bold">{isPatient ? 'Secure Slot Reservation' : 'Clinical Encounter Booking'}</h3>
                <p className="text-sm text-slate-500">{isPatient ? 'Select your preferred consultation window' : 'Authorize a scheduled medical interaction'}</p>
              </div>

              <form className="space-y-8" onSubmit={isPatient ? onSelfAppointment : onCreateAppointment}>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {!isPatient && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Patient Identity</label>
                        <PatientSearch tenantId={session?.tenantId} />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">Clinical Specialist</label>
                      <select name="providerId" className="input-field" required>
                        <option value="">Select Practitioner...</option>
                        {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Commencement</label>
                        <input name="start" type="datetime-local" className="input-field" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Conclusion</label>
                        <input name="end" type="datetime-local" className="input-field" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">Encounter Objective</label>
                      <input name="reason" className="input-field" placeholder="Primary complaint / objective..." required />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]">
                    {isPatient ? 'Submit Reservation' : 'Authorize Entry'}
                  </button>
                </div>
              </form>
            </article>
          ) : (
            <article className="clinical-card p-10">
              <div className="mb-8 border-b border-slate-100 pb-6">
                <h3 className="text-xl font-bold">Direct Reception Entry</h3>
                <p className="text-sm text-slate-500">Unscheduled queue placement for facility arrivals</p>
              </div>

              <form className="space-y-8" onSubmit={onCreateWalkin}>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">Full Name</label>
                      <input name="name" className="input-field" placeholder="Patient Legal Identity" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">Contact Number</label>
                      <input name="phone" className="input-field" placeholder="Emergency verification" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Objective</label>
                    <textarea name="reason" className="input-field h-[104px] py-4" placeholder="Immediate clinical requirement..." required />
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100">
                  <button type="submit" className="btn btn-primary px-10">Initialize Queue Status</button>
                </div>
              </form>
            </article>
          )}
        </main>

        {/* RIGHT COLUMN: LEDGER & QUEUE */}
        <aside className="space-y-8">
          <section className="clinical-card p-0 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-100 flex-between">
              <h3 className="text-xs font-black uppercase text-slate-400">Encounter Ledger</h3>
              <span className="text-[10px] font-bold text-teal-600">{appointments.length} Slots</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-50">
              {appointments.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm italic">Ledger empty for today</div>
              ) : (
                appointments.sort((a, b) => new Date(a.start) - new Date(b.start)).map((a, idx) => (
                  <div key={a.id} className={`p-4 hover:bg-slate-50 transition-all slide-up ${a.status}`} style={{ animationDelay: `${idx * 40}ms` }}>
                    <div className="flex gap-4">
                      <div className="text-center min-w-[60px]">
                        <div className="text-sm font-black text-slate-800">{new Date(a.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase">{new Date(a.start).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-800 hover:text-teal-600 cursor-pointer" onClick={() => { setActivePatientId(a.patientId); setView('patients'); }}>
                          {patientName(a.patientId, patients)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">with {userName(a.providerId, users)}</div>
                        <div className="mt-2 text-[10px] font-black bg-slate-100 w-max px-1.5 py-0.5 rounded uppercase tracking-wider text-slate-500">{a.status}</div>
                      </div>
                      <div className="flex items-center">
                        <AppointmentActions
                          appointment={a}
                          user={activeUser}
                          onStatus={(status) => onSetAppointmentStatus(a.id, status)}
                          onReschedule={() => onReschedule(a)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {!isPatient && (
            <section className="clinical-card p-0 overflow-hidden border-l-4 border-l-amber-500 shadow-xl">
              <div className="p-4 border-b border-slate-100 flex-between">
                <h3 className="text-xs font-black uppercase text-slate-400">Reception Queue</h3>
                <span className="text-[10px] font-bold text-amber-600">{walkins.length} Active</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50">
                {walkins.length === 0 ? (
                  <div className="p-8 text-center text-slate-300 text-xs italic">Reception area cleared</div>
                ) : (
                  walkins.map((w, idx) => (
                    <div key={w.id} className="p-4 flex items-center gap-3 slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
                      <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                        {(w.name || 'P')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate">{w.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{w.reason}</div>
                      </div>
                      {w.status !== 'converted' ? (
                        <button onClick={() => onConvertWalkin(w.id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-widest transition-all">ADMIT</button>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 px-2 py-1 bg-slate-50 rounded">LOGGED</span>
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


