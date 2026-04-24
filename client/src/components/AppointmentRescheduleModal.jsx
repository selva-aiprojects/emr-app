import { useState } from 'react';
import { Calendar, Clock, X, ChevronRight, AlertCircle } from 'lucide-react';

export default function AppointmentRescheduleModal({ appointment, onClose, onConfirm, patients = [], providers = [] }) {
  const [start, setStart] = useState(appointment.start ? appointment.start.substring(0, 16) : '');
  const [end, setEnd] = useState(appointment.end ? appointment.end.substring(0, 16) : '');
  const [reason, setReason] = useState(appointment.reason || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get patient name safely
  const patient = patients.find(p => p.id === appointment.patientId || p.id === appointment.patient_id);
  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient';
  
  // Get provider name safely
  const provider = providers.find(p => p.id === appointment.providerId || p.id === appointment.provider_id);
  const providerName = provider ? provider.name : 'Doctor';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!start || !end) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm({
        id: appointment.id,
        start,
        end,
        reason
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to reschedule: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-slide-up">
        <header className="p-8 bg-slate-900 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-indigo-500 text-[9px] font-black uppercase tracking-widest rounded-md">Reschedule</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {appointment.id?.substring(0, 8)}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">{patientName}</h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">With {providerName} • {appointment.reason || 'General Consultation'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Calendar className="w-3 h-3 text-indigo-500" /> New Start Time
              </label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black tabular-nums text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Clock className="w-3 h-3 text-indigo-500" /> New End Time
              </label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black tabular-nums text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reason for Change (Optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Patient requested different time..."
                className="input-field h-[100px] py-4 bg-slate-50 border-none rounded-2xl font-medium text-slate-800 resize-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-tight">
              Adjusting this slot will update the doctor's calendar and trigger a notification to the patient.
            </p>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            >
              Discard Changes
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-[2] clinical-btn bg-slate-900 text-white rounded-2xl py-5 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : (
                <>
                  Confirm Shift <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
