"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/70 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Testy Policyjne</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/quiz/">
              <Button variant="ghost">Historia</Button>
            </Link>
            <Link href="/banks/">
              <Button variant="ghost">Banki</Button>
            </Link>
            <Button variant="ghost" onClick={toggle} ariaLabel="Przełącz motyw">
              {theme === "dark" ? "Jasny" : "Ciemny"}
            </Button>
          </nav>
        </div>
      </header>
      <main className="pb-10">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 py-10 text-xs text-slate-500 dark:text-slate-400">
        Działa w 100% w przeglądarce. Dane są zapisywane lokalnie (IndexedDB).
      </footer>
    </div>
  );
}
