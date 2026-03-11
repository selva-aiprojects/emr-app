const iconMap = {
  patients: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  appointments: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  walkins: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  employees: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  revenue: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  tenants: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
};

export default function MetricCard({ label, value, accent = 'blue', icon, trend }) {
  // Define accent-specific styles
  const accentStyles = {
    blue: {
      iconBg: 'bg-blue-500',
      iconText: 'text-white',
      trendBg: 'bg-blue-50 dark:bg-blue-900/20',
      trendText: 'text-blue-600 dark:text-blue-400',
      shadow: 'shadow-blue-500/20'
    },
    emerald: {
      iconBg: 'bg-emerald-500',
      iconText: 'text-white',
      trendBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      trendText: 'text-emerald-600 dark:text-emerald-400',
      shadow: 'shadow-emerald-500/20'
    },
    amber: {
      iconBg: 'bg-amber-500',
      iconText: 'text-white',
      trendBg: 'bg-amber-50 dark:bg-amber-900/20',
      trendText: 'text-amber-600 dark:text-amber-400',
      shadow: 'shadow-amber-500/20'
    },
    rose: {
      iconBg: 'bg-rose-500',
      iconText: 'text-white',
      trendBg: 'bg-rose-50 dark:bg-rose-900/20',
      trendText: 'text-rose-600 dark:text-rose-400',
      shadow: 'shadow-rose-500/20'
    }
  };

  const style = accentStyles[accent] || accentStyles.blue;

  return (
    <article className="glass-panel rounded-super p-6 transition-all duration-300 flex flex-col gap-5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-10 transition-opacity">
        <svg className="w-12 h-12 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2v20m10-10H2" /></svg>
      </div>
      <div className="flex items-start justify-between relative z-10">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.trendBg} ${style.trendText}`}>
          {iconMap[icon] || iconMap['patients']}
        </div>
        {trend && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none flex items-center gap-1 ${style.trendBg} ${style.trendText}`}>
            {trend.startsWith('+') && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
            {trend.startsWith('-') && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
            {trend}
          </span>
        )}
      </div>
      
      <div className="relative z-10">
        <span className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] mb-2">{label}</span>
        <div className="text-[1.75rem] font-extrabold text-main tracking-tight leading-none">
          {value}
        </div>
      </div>
    </article>
  );
}
