import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Search, ChevronDown, UserCircle, Calendar, Activity, ChevronRight } from "lucide-react";

export function ActionMenu({ trigger, actions = [], className = "" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="block">
        {trigger}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-[150] min-w-[220px] rounded-2xl border border-[var(--border)] bg-white p-2 shadow-xl">
          {actions.map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setOpen(false);
                onClick?.();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--text-main)] hover:bg-[var(--surface-muted)]"
            >
              {Icon ? <Icon className="w-4 h-4 text-[var(--text-soft)]" /> : null}
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function NotificationSystem() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const notifications = [
    { id: 1, title: "New Patient Admission", time: "5m ago", type: "info" },
    { id: 2, title: "Lab Results Ready", time: "12m ago", type: "success" },
    { id: 3, title: "Critical Stock Alert", time: "1h ago", type: "danger" }
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${open ? 'bg-[var(--accent-soft)] text-[var(--clinical-blue)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-main)]'}`}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        <span className="absolute right-1.5 top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--danger)] px-1 text-xs font-bold text-white">
          {notifications.length}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 z-[150] w-[320px] rounded-2xl border border-[var(--border)] bg-white shadow-2xl animate-fade-in overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-between">
            <h3 className="font-bold text-sm text-[var(--text-main)]">Clinical Alerts</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-soft)]">Live Stream</span>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.map((n) => (
              <button
                key={n.id}
                className="w-full p-4 flex items-start gap-3 hover:bg-[var(--surface-muted)] transition-colors border-b border-[var(--border)] last:border-none text-left"
              >
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.type === 'danger' ? 'bg-[var(--danger)] shadow-[0_0_8px_var(--danger)]' : n.type === 'success' ? 'bg-[var(--success)] shadow-[0_0_8px_var(--success)]' : 'bg-[var(--clinical-blue)] shadow-[0_0_8px_var(--clinical-blue)]'}`} />
                <div>
                  <p className="text-sm font-bold text-[var(--text-main)] leading-tight">{n.title}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">{n.time}</p>
                </div>
              </button>
            ))}
          </div>
          <button className="w-full py-3 bg-[var(--primary-soft)] text-[var(--clinical-blue)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--accent-soft)] transition-colors">
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}

export function SmartSearch({
  placeholder = "Search patients, records...",
  onSearch,
  inputRef,
  className = "",
  patients = [],
  appointments = []
}) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    
    const q = query.toLowerCase();
    const results = [];

    // 1. Search Patients
    const matchedPatients = patients.filter(p => 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || 
      (p.mrn && p.mrn.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q))
    ).slice(0, 3);

    matchedPatients.forEach(p => {
      results.push({
        id: `pat-${p.id}`,
        type: 'patient',
        label: `${p.firstName} ${p.lastName}`,
        sub: `MRN: ${p.mrn || p.id.slice(0, 8)}`,
        data: p
      });
    });

    // 2. Search Appointments
    const matchedAppts = appointments.filter(a => 
      (a.patientName && a.patientName.toLowerCase().includes(q)) ||
      (a.reason && a.reason.toLowerCase().includes(q))
    ).slice(0, 2);

    matchedAppts.forEach(a => {
      results.push({
        id: `apt-${a.id}`,
        type: 'appointment',
        label: `Appointment: ${a.patientName}`,
        sub: `${new Date(a.visit_date || a.start).toLocaleDateString()} - ${a.reason}`,
        data: a
      });
    });

    // 3. Command/Navigation suggestions
    if (results.length === 0) {
      results.push({ id: 'cmd-reg', type: 'nav', label: 'New Registration', sub: 'Go to Onboarding Module', target: 'patients' });
      results.push({ id: 'cmd-emr', type: 'nav', label: 'Clinical Assessment', sub: 'Open EMR Workspace', target: 'emr' });
    }

    return results;
  }, [query, patients, appointments]);

  return (
    <div className={`relative ${className}`} onFocus={() => setIsFocused(true)} onBlur={() => setTimeout(() => setIsFocused(false), 200)}>
      <Search className="pointer-events-none absolute right-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--text-soft)]" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && searchResults[0]) {
            onSearch?.(searchResults[0]);
            setQuery("");
          }
        }}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-[var(--border)] bg-gray-50/50 pl-4 pr-12 text-sm text-[var(--text-main)] outline-none transition-all focus:bg-white focus:border-[var(--clinical-blue)]/30 focus:ring-4 focus:ring-[var(--clinical-blue)]/5"
      />
      {isFocused && searchResults.length > 0 && (
        <div className="absolute right-0 top-full z-[9999] mt-2 w-full rounded-2xl border border-[var(--border)] bg-white p-2 shadow-2xl animate-fade-in">
          {searchResults.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setQuery("");
                onSearch?.(item);
              }}
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:bg-[var(--primary-soft)]"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-[var(--clinical-blue)] transition-all">
                {item.type === 'patient' && <UserCircle size={14} />}
                {item.type === 'appointment' && <Calendar size={14} />}
                {item.type === 'nav' && <Activity size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-slate-900 truncate tracking-tight">{item.label}</div>
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest truncate mt-0.5">{item.sub}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-[var(--clinical-blue)] group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function StatusIndicator({ label, tone = "default" }) {
  const tones = {
    default: "bg-[var(--surface-muted)] text-[var(--text-main)]",
    success: "bg-[var(--success-soft)] text-[var(--success)]",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)]"
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone] || tones.default}`}>
      {label}
    </span>
  );
}
