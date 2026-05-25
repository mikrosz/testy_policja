"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="leading-tight">
              <div className="text-sm font-semibold">Testy Policyjne</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Quizy offline</div>
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
      <main>{children}</main>
      <footer className="mx-auto max-w-7xl px-4 py-10 text-xs text-slate-500 dark:text-slate-400">
        Działa w 100% w przeglądarce. Dane są zapisywane lokalnie (IndexedDB).
      </footer>
    </div>
  );
}
