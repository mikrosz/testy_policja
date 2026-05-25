"use client";

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  disabled
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium">{label}</div>
      <input
        disabled={disabled}
        type="number"
        min={min}
        max={max}
        step={step}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

