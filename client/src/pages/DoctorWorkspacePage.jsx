import { useMemo, useState } from 'react';
import { patientName, userName } from '../utils/format.js';
import '../styles/critical-care.css';
import {
  Activity,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  HeartPulse,
  Stethoscope,
  User,
  Users,
  ShieldCheck,
  AlertCircle,
  Pill
} from 'lucide-react';

function statusColor(status) {
  return {
    scheduled: 'bg-blue-50 text-blue-700 border-blue-100',
    checked_in: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    triaged: 'bg-purple-50 text-purple-700 border-purple-100',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    cancelled: 'bg-red-50 text-red-600 border-red-100',
    'no-show': 'bg-slate-100 text-slate-500 border-slate-200',
  }[status] || 'bg-slate-100 text-slate-500 border-slate-200';
}

export default function DoctorWorkspacePage({
  activeUser,
  appointments = [],
  patients = [],
  encounters = [],
  users = [],
  setView,
  setActivePatientId,
  onSetAppointmentStatus,
}) {
  const [filter, setFilter] = useState('today'); // 'today' | 'all'

  const today = new Date().toISOString().slice(0, 10);

  const myAppointments = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => new Date(a.start) - new Date(b.start));
    if (filter === 'today') {
      return sorted.filter(a => (a.start || '').slice(0, 10) === today);
    }
    return sorted;
  }, [appointments, filter, today]);

  const myPatients = useMemo(() => {
    const ids = new Set();
    appointments.forEach(a => ids.add(a.patientId || a.patient_id));
    encounters.forEach(e => ids.add(e.patientId || e.patient_id));
    ids.delete(undefined); ids.delete(null); ids.delete('');
    return patients.filter(p => ids.has(p.id));
  }, [appointments, encounters, patients]);

  const pendingCount = myAppointments.filter(a => a.status === 'scheduled' || a.status === 'checked_in' || a.status === 'triaged').length;
  const completedToday = myAppointments.filter(a => a.status === 'completed').length;

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? 'Good Morning' : greetHour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="page-shell-premium animate-fade-in">
      {/* HEADER */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--clinical-secondary)] mb-1">
              {greeting}, Doctor
            </p>
            <h1 className="flex items-center gap-3 text-2xl font-black text-slate-900 leading-tight">
              {activeUser?.name || 'Physician'}
              <span className="text-[9px] bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-tighter font-black">
                Clinical Workspace
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('emr')}
              className="clinical-btn bg-slate-900 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl border-none"
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              Open EMR Chart
            </button>
          </div>
        </div>

        {/* STAT PILLS */}
        <div className="flex gap-4 mt-6 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-2xl">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-black text-blue-800">{pendingCount} Pending</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black text-emerald-800">{completedToday} Completed Today</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-black text-indigo-800">{myPatients.length} My Patients</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: MY SCHEDULE */}
        <section className="col-span-12 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--clinical-secondary)]" />
              My Schedule
            </h2>
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              {['today', 'all'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  {f === 'today' ? "Today's" : 'All Upcoming'}
                </button>
              ))}
            </div>
          </div>

          {myAppointments.length === 0 ? (
            <div className="clinical-card text-center py-16">
              <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
                {filter === 'today' ? 'No appointments scheduled for today' : 'No upcoming appointments'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myAppointments.map((appt, idx) => {
                const pName = patientName(appt.patientId || appt.patient_id, patients) || 'Unknown Patient';
                const timeStr = appt.start ? new Date(appt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                const dateStr = appt.start ? new Date(appt.start).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
                const isUpcoming = appt.status === 'scheduled' || appt.status === 'checked_in' || appt.status === 'triaged';

                return (
                  <div
                    key={appt.id}
                    className={`clinical-card !p-0 overflow-hidden transition-all hover:shadow-lg animate-fade-in ${
                      isUpcoming ? 'border-l-4 border-l-blue-500' : ' border-l-4 border-l-emerald-400'
                    }`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="flex items-center gap-5 p-5">
                      {/* TIME */}
                      <div className="text-center min-w-[60px]">
                        <div className="text-sm font-black text-slate-900 tabular-nums">{timeStr}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5">{dateStr}</div>
                      </div>

                      {/* DIVIDER */}
                      <div className="w-px h-10 bg-slate-100" />

                      {/* PATIENT INFO */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs">
                            {pName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900">{pName}</div>
                            <div className="text-[9px] font-medium text-slate-400 mt-0.5 uppercase tracking-widest">
                              {appt.reason || 'Clinical Encounter'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* STATUS + ACTIONS */}
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${statusColor(appt.status)}`}>
                          {(appt.status || 'scheduled').replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => {
                            setActivePatientId?.(appt.patientId || appt.patient_id);
                            setView('emr');
                          }}
                          className="p-2 rounded-xl bg-slate-900 text-white hover:bg-[var(--clinical-secondary)] transition-all"
                          title="Open Clinical Chart"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* QUICK STATUS UPDATE */}
                    {isUpcoming && onSetAppointmentStatus && (
                      <div className="flex gap-2 px-5 pb-4">
                        {appt.status === 'scheduled' && (
                          <button
                            onClick={() => onSetAppointmentStatus(appt.id, 'checked_in')}
                            className="text-[9px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-all"
                          >
                            Mark Arrived
                          </button>
                        )}
                        {(appt.status === 'checked_in' || appt.status === 'triaged') && (
                          <button
                            onClick={() => onSetAppointmentStatus(appt.id, 'completed')}
                            className="text-[9px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-all"
                          >
                            Complete Visit
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActivePatientId?.(appt.patientId || appt.patient_id);
                            setView('emr');
                          }}
                          className="text-[9px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100 transition-all flex items-center gap-1"
                        >
                          <Stethoscope className="w-3 h-3" /> Write Notes
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RIGHT: MY PATIENTS + QUICK ACTIONS */}
        <aside className="col-span-12 lg:col-span-5 space-y-6">
          {/* QUICK ACTIONS */}
          <div className="clinical-card !bg-slate-900 border-none text-white">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Quick Clinical Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Write EMR Notes', icon: FileText, view: 'emr', color: 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300' },
                { label: 'Lab Results', icon: Activity, view: 'lab', color: 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300' },
                { label: 'Prescriptions', icon: Pill, view: 'pharmacy', color: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300' },
                { label: 'My Patients', icon: Users, view: 'patients', color: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300' },
              ].map(action => (
                <button
                  key={action.view}
                  onClick={() => setView(action.view)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${action.color}`}
                >
                  <action.icon className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* MY PATIENTS */}
          <div className="clinical-card !p-0 overflow-hidden">
            <header className="p-5 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">My Patients</h3>
                <p className="text-sm font-black text-slate-900 mt-0.5">{myPatients.length} Active</p>
              </div>
              <button
                onClick={() => setView('patients')}
                className="text-[9px] font-black text-[var(--clinical-secondary)] uppercase tracking-widest flex items-center gap-1 hover:underline"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </header>
            <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-50">
              {myPatients.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-8 h-8 text-slate-100 mx-auto mb-3" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No assigned patients yet</p>
                </div>
              ) : (
                myPatients.slice(0, 10).map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-all cursor-pointer group animate-fade-in"
                    style={{ animationDelay: `${idx * 25}ms` }}
                    onClick={() => { setActivePatientId?.(p.id); setView('emr'); }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--clinical-secondary)] transition-colors">
                      {(p.firstName || 'P').charAt(0)}{(p.lastName || '').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">{p.firstName} {p.lastName}</div>
                      <div className="text-[9px] text-slate-400 font-medium uppercase tracking-widest truncate mt-0.5 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" /> Active Profile
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[var(--clinical-secondary)] transition-colors" />
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
