export default function AppointmentActions({ appointment, user, onStatus, onReschedule }) {
  if (user.role === 'Patient') {
    if (user.patientId !== appointment.patientId) {
      return null;
    }
    return (
      <div className="flex flex-wrap items-center justify-end gap-1">
        {['requested', 'scheduled'].includes(appointment.status) && (
          <button type="button" className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[10px] font-bold transition-colors border border-red-100" onClick={() => onStatus('cancelled')}>
            Cancel
          </button>
        )}
        {['requested', 'scheduled'].includes(appointment.status) && (
          <button type="button" className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-[10px] font-bold transition-colors border border-slate-200" onClick={onReschedule}>
            Reschedule
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-0.5">
      {appointment.status === 'requested' && (
        <button type="button" className="px-2 py-0.5 bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] rounded-md text-[9px] font-black uppercase tracking-tight transition-colors shadow-sm" onClick={() => onStatus('scheduled')}>
          Confirm
        </button>
      )}
      {appointment.status === 'scheduled' && (
        <button type="button" className="px-2 py-0.5 bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] rounded-md text-[9px] font-black uppercase tracking-tight transition-colors shadow-sm" onClick={() => onStatus('checked_in')}>
          Check-in
        </button>
      )}
      {appointment.status === 'checked_in' && (
        <button type="button" className="px-2 py-0.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md text-[9px] font-black uppercase tracking-tight transition-colors shadow-md animate-pulse" 
          onClick={() => onStatus('triaged')}>
          Triage (Vitals)
        </button>
      )}
      {['scheduled', 'checked_in'].includes(appointment.status) && (
        <button type="button" className="px-2 py-0.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md text-[9px] font-black uppercase tracking-tight transition-colors border border-emerald-100" onClick={() => onStatus('completed')}>
          Complete
        </button>
      )}
      {['requested', 'scheduled', 'checked_in'].includes(appointment.status) && (
        <button type="button" className="px-2 py-0.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-md text-[9px] font-black uppercase tracking-tight transition-colors border border-amber-100" onClick={() => onStatus('no_show')}>
          No-show
        </button>
      )}
      {['requested', 'scheduled', 'checked_in'].includes(appointment.status) && (
        <button type="button" className="px-2 py-0.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-[9px] font-black uppercase tracking-tight transition-colors border border-red-100" onClick={() => onStatus('cancelled')}>
          Cancel
        </button>
      )}
      {['requested', 'scheduled'].includes(appointment.status) && (
        <button type="button" className="px-2 py-0.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-md text-[9px] font-black uppercase tracking-tight transition-colors border border-slate-200" onClick={onReschedule}>
          Reschedule
        </button>
      )}
    </div>
  );
}
