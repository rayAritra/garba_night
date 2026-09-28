"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertIcon, CheckIcon } from "@/components/ui/icons";

type Toast = { id: number; message: string; tone: "info" | "error" | "success"; action?: { label: string; onClick: () => void } };
type ToastInput = Omit<Toast, "id" | "tone"> & { tone?: Toast["tone"] };

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, tone: "info", ...input }]);
      window.setTimeout(() => dismiss(id), input.action ? 6000 : 3800);
    },
    [dismiss],
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-4 top-[max(16px,env(safe-area-inset-top))] z-[100] mx-auto flex max-w-[420px] flex-col items-stretch gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={cn(
              "glass pointer-events-auto flex min-h-12 animate-rise items-center gap-3 rounded-[18px] py-2 pr-2 pl-4 text-sm font-semibold shadow-[0_20px_60px_rgba(0,0,0,.5)]",
              toast.tone === "error" && "border-danger/35",
            )}
          >
            <span aria-hidden="true" className={cn("shrink-0", toast.tone === "error" ? "text-danger" : "text-saffron")}>
              {toast.tone === "error" ? <AlertIcon size={18} /> : <CheckIcon size={18} />}
            </span>
            <span className="flex-1 py-1.5">{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                className="h-9 rounded-full px-3 text-sm font-bold text-saffron hover:bg-white/5"
                onClick={() => {
                  toast.action?.onClick();
                  dismiss(toast.id);
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
