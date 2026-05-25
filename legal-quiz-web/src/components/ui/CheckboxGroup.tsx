"use client";

export function CheckboxGroup({
  label,
  values,
  onChange,
  options
}: {
  label: string;
  values: string[];
  onChange: (vals: string[]) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <div className="text-sm font-medium">{label}</div>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const checked = values.includes(o.value);
          return (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
                checked={checked}
                onChange={(e) => {
                  const next = e.target.checked ? [...values, o.value] : values.filter((v) => v !== o.value);
                  onChange(next);
                }}
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

