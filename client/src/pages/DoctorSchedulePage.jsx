import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { 
  Calendar, 
  Clock, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Clock3,
  Coffee,
  Moon,
  Sun,
  ShieldCheck
} from 'lucide-react';
import '../styles/critical-care.css';

const DAYS = [
  { id: 0, name: 'Sunday' },
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
];

export default function DoctorSchedulePage({ activeUser, session }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [activeDay, setActiveDay] = useState(1); // Monday by default

  // Mock initial data - in real app, fetch from API
  useEffect(() => {
    // Simulated fetch
    setSchedules([
      { id: 1, day_of_week: 1, start_time: '09:00', end_time: '13:00', type: 'Clinical' },
      { id: 2, day_of_week: 1, start_time: '14:00', end_time: '17:00', type: 'Clinical' },
      { id: 3, day_of_week: 2, start_time: '09:00', end_time: '13:00', type: 'Surgery' },
      { id: 4, day_of_week: 3, start_time: '09:00', end_time: '17:00', type: 'Clinical' },
      { id: 5, day_of_week: 4, start_time: '10:00', end_time: '15:00', type: 'OPD' },
      { id: 6, day_of_week: 5, start_time: '09:00', end_time: '13:00', type: 'Clinical' },
    ]);
  }, []);

  const daySchedules = useMemo(() => 
    schedules.filter(s => s.day_of_week === activeDay), 
    [schedules, activeDay]
  );

  const handleAddSlot = () => {
    const newSlot = {
      id: Date.now(),
      day_of_week: activeDay,
      start_time: '09:00',
      end_time: '10:00',
      type: 'Clinical'
    };
    setSchedules([...schedules, newSlot]);
  };

  const handleDeleteSlot = (id) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const handleUpdateSlot = (id, field, value) => {
    setSchedules(schedules.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // API call would go here
      await new Promise(r => setTimeout(r, 1000));
      showToast({
        title: 'Schedule Updated',
        message: 'Your availability has been synchronized across the platform.',
        type: 'success'
      });
    } catch (error) {
      showToast({
        title: 'Update Failed',
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-8">
        <div>
          <h1 className="page-title-rich flex items-center gap-3">
            My Availability
            <span className="text-[10px] bg-blue-500 text-white px-3 py-1 rounded-full border border-blue-400 uppercase tracking-widest font-black">Clinical Scheduling</span>
          </h1>
          <p className="dim-label">Manage your daily consultation blocks and hospital presence.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-3 px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
        >
          {loading ? <Clock className="animate-spin" size={16} /> : <Save size={16} />}
          Sync Schedule
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-8">
        {/* DAY SELECTOR */}
        <div className="space-y-2">
          <div className="p-4 bg-white/50 border border-slate-100 rounded-[24px] mb-6">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Weekly Cycle</h3>
             <div className="space-y-1">
                {DAYS.map((day) => {
                  const hasSlots = schedules.some(s => s.day_of_week === day.id);
                  return (
                    <button
                      key={day.id}
                      onClick={() => setActiveDay(day.id)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                        activeDay === day.id 
                          ? 'bg-slate-900 text-white shadow-lg' 
                          : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-100'
                      }`}
                    >
                      <span className="text-sm font-black">{day.name}</span>
                      {hasSlots && (
                        <div className={`w-2 h-2 rounded-full ${activeDay === day.id ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                      )}
                    </button>
                  );
                })}
             </div>
          </div>

          <div className="p-6 bg-blue-600 rounded-[32px] text-white shadow-xl shadow-blue-100">
             <Clock3 className="w-10 h-10 mb-4 opacity-50" />
             <h4 className="text-sm font-black mb-2">Slot Logic</h4>
             <p className="text-xs font-medium leading-relaxed opacity-80">
               Availability defined here directly gates the Patient Appointment module. 
               Ensure you leave gaps for emergencies and research.
             </p>
          </div>
        </div>

        {/* SLOTS EDITOR */}
        <div className="space-y-6">
           <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
              <header className="p-6 border-b border-slate-50 flex items-center justify-between">
                 <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                       Time Slots for {DAYS.find(d => d.id === activeDay).name}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Define your clinical presence blocks</p>
                 </div>
                 <button 
                  onClick={handleAddSlot}
                  className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                 >
                    <Plus size={20} />
                 </button>
              </header>

              <div className="flex-1 p-6">
                 {daySchedules.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20">
                       <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                          <Moon size={32} />
                       </div>
                       <h4 className="text-sm font-black text-slate-900">No Consultation Hours</h4>
                       <p className="text-xs text-slate-400 font-medium max-w-[240px] mt-2">
                          You haven't defined any availability for {DAYS.find(d => d.id === activeDay).name}. 
                          Patients won't be able to book appointments.
                       </p>
                       <button 
                        onClick={handleAddSlot}
                        className="mt-6 px-6 py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg"
                       >
                          Add Morning Slot
                       </button>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {daySchedules.map((slot) => (
                          <div key={slot.id} className="group relative p-5 rounded-[28px] border border-slate-100 bg-slate-50/30 hover:border-blue-200 hover:bg-white transition-all shadow-sm hover:shadow-md">
                             <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                   {slot.start_time < '12:00' ? <Sun className="w-4 h-4 text-amber-500" /> : <Coffee className="w-4 h-4 text-blue-500" />}
                                   <select 
                                      value={slot.type}
                                      onChange={(e) => handleUpdateSlot(slot.id, 'type', e.target.value)}
                                      className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none cursor-pointer hover:text-blue-600"
                                   >
                                      <option>Clinical</option>
                                      <option>Surgery</option>
                                      <option>OPD</option>
                                      <option>Research</option>
                                   </select>
                                </div>
                                <button 
                                 onClick={() => handleDeleteSlot(slot.id)}
                                 className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                >
                                   <Trash2 size={14} />
                                </button>
                             </div>

                             <div className="flex items-center gap-4">
                                <div className="flex-1">
                                   <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">Start</label>
                                   <input 
                                      type="time" 
                                      value={slot.start_time}
                                      onChange={(e) => handleUpdateSlot(slot.id, 'start_time', e.target.value)}
                                      className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                   />
                                </div>
                                <div className="pt-4 text-slate-300 font-bold">→</div>
                                <div className="flex-1">
                                   <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">End</label>
                                   <input 
                                      type="time" 
                                      value={slot.end_time}
                                      onChange={(e) => handleUpdateSlot(slot.id, 'end_time', e.target.value)}
                                      className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                   />
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 flex-shrink-0">
                       <ShieldCheck size={20} />
                    </div>
                    <div>
                       <h4 className="text-xs font-black text-slate-900">Policy Synchronization</h4>
                       <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                          Changes to your availability will take effect immediately for all new bookings. 
                          Existing appointments will not be affected.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
