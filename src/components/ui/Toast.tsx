"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastMessage = {
  id: string;
  text: string;
};

type ToastContextValue = {
  showToast: (text: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const showToast = useCallback((text: string) => {
    const id = `${Date.now()}`;
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    setToast({ id, text });
    timeoutRef.current = window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
      timeoutRef.current = null;
    }, 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+5.25rem)] z-[10000] flex w-[min(390px,calc(100vw-2rem))] -translate-x-1/2 justify-center px-3">
          <div
            key={toast.id}
            className="jobchat-toast-pill min-h-11 max-w-full truncate whitespace-nowrap rounded-[22px] border border-white/10 bg-slate-950/95 px-5 py-3 text-center text-sm font-semibold leading-tight text-white shadow-[0_14px_34px_rgba(15,23,42,0.28)] backdrop-blur-md"
            dir="auto"
          >
            {toast.text}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
