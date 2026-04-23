import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

let toastCount = 0;
let addToastFn = null;

export const customToast = {
  success: (msg) => addToastFn && addToastFn(msg, 'success'),
  error: (msg) => addToastFn && addToastFn(msg, 'error'),
  info: (msg) => addToastFn && addToastFn(msg, 'info'),
  warning: (msg) => addToastFn && addToastFn(msg, 'warning')
};

export default function ToastSystem() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (message, type) => {
      const id = ++toastCount;
      setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
      
      // Auto dismiss after 3000ms
      setTimeout(() => {
        setToasts((prev) => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 220); // Exit animation duration
      }, 3000);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => {
        const types = {
          success: { border: 'border-l-success', icon: <CheckCircle2 className="w-5 h-5 text-success" /> },
          error: { border: 'border-l-danger', icon: <AlertCircle className="w-5 h-5 text-danger" /> },
          info: { border: 'border-l-info', icon: <Info className="w-5 h-5 text-info" /> },
          warning: { border: 'border-l-warning', icon: <AlertTriangle className="w-5 h-5 text-warning" /> },
        };
        const typeConfig = types[toast.type] || types.info;

        return (
          <div
            key={toast.id}
            className={`
              w-[320px] bg-bg-card border-[0.5px] border-border border-l-[3px] ${typeConfig.border}
              rounded-[var(--radius-md)] p-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] 
              flex items-start gap-3 pointer-events-auto
            `}
            style={{
              animation: toast.exiting 
                ? 'toastOut 220ms ease-in forwards' 
                : 'toastIn 280ms ease-out forwards'
            }}
          >
            <div className="shrink-0 mt-0.5">{typeConfig.icon}</div>
            <div className="flex-1">
              <span className="text-[14px] font-[500] text-text-heading leading-tight block">
                {toast.message}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
