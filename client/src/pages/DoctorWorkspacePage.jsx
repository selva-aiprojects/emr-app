import { useMemo, useState, useEffect } from 'react';
import { patientName } from '../utils/format.js';
import { useToast } from '../hooks/useToast.jsx';
import PatientPicker from '../components/PatientPicker.jsx';
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
  Pill,
  Search,
  Plus,
  ArrowRight,
  Zap,
  LayoutGrid,
  ClipboardList,
  FlaskConical
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
  activePatientId,
  onEmrWorkflowChange,
  onSetAppointmentStatus,
}) {
  const [filter, setFilter] = useState('today');
  const [isDutyOnline, setIsDutyOnline] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const { showToast } = useToast();

  const todayStr = new Date().toISOString().slice(0, 10);

  const myAppointments = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => new Date(a.start) - new Date(b.start));
    if (filter === 'today') {
      return sorted.filter(a => (a.start || '').slice(0, 10) === todayStr);
    }
    return sorted;
  }, [appointments, filter, todayStr]);

  const myPatients = useMemo(() => {
    const ids = new Set();
    appointments.forEach(a => ids.add(a.patientId || a.patient_id));
    encounters.forEach(e => ids.add(e.patientId || e.patient_id));
    ids.delete(undefined); ids.delete(null); ids.delete('');
    return patients.filter(p => ids.has(p.id));
  }, [appointments, encounters, patients]);

  const pendingCount = myAppointments.filter(a => ['scheduled', 'checked_in', 'triaged'].includes(a.status)).length;
  const completedToday = myAppointments.filter(a => a.status === 'completed' && (a.start || '').slice(0, 10) === todayStr).length;

  const handleQuickAction = (action) => {
    if (action.requiresPatient && !activePatientId) {
      setPendingAction(action);
      setShowPicker(true);
      showToast({ message: "Please select a patient to continue", type: "info" });
      return;
    }
    action.onClick();
  };

  const handlePatientSelect = (p) => {
    setActivePatientId?.(p.id);
    setShowPicker(false);
    if (pendingAction) {
      pendingAction.onClick();
      setPendingAction(null);
    }
  };

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? 'Good Morning' : greetHour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 animate-fade-in">
      <PatientPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        patients={patients}
        onSelect={handlePatientSelect}
      />

      <div className="bg-white border-b border-slate-200 px-8 py-6 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-slate-200">
                {(activeUser?.name || 'D').charAt(0)}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${isDutyOnline ? 'bg-emerald-500' : 'bg-slate-300'} shadow-sm`}></div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {greeting}, Dr. {activeUser?.name || 'Physician'}
                </h1>
                <button 
                  onClick={() => setIsDutyOnline(!isDutyOnline)}
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                    isDutyOnline ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDutyOnline ? 'On Duty' : 'Away'}
                </button>
              </div>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest flex items-center gap-2">
                <HeartPulse size={12} className="text-red-400" /> Clinical Workspace • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button
                onClick={() => {
                  onEmrWorkflowChange?.('dashboard');
                  setView('emr');
                }}
                className="flex items-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                <Stethoscope size={16} />
                Global EMR Access
              </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                <Clock size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Wait</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{pendingCount} <span className="text-xs font-bold text-slate-400">Patients</span></h3>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Today</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{completedToday} <span className="text-xs font-bold text-slate-400">Visits</span></h3>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                <Users size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Patients</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{myPatients.length}</h3>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">My Daily Schedule</h2>
                </div>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                {['today', 'all'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    {f === 'today' ? "Today" : 'Upcoming'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {myAppointments.length === 0 ? (
                <div className="py-16 text-center text-slate-400 uppercase font-black text-[10px] tracking-widest">
                  No appointments scheduled.
                </div>
              ) : (
                <div className="space-y-4">
                  {myAppointments.map((appt) => {
                    const pName = patientName(appt.patientId || appt.patient_id, patients) || 'Unknown Patient';
                    const timeStr = appt.start ? new Date(appt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                    const isUpcoming = ['scheduled', 'checked_in', 'triaged'].includes(appt.status);

                    return (
                      <div key={appt.id} className="flex items-center gap-6 p-4 rounded-3xl border border-slate-100 hover:bg-slate-50 transition-all">
                        <div className="min-w-[70px] text-center">
                          <span className="text-sm font-black text-slate-900">{timeStr}</span>
                        </div>
                        <div className="flex-1 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                            {pName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">{pName}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{appt.reason || 'Consultation'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${statusColor(appt.status)}`}>
                             {appt.status.replace('_', ' ')}
                           </span>
                           {isUpcoming && (
                             <button 
                                onClick={() => { setActivePatientId?.(appt.patientId || appt.patient_id); onEmrWorkflowChange?.('new-encounter'); setView('emr'); }}
                                className="p-2 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 transition-all"
                             >
                                <ChevronRight size={16} />
                             </button>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6">Quick Shortcuts</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Visit Notes', icon: ClipboardList, view: 'emr', color: 'bg-white/5 hover:bg-white/10' },
                { label: 'Lab Orders', icon: FlaskConical, view: 'lab', color: 'bg-white/5 hover:bg-white/10' },
                { label: 'Pharmacy', icon: Pill, view: 'pharmacy', color: 'bg-white/5 hover:bg-white/10' },
                { label: 'Registry', icon: Users, view: 'patients', color: 'bg-white/5 hover:bg-white/10' },
              ].map(action => (
                <button key={action.label} onClick={() => setView(action.view)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${action.color}`}>
                  <action.icon size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-center">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <header className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Patients</h3>
              <button onClick={() => setView('patients')} className="text-[9px] font-black text-indigo-600 uppercase hover:underline">View All</button>
            </header>
            <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-50">
              {myPatients.length === 0 ? (
                <div className="p-12 text-center text-[10px] font-black text-slate-300 uppercase">Empty</div>
              ) : (
                myPatients.slice(0, 10).map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer" onClick={() => { setActivePatientId?.(p.id); setView('emr'); }}>
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs">{(p.firstName || 'P').charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">{p.firstName} {p.lastName}</div>
                      <div className="text-[9px] text-slate-400 font-medium uppercase truncate">Active Record</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
