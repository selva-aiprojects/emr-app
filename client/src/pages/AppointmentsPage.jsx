import { useEffect, useState } from 'react';
import PatientSearch from '../components/PatientSearch.jsx';
import AppointmentActions from '../components/AppointmentActions.jsx';
import { patientName, userName } from '../utils/format.js';
import '../styles/critical-care.css';
import { 
  Calendar, 
  Clock, 
  Users, 
  Activity, 
  UserPlus, 
  ShieldCheck, 
  Clock3,
  ChevronRight,
  Plus
} from 'lucide-react';

export default function AppointmentsPage({
  activeUser, session, patients, providers, walkins, appointments, users,
  setView, setActivePatientId, onCreateAppointment, onCreateWalkin,
  onSelfAppointment, onConvertWalkin, onSetAppointmentStatus, onReschedule
}) {
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'walkins'
  const isPatient = activeUser.role === 'Patient';
  const isDoctor = activeUser.role === 'Doctor';

  useEffect(() => {
    if (isDoctor && activeTab === 'walkins') {
      setActiveTab('appointments');
    }
  }, [isDoctor, activeTab]);

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="flex items-center gap-3">
              {isDoctor ? 'My Appointment Schedule' : 'Appointments & Scheduling'}
              <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">
                {isDoctor ? 'Doctor View' : 'Reception Desk'}
              </span>
           </h1>
           <p className="dim-label">
             {isDoctor
               ? 'Your scheduled consultations and patient encounters.'
               : `Manage hospital appointments and walk-in patient flow for ${session?.tenantName || 'Authorized Facility'}.`}
           </p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-blue-500" /> System Online • Reception Active
           </p>
        </div>
        <div className="flex bg-white shadow-sm p-1.5 rounded-2xl border border-slate-200 gap-1 w-fit">
          <button 
            className={`clinical-btn !min-h-[44px] px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'appointments' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar className="w-3.5 h-3.5 mr-2" /> {isDoctor ? 'Book Slot' : 'Appointments'}
          </button>
          {!isPatient && !isDoctor && (
            <button 
              className={`clinical-btn !min-h-[44px] px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'walkins' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
              onClick={() => setActiveTab('walkins')}
            >
              <Users className="w-3.5 h-3.5 mr-2" /> Reception Queue
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* MAIN WORKFLOW: BOOKING FORMS */}
        <main className="col-span-12 lg:col-span-8 space-y-8">
          {activeTab === 'appointments' ? (
            <article className="clinical-card">
              <header className="mb-10 text-center lg:text-left">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest text-lg">
                    {isPatient ? 'Secure Slot Reservation' : 'Clinical Encounter Booking'}
                 </h3>
                 <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                    {isPatient ? 'Consultation Window Selection' : 'Scheduled Medical Interaction Node'}
                 </p>
              </header>

              <form className="space-y-10" onSubmit={isPatient ? onSelfAppointment : onCreateAppointment}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    {!isPatient && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Step 1 / Patient Selection</label>
                        <div className="p-1 bg-slate-50 border border-slate-100 rounded-2xl">
                           <PatientSearch tenantId={session?.tenantId} />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Step 2 / Select Doctor</label>
                      <select name="providerId" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800" required>
                        <option value="">Select Doctor...</option>
                        {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Start Time</label>
                        <input name="start" type="datetime-local" className="input-field py-4 bg-slate-50 border-none rounded-2xl font-black tabular-nums" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">End Time</label>
                        <input name="end" type="datetime-local" className="input-field py-4 bg-slate-50 border-none rounded-2xl font-black tabular-nums" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reason for Visit</label>
                      <input name="reason" className="input-field py-5 bg-slate-50 border-none rounded-2xl" placeholder="Reason for consultation..." required />
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-50">
                  <button type="submit" className="clinical-btn bg-slate-900 text-white w-full py-6 text-xs shadow-2xl hover:bg-slate-800 transition-all rounded-2xl font-black tracking-[0.2em]">
                    {isPatient ? 'TEST BOOK' : 'BOOK APPOINTMENT'}
                  </button>
                </div>
              </form>
            </article>
          ) : (
            <article className="clinical-card">
              <header className="mb-10 text-center lg:text-left">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest text-lg">Walk-in Registration</h3>
                 <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Add Patient to Waiting list</p>
              </header>

              <form className="space-y-10" onSubmit={onCreateWalkin}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patient Name</label>
                      <input name="name" className="input-field py-4 bg-slate-50 border-none rounded-2xl" placeholder="Full Patient Name" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mobile Number</label>
                      <input name="phone" className="input-field py-4 bg-slate-50 border-none rounded-2xl" placeholder="Phone Number" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reason for Visit</label>
                    <textarea name="reason" className="input-field h-[148px] py-5 bg-slate-50 border-none rounded-2xl resize-none font-medium" placeholder="Symptoms or reason..." required />
                  </div>
                </div>
                <div className="pt-10 border-t border-slate-50">
                  <button type="submit" className="clinical-btn bg-emerald-600 text-white px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all border-none">
                     Add to Queue
                  </button>
                </div>
              </form>
            </article>
          )}
        </main>

        {/* MONITORING PILLAR: LEDGER & QUEUE */}
        <aside className="col-span-12 lg:col-span-4 space-y-8">
          <section className="clinical-card !p-0 overflow-hidden">
            <header className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-900">
               <div>
                  <h3 className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em]">Encounter Ledger</h3>
                  <p className="text-xs font-black text-white mt-1 tabular-nums">{appointments.length} Slots Locked</p>
               </div>
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30">
                  <Clock3 className="w-5 h-5" />
               </div>
            </header>
            
            <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-50 scrollbar-hide">
              {appointments.length === 0 ? (
                <div className="p-16 text-center">
                   <Clock className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No appointments scheduled.</p>
                </div>
              ) : (
                appointments.sort((a, b) => new Date(a.start) - new Date(b.start)).map((a, idx) => (
                  <div key={a.id} className="p-6 hover:bg-slate-50 transition-all group border-l-4 border-transparent hover:border-indigo-500 animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                    <div className="flex items-start gap-4">
                      <div className="text-center min-w-[64px]">
                        <div className="text-xs font-black text-slate-900 tabular-nums">{new Date(a.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-tighter">{new Date(a.start).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-black text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer truncate" onClick={() => { setActivePatientId(a.patientId); setView('patients'); }}>
                          {patientName(a.patientId, patients)}
                        </div>
                        <div className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest flex items-center gap-1.5">
                           <Activity className="w-2.5 h-2.5 opacity-50" /> WITH {userName(a.providerId, users)}
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                           {a.status === 'checked_in' && <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded text-[9px] font-black uppercase tracking-widest border border-sky-100">ARRIVED</span>}
                           {a.status === 'triaged' && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm animate-pulse">TRIAGED (VITALS CAPTURED)</span>}
                           {a.status === 'completed' && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest border border-emerald-100">ENCOUNTERED</span>}
                           <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                             a.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                             a.status === 'scheduled' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                             a.status === 'checked_in' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-[0_4px_12px_rgba(99,102,241,0.1)]' :
                             a.status === 'triaged' ? 'bg-purple-50 text-purple-600 border-purple-100 shadow-[0_4px_12px_rgba(124,58,237,0.1)]' : // Added triaged status
                             'bg-slate-50 text-slate-500 border-slate-100'
                           }`}>{a.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end">
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

          {!isPatient && !isDoctor && (
            <section className="clinical-card !p-0 overflow-hidden border-l-4 border-l-amber-500">
              <header className="p-6 border-b border-slate-50 flex items-center justify-between">
                 <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Walk-in Queue</h3>
                    <p className="text-sm font-black text-slate-900 mt-1 tabular-nums">{walkins.length} Waiting Patients</p>
                 </div>
                 <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                 </div>
              </header>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50">
                {walkins.length === 0 ? (
                  <div className="p-12 text-center">
                     <Users className="w-8 h-8 text-slate-100 mx-auto mb-4 opacity-30" />
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No patients waiting.</p>
                  </div>
                ) : (
                  walkins.map((w, idx) => (
                  <div key={w.id} className="p-5 flex items-center gap-4 hover:bg-slate-50 transition-all group animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">
                      {(w.name || 'P')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-slate-900 truncate">{w.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 truncate mt-0.5 uppercase tracking-tighter">{w.reason}</div>
                    </div>
                    {w.status !== 'converted' ? (
                      <button onClick={() => onConvertWalkin(w.id)} className="clinical-btn bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white px-5 !min-h-[36px] text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border-none">ADMIT</button>
                    ) : (
                      <span className="text-[9px] font-black text-slate-300 px-4 py-1.5 bg-slate-50 rounded-lg border border-slate-100 tracking-widest">LOGGED</span>
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
