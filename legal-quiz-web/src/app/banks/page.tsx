"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ToastHost, useToasts } from "@/components/ui/Toast";
import { storage } from "@/lib/storage/storage";
import type { BankQuestionType, QuestionBank } from "@/lib/types";
import { parseAndValidateBank } from "@/lib/banks/validateBank";

type BuiltInIndex = {
  banks: { title: string; path: string; types: string[] }[];
};

function countTypes(bank: QuestionBank) {
  const s = new Set<BankQuestionType>();
  for (const q of bank.questions) s.add(q.type);
  return s.size;
}

function difficultyDist(bank: QuestionBank) {
  const map = new Map<string, number>();
  for (const q of bank.questions) {
    const d = q.difficulty ?? "brak";
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export default function BanksPage() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [activeBankId, setActiveBankId] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [unsupportedBuiltIns, setUnsupportedBuiltIns] = useState<{ title: string; types: string[] }[]>([]);
  const { toasts, pushToast, removeToast } = useToasts();

  async function refresh() {
    const loaded = await storage.banks.list();
    loaded.sort((a, b) => a.title.localeCompare(b.title, "pl"));
    setBanks(loaded);
    setActiveBankId((prev) => prev || loaded[0]?.id || "");
  }

  useEffect(() => {
    void refresh();
    const onBanks = () => void refresh();
    window.addEventListener("tp_banks_updated", onBanks);
    return () => window.removeEventListener("tp_banks_updated", onBanks);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
        const res = await fetch(`${basePath}/question-banks/index.json`, { cache: "no-store" });
        if (!res.ok) return;
        const idx = (await res.json()) as BuiltInIndex;
        const bad =
          idx.banks
            ?.filter((b) => (b.types ?? []).some((t) => !["single_choice", "multiple_choice", "truefalse", "fillblank"].includes(t)))
            .map((b) => ({ title: b.title, types: [...new Set(b.types ?? [])].sort() })) ?? [];
        setUnsupportedBuiltIns(bad);
      } catch {
        // ignore
      }
    })();
  }, []);

  const activeBank = useMemo(() => banks.find((b) => b.id === activeBankId) ?? null, [banks, activeBankId]);
  const categories = useMemo(() => activeBank?.categories ?? [], [activeBank]);

  const filteredCount = useMemo(() => {
    if (!activeBank) return 0;
    if (!categoryFilter) return activeBank.questions.length;
    return activeBank.questions.filter((x) => x.category === categoryFilter).length;
  }, [activeBank, categoryFilter]);

  async function onImport(files: File[]) {
    for (const f of files) {
      if (!f.name.toLowerCase().endsWith(".json")) {
        pushToast({ kind: "warning", title: "Pominięto plik", message: "Obsługiwane są tylko pliki .json" });
        continue;
      }
      try {
        const text = await f.text();
        const { bank, warnings } = await parseAndValidateBank(text, { builtIn: false });
        const existing = await storage.banks.get(bank.id);
        if (existing) {
          pushToast({ kind: "info", title: "Duplikat", message: `Ten bank już istnieje: ${bank.title}` });
          continue;
        }
        await storage.banks.put(bank);
        pushToast({
          kind: warnings.length ? "warning" : "success",
          title: warnings.length ? "Zaimportowano z ostrzeżeniami" : "Zaimportowano bank",
          message: warnings.length ? warnings.slice(0, 2).join(" ") : bank.title
        });
      } catch (e) {
        pushToast({
          kind: "error",
          title: "Błąd importu",
          message: e instanceof Error ? e.message : "Nieznany błąd."
        });
      }
    }
    await refresh();
  }

  async function toggleEnabled(id: string) {
    const b = await storage.banks.get(id);
    if (!b) return;
    await storage.banks.put({ ...b, enabled: !b.enabled });
    await refresh();
  }

  async function deleteBank(id: string) {
    const b = await storage.banks.get(id);
    if (!b) return;
    if (b.builtIn) {
      pushToast({ kind: "warning", title: "Nie można usunąć", message: "To bank wbudowany. Możesz go tylko wyłączyć." });
      return;
    }
    await storage.banks.delete(id);
    await refresh();
    pushToast({ kind: "info", title: "Usunięto", message: "Bank pytań usunięty." });
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Banki pytań</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Banki wbudowane są ładowane automatycznie z <code>public/question-banks/</code>. Dodatkowe banki możesz
            zaimportować ręcznie.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="secondary">Wróć</Button>
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/20">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Lista banków</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">{banks.length} szt.</span>
          </div>

          <div className="mt-3">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="file"
                accept="application/json,.json"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) void onImport(files);
                  e.target.value = "";
                }}
              />
              <Button variant="secondary">Importuj .json</Button>
            </label>
          </div>

          <div className="mt-4 space-y-2">
            {banks.length ? (
              banks.map((b) => {
                const active = b.id === activeBankId;
                return (
                  <div
                    key={b.id}
                    className={`rounded-xl border p-3 ${
                      active ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <button className="block w-full text-left" onClick={() => setActiveBankId(b.id)}>
                      <div className="truncate text-sm font-semibold">{b.title}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Pytania: {b.questions.length} • Kategorie: {b.categories.length} • Typy: {countTypes(b)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Status: {b.enabled ? "Włączony" : "Wyłączony"} • {b.builtIn ? "Wbudowany" : "Zaimportowany"}
                      </div>
                    </button>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => void toggleEnabled(b.id)}>
                        {b.enabled ? "Wyłącz" : "Włącz"}
                      </Button>
                      <Button variant="ghost" onClick={() => void deleteBank(b.id)}>
                        Usuń
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-200">
                Brak banków. Dodaj pliki do <code>public/question-banks/</code> lub zaimportuj .json.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/20">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Podgląd</h2>
            {activeBank ? (
              <span className="text-xs text-slate-500 dark:text-slate-400">{filteredCount} pytań</span>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">Brak banku</span>
            )}
          </div>

          {activeBank ? (
            <div className="mt-4 space-y-3">
              {unsupportedBuiltIns.length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <div className="font-semibold">Wykryto nieobsługiwane typy pytań w bankach wbudowanych</div>
                  <div className="mt-1 text-xs opacity-90">
                    Obsługiwane typy to: <code>single_choice</code>, <code>multiple_choice</code>, <code>truefalse</code>,{" "}
                    <code>fillblank</code>. Typy takie jak <code>open</code> nie są importowane.
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                    {unsupportedBuiltIns.slice(0, 6).map((b) => (
                      <li key={b.title}>
                        {b.title} (typy: {b.types.join(", ")})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block">
                  <div className="text-sm font-medium">Filtr kategorii</div>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900/80"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">Wszystkie</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rozkład trudności</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {difficultyDist(activeBank).map(([k, v]) => (
                    <span
                      key={k}
                      className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
                    >
                      {k}: {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Przykładowe pytania</div>
                  <Link href={`/quiz/new/?bankId=${encodeURIComponent(activeBank.id)}`}>
                    <Button>Rozpocznij quiz</Button>
                  </Link>
                </div>
                <div className="mt-2 space-y-2">
                  {activeBank.questions
                    .filter((q) => (!categoryFilter ? true : q.category === categoryFilter))
                    .slice(0, 10)
                    .map((q) => (
                      <div key={String(q.id)} className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {q.category} • {q.type}
                        </div>
                        <div className="mt-1">{q.question}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">Wybierz bank po lewej.</div>
          )}
        </div>
      </div>

      <ToastHost toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
