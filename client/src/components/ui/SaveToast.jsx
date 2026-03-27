import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

/**
 * SaveToast — lightweight toast notification for save/error feedback.
 * Usage: <SaveToast message="Patient saved successfully!" type="success" onClose={() => setToast(null)} />
 */
export default function SaveToast({ message, type = 'success', onClose, duration = 3500 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const isSuccess = type === 'success';
  return (
    <div
      className={`
        fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border
        backdrop-blur-xl transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${isSuccess
          ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
          : 'bg-rose-950/90 border-rose-500/30 text-rose-200'
        }
      `}
    >
      {isSuccess
        ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        : <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
      }
      <span className="text-sm font-semibold">{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
