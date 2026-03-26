/**
 * StatCard – unified metric card component used across all modules.
 * Consistent font sizes, weights, colors, and layout.
 *
 * Props:
 *   icon       – Lucide icon component
 *   iconBg     – Tailwind bg class for icon bg  (e.g. "bg-blue-50")
 *   iconColor  – Tailwind text class for icon    (e.g. "text-blue-600")
 *   label      – short description
 *   value      – the big number / string
 *   sub        – optional small text below value (e.g. "+12%" or "vs last week")
 *   subColor   – Tailwind text class for sub     (default "text-emerald-600")
 *   onClick    – optional click handler
 *   className  – extra wrapper classes
 */
export function StatCard({
  icon: Icon,
  iconBg = "bg-slate-100",
  iconColor = "text-slate-600",
  label,
  value,
  sub,
  subColor = "text-emerald-600",
  onClick,
  className = "",
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-slate-100 shadow-sm
        px-5 py-4 flex flex-col items-center text-center gap-2
        transition-all duration-200
        ${onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""}
        ${className}
      `}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
      </div>

      {/* Value */}
      <p className="stat-value">{value ?? "—"}</p>

      {/* Label */}
      <p className="stat-label">{label}</p>

      {/* Sub text */}
      {sub && (
        <span className={`stat-sub ${subColor}`}>{sub}</span>
      )}
    </div>
  );
}

/**
 * StatRow – horizontal variant, icon on the left, value + label on the right.
 * Used inside sidebars or narrow summary panels.
 */
export function StatRow({
  icon: Icon,
  iconBg = "bg-slate-100",
  iconColor = "text-slate-600",
  label,
  value,
  sub,
  subColor = "text-emerald-600",
  className = "",
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
      </div>
      <div className="min-w-0">
        <p className="stat-value-sm">{value ?? "—"}</p>
        <p className="stat-label">{label}</p>
        {sub && <span className={`stat-sub ${subColor}`}>{sub}</span>}
      </div>
    </div>
  );
}
