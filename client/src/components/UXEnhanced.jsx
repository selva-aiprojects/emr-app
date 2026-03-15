import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Search, ChevronDown } from "lucide-react";

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
  return (
    <button
      type="button"
      className="relative flex h-11 w-11 items-center justify-center text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
      title="Notifications"
    >
      <Bell className="w-5 h-5" />
      <span className="absolute right-1.5 top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--danger)] px-1 text-xs font-bold text-white">
        2
      </span>
    </button>
  );
}

export function SmartSearch({
  placeholder = "Search",
  onSearch,
  inputRef,
  className = ""
}) {
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return [
      { id: "patient", type: "patient", label: `Open patient search for "${query}"` },
      { id: "appointment", type: "appointment", label: `Review appointments for "${query}"` },
      { id: "medication", type: "medication", label: `Find medications related to "${query}"` }
    ];
  }, [query]);

  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--text-soft)]" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && suggestions[0]) {
            onSearch?.(suggestions[0]);
          }
        }}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white pl-12 pr-4 text-sm text-[var(--text-main)] shadow-sm outline-none transition focus:border-[var(--primary)]/40 focus:ring-4 focus:ring-[var(--primary)]/10"
      />
      {suggestions.length > 0 && (
        <div className="absolute right-0 top-full z-[140] mt-2 w-full rounded-2xl border border-[var(--border)] bg-white p-2 shadow-xl">
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setQuery("");
                onSearch?.(item);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-[var(--text-main)] hover:bg-[var(--surface-muted)]"
            >
              <span className="truncate">{item.label}</span>
              <ChevronDown className="w-4 h-4 rotate-[-90deg] text-[var(--text-soft)]" />
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
