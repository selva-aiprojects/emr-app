import { ShieldCheck } from 'lucide-react';
export { PageHero } from './PageHero';

export function StatusBadge({ status = "pending", size = "md" }) {
  const statusKey = String(status).toLowerCase();
  const tones = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "in-progress": "bg-sky-50 text-sky-700 border-sky-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    critical: "bg-rose-50 text-rose-700 border-rose-200",
    default: "bg-slate-50 text-slate-700 border-slate-200"
  };
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs"
  };

  return (
    <span className={`inline-flex items-center rounded-full border font-bold uppercase tracking-[0.12em] ${sizes[size] || sizes.md} ${tones[statusKey] || tones.default}`}>
      {status}
    </span>
  );
}

export function SectionHeader({
  title,
  subtitle,
  badge,
  showSearch,
  searchValue,
  onSearchChange,
  actions = []
}) {
  return (
    <section className="premium-card p-6 md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          {badge ? <div className="clinical-chip mb-4">{badge}</div> : null}
          <h1 className="text-[1.95rem] md:text-[2.35rem] leading-tight font-extrabold tracking-[-0.04em] text-[var(--text-strong)]">{title}</h1>
          {subtitle ? <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-muted)]">{subtitle}</p> : null}
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {showSearch ? (
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search..."
              className="clinical-input min-w-[220px] px-4 py-3 text-sm font-semibold"
            />
          ) : null}
          {actions.map(({ label, icon: Icon, variant = "secondary", onClick }) => (
            <button key={label} type="button" onClick={onClick} className={`btn ${variant === "primary" ? "btn-primary" : "btn-secondary"}`}>
              {Icon ? <Icon className="w-4 h-4" /> : null}
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SubSectionHeader({ title, subtitle, badge, actions = [] }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-strong)]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {badge ? <span className="clinical-chip">{badge}</span> : null}
        {actions.map(({ icon: Icon, label, onClick }) => (
          <button key={label} type="button" onClick={onClick} className="btn btn-secondary">
            {Icon ? <Icon className="w-4 h-4" /> : null}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ActionCard({ title, description, icon: Icon, children, onClick, variant = "default" }) {
  const variantClass = {
    default: "",
    danger: "border-rose-200",
    warning: "border-amber-200",
    success: "border-emerald-200",
    info: "border-sky-200"
  };

  const content = (
    <div className={`premium-card p-5 ${variantClass[variant] || ""}`}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--primary)]">
            <Icon className="w-5 h-5" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-base font-bold text-[var(--text-strong)]">{title}</h3>
          {description ? <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p> : null}
        </div>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );

  if (onClick) {
    return <button type="button" onClick={onClick} className="block w-full text-left">{content}</button>;
  }

  return content;
}

export function DataTable({
  data = [],
  columns = [],
  loading = false,
  emptyMessage = "No records found",
  actions = [],
  onRowClick
}) {
  if (loading) {
    return <div className="premium-card p-6 text-sm text-[var(--text-muted)]">Loading...</div>;
  }

  return (
    <div className="premium-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-4 text-left text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                  {column.label}
                </th>
              ))}
              {actions.length > 0 ? (
                <th className="px-4 py-4 text-right text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--text-soft)]">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-6 py-16 text-center text-sm italic text-[var(--text-muted)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`border-b border-[var(--border)]/70 transition-colors hover:bg-[var(--surface-muted)] ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4 align-top text-sm text-[var(--text-main)]">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                  {actions.length > 0 ? (
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {actions.map(({ label, icon: Icon, onClick }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onClick?.(row);
                            }}
                            className="btn btn-secondary !min-h-[36px] !px-3 !text-xs"
                          >
                            {Icon ? <Icon className="w-4 h-4" /> : null}
                            {label}
                          </button>
                        ))}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EmptyState({ 
  title = "No informational records identified", 
  subtitle = "The requested registry is currently empty or the applied filters returned no matching identity protocols.",
  icon: Icon = ShieldCheck 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-[28px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200 mb-6">
        <Icon className="w-10 h-10 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-black text-slate-900 uppercase tracking-widest">{title}</h3>
      <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight max-w-xs leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}
