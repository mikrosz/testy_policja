"use client";

import { useCallback, useState } from "react";

type ToastKind = "success" | "error" | "warning" | "info";
export type ToastItem = { id: string; kind: ToastKind; title: string; message?: string };

function kindStyles(kind: ToastKind) {
  switch (kind) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200";
    case "info":
    default:
      return "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-50";
  }
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const removeToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const pushToast = useCallback((t: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => removeToast(id), 4500);
  }, [removeToast]);
  return { toasts, pushToast, removeToast };
}

export function ToastHost({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`rounded-xl border p-3 shadow-sm ${kindStyles(t.kind)}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold">{t.title}</div>
            <button className="text-xs opacity-70 hover:opacity-100" onClick={() => onDismiss(t.id)}>
              Zamknij
            </button>
          </div>
          {t.message ? <div className="mt-1 text-xs opacity-90">{t.message}</div> : null}
        </div>
      ))}
    </div>
  );
}
