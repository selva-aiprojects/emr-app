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
  activePatientId, // Added from App.jsx if available
  onEmrWorkflowChange,
  onSetAppointmentStatus,
}) {
  const [filter, setFilter] = useState('today');
  const [isDutyOnline, setIsDutyOnline] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const { showToast } = useToast();

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

  const pendingCount = myAppointments.filter(a => ['scheduled', 'checked_in', 'triaged'].includes(a.status)).length;
  const completedToday = myAppointments.filter(a => a.status === 'completed' && (a.start || '').slice(0, 10) === today).length;

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 animate-fade-in">
      <PatientPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        patients={patients}
        onSelect={handlePatientSelect}
      />

      {/* TOP DECK: PERSONALIZED GREETING & STATUS */}
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
                  Dr. {activeUser?.name || 'Physician'}
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
                <HeartPulse size={12} className="text-red-400" /> Clinical Consultant • Oncology Department
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Workload</p>
                <div className="flex items-center gap-2 mt-1">
                   <div className="flex -space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200"></div>
                      ))}
                   </div>
                   <span className="text-xs font-black text-slate-900">+{pendingCount} Queue</span>
                </div>
             </div>
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
        {/* LEFT COLUMN: PRIMARY WORKFLOW */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* PERFORMANCE SNAPSHOT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                <Clock size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Wait</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{pendingCount} <span className="text-xs font-bold text-slate-400">Patients</span></h3>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Today</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{completedToday} <span className="text-xs font-bold text-slate-400">Visits</span></h3>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                <Activity size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">94% <span className="text-xs font-bold text-slate-400">Rating</span></h3>
            </div>
          </div>

          {/* SCHEDULE PANEL */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">My Daily Schedule</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Clinical Rounds & Appointments</p>
                </div>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                {['today', 'all'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {f === 'today' ? "Today" : 'Upcoming'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {myAppointments.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                    <Zap size={32} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">All Caught Up!</h4>
                  <p className="text-xs text-slate-400 font-medium max-w-[240px] mt-2">
                    {filter === 'today' 
                      ? "You don't have any more appointments scheduled for today." 
                      : "No upcoming appointments found in your clinical calendar."}
                  </p>
                  <button className="mt-6 px-5 py-2.5 rounded-xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                    Sync Calendar
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myAppointments.map((appt, idx) => {
                    const pName = patientName(appt.patientId || appt.patient_id, patients) || 'Unknown Patient';
                    const timeStr = appt.start ? new Date(appt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                    const isUpcoming = ['scheduled', 'checked_in', 'triaged'].includes(appt.status);

                    return (
                      <div
                        key={appt.id}
                        className="group relative flex items-center gap-6 p-4 rounded-3xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300"
                      >
                        <div className="flex flex-col items-center min-w-[70px]">
                          <span className="text-sm font-black text-slate-900 tabular-nums">{timeStr}</span>
                          <span className={`mt-1.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${
                            isUpcoming ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isUpcoming ? 'Upcoming' : 'Past'}
                          </span>
                        </div>

                        <div className="w-px h-12 bg-slate-100 group-hover:bg-blue-200 transition-colors" />

                        <div className="flex-1 min-w-0 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-sm group-hover:bg-white group-hover:shadow-sm transition-all uppercase">
                            {pName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-900 transition-colors">{pName}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                               <Activity size={10} className="text-blue-400" /> {appt.reason || 'Routine Consultation'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                           {isUpcoming && (
                             <button 
                                onClick={() => {
                                   setActivePatientId?.(appt.patientId || appt.patient_id);
                                   onEmrWorkflowChange?.('new-encounter');
                                   setView('emr');
                                }}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors"
                             >
                               Start Visit
                             </button>
                           )}
                           <button className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 shadow-sm">
                              <Plus size={16} />
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="bg-slate-50/50 p-4 border-t border-slate-100 text-center">
               <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                  Load Full Historical Log
               </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TOOLS & CONTEXT */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* QUICK WORK COMMANDS */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[32px] p-6 shadow-2xl shadow-slate-200">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6 flex items-center gap-2">
              <Zap size={12} className="text-amber-400" /> Strategic Shortcuts
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { 
                  label: 'Write Encounter Notes', 
                  sub: 'Start new clinical session',
                  icon: ClipboardList, 
                  requiresPatient: true,
                  onClick: () => {
                    onEmrWorkflowChange?.('new-encounter');
                    setView('emr');
                  }, 
                  color: 'bg-white/5 hover:bg-white/10 text-white border border-white/10' 
                },
                { 
                  label: 'Laboratory Orders', 
                  sub: 'Diagnostics & Pathology',
                  icon: FlaskConical, 
                  onClick: () => setView('lab'), 
                  color: 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20' 
                },
                { 
                  label: 'E-Prescriptions', 
                  sub: 'Medication management',
                  icon: Pill, 
                  onClick: () => setView('pharmacy'), 
                  color: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20' 
                },
                { 
                  label: 'My Schedule', 
                  sub: 'Availability & Slots',
                  icon: Calendar, 
                  onClick: () => setView('doctor_schedule'), 
                  color: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20' 
                },
                { 
                  label: 'Patient Registry', 
                  sub: 'Browse medical records',
                  icon: Users, 
                  onClick: () => setView('patients'), 
                  color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20' 
                },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action)}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all group ${action.color}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <action.icon size={20} />
                  </div>
                  <div className="text-left">
                    <span className="block text-[11px] font-black uppercase tracking-widest">{action.label}</span>
                    <span className="block text-[9px] font-medium text-white/40 uppercase tracking-tighter mt-0.5">{action.sub}</span>
                  </div>
                  <ArrowRight size={14} className="ml-auto opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* PATIENT CARE CONTEXT */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <header className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Focus</h3>
                <p className="text-sm font-black text-slate-900 mt-0.5">Recent Interaction</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                <Users size={16} />
              </div>
            </header>
            
            <div className="p-2">
               {myPatients.length === 0 ? (
                 <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mx-auto mb-3">
                       <User size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No assigned patients</p>
                 </div>
               ) : (
                 <div className="space-y-1">
                    {myPatients.slice(0, 5).map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setActivePatientId?.(p.id); setView('emr'); }}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-[10px] uppercase group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {(p.firstName || 'P').charAt(0)}{(p.lastName || '').charAt(0)}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">{p.firstName} {p.lastName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 flex items-center gap-1">
                            <ShieldCheck size={10} className="text-emerald-500" /> Clinical History
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                      </button>
                    ))}
                 </div>
               )}
            </div>
            
            <div className="p-4 bg-slate-50/50 border-t border-slate-100">
               <button 
                onClick={() => setView('patients')}
                className="w-full py-3 rounded-xl bg-white border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
               >
                 Browse Master Directory
               </button>
            </div>
          </div>
          
          {/* DAILY TIP/INSIGHT */}
          <div className="bg-blue-600 rounded-[32px] p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <ShieldCheck size={120} />
             </div>
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-4">Pro Insight</h4>
             <p className="text-sm font-bold leading-relaxed relative z-10">
               "Early documentation of vital trends improves clinical outcomes by 24% for Oncology patients."
             </p>
             <div className="mt-4 flex items-center gap-2 relative z-10">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                   <Zap size={10} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Clinical Protocol</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

