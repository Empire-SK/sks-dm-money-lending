import React from 'react';
import { useExpense } from '../../contexts/ExpenseContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useExpense();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-xl animate-fadeIn ${
              isSuccess
                ? 'bg-zinc-900/95 border-emerald-500/30 text-emerald-400'
                : isError
                ? 'bg-zinc-900/95 border-rose-500/30 text-rose-400'
                : 'bg-zinc-900/95 border-sky-500/30 text-sky-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isSuccess && <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-400" />}
              {isError && <AlertCircle size={18} className="flex-shrink-0 text-rose-400" />}
              {!isSuccess && !isError && <Info size={18} className="flex-shrink-0 text-sky-400" />}
              <p className="text-xs font-medium text-zinc-200">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
