"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  className = "",
  ariaLabel,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; ariaLabel?: string }) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950";
  const styles: Record<Variant, string> = {
    primary:
      "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/25 dark:shadow-blue-600/10",
    secondary:
      "border border-slate-200/80 bg-white text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-900",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-slate-900/70",
    danger: "bg-rose-600 text-white hover:bg-rose-700"
  };
  return <button aria-label={ariaLabel} className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
