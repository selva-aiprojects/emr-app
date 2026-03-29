import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES = {
  success: 'bg-emerald-950/95 border-emerald-500/30 text-emerald-100',
  error:   'bg-rose-950/95 border-rose-500/30 text-rose-100',
  info:    'bg-slate-900/95 border-slate-500/30 text-slate-100',
  warning: 'bg-amber-950/95 border-amber-500/30 text-amber-100',
};

const ICON_COLORS = {
  success: 'text-emerald-400',
  error:   'text-rose-400',
  info:    'text-slate-400',
  warning: 'text-amber-400',
};

function ToastItem({ toast, onClose }) {
  const Icon = ICONS[toast.type] || CheckCircle2;
  return (
    <div
      className={`
        flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border
        backdrop-blur-xl pointer-events-auto animate-slide-up
        ${STYLES[toast.type] || STYLES.info}
        max-w-sm w-full
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${ICON_COLORS[toast.type]}`} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-xs font-black uppercase tracking-widest mb-0.5 opacity-60">{toast.title}</p>
        )}
        <p className="text-sm font-semibold leading-tight">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="opacity-40 hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ message, type = 'success', title = '', duration = 3500 }) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /* Global Event Listener for non-hook notifications */
  useEffect(() => {
    const handleExternalNotify = (e) => {
      if (e.detail) showToast(e.detail);
    };
    window.addEventListener('medflow-notify', handleExternalNotify);
    return () => window.removeEventListener('medflow-notify', handleExternalNotify);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Mount Point — fixed top-24 right-6, stacked */}
      <div className="fixed top-24 right-6 z-[10000] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
