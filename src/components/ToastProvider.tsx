import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";

export type ToastAction = { label: string; onAction: () => void };

type Toast = { id: number; message: string; action?: ToastAction };

const ToastContext = createContext<{ showToast: (message: string, action?: ToastAction) => void } | null>(
  null,
);

const TOAST_DURATION_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(1);

  const showToast = useCallback((message: string, action?: ToastAction) => {
    const id = nextIdRef.current++;
    setToasts((current) => [...current, { id, message, action }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            <span>{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                className="btn btn-small"
                onClick={() => {
                  toast.action?.onAction();
                  setToasts((current) => current.filter((t) => t.id !== toast.id));
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return value;
}
