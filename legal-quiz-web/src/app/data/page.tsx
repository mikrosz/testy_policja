"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { storage } from "@/lib/storage/storage";
import type { QuestionBank, Quiz } from "@/lib/types";
import { ToastHost, useToasts } from "@/components/ui/Toast";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const { toasts, pushToast, removeToast } = useToasts();

  async function refresh() {
    setQuizzes(await storage.quizzes.list());
    setBanks(await storage.banks.list());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function exportAll() {
    const payload = { version: 3, exportedAt: new Date().toISOString(), quizzes, banks };
    downloadJson("testy-policyjne-backup.json", payload);
    pushToast({ kind: "success", title: "Wyeksportowano", message: "Zapisano plik JSON." });
  }

  async function importAll(file: File) {
    const text = await file.text();
    const payload = JSON.parse(text) as { quizzes?: Quiz[]; banks?: QuestionBank[] };
    if (payload.quizzes) for (const q of payload.quizzes) await storage.quizzes.put(q);
    if (payload.banks) for (const b of payload.banks) await storage.banks.put(b);
    await refresh();
    pushToast({ kind: "success", title: "Zaimportowano", message: "Dane zostały zapisane w IndexedDB." });
  }

  async function clearAll() {
    await storage.resetAll();
    await refresh();
    pushToast({ kind: "info", title: "Wyczyszczono", message: "Usunięto wszystkie dane z IndexedDB." });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dane</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">Backup i czyszczenie danych lokalnych.</p>
        </div>
        <Link href="/">
          <Button variant="secondary">Wróć</Button>
        </Link>
      </div>

      <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/20">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="text-sm font-semibold">Eksport</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Quizy: {quizzes.length} • Banki: {banks.length}
            </div>
            <div className="mt-3">
              <Button onClick={exportAll} disabled={quizzes.length === 0 && banks.length === 0}>
                Eksportuj JSON
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="text-sm font-semibold">Import</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Wczytuje backup JSON zapisany wcześniej.</div>
            <div className="mt-3">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importAll(f);
                    e.target.value = "";
                  }}
                />
                <Button variant="secondary">Wybierz plik...</Button>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/40">
          <div className="text-sm font-semibold text-rose-900 dark:text-rose-200">Strefa ryzyka</div>
          <div className="mt-1 text-xs text-rose-800 dark:text-rose-300">
            Usuwa wszystkie quizy, banki oraz statystyki z tej przeglądarki.
          </div>
          <div className="mt-3">
            <Button variant="danger" onClick={clearAll}>
              Wyczyść wszystko
            </Button>
          </div>
        </div>
      </div>

      <ToastHost toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
