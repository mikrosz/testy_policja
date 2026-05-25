"use client";

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max <= 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="w-full rounded-full bg-slate-100 p-1 dark:bg-slate-900">
      <div
        className="h-2 rounded-full bg-blue-600 transition-[width]"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

