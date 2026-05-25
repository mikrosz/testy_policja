"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { storage } from "@/lib/storage/storage";
import type { QuestionBank, Quiz } from "@/lib/types";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { activeQuiz } from "@/lib/quiz/activeQuiz";
import { withBasePath } from "@/lib/nav/withBasePath";

export default function HomePage() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [recent, setRecent] = useState<Quiz[]>([]);

  useEffect(() => {
    async function refresh() {
      const b = await storage.banks.list();
      b.sort((a, b) => a.title.localeCompare(b.title, "pl"));
      setBanks(b.filter((x) => x.enabled));

      const q = await storage.quizzes.list();
      q.sort((a, b) => (b.meta.createdAt ?? 0) - (a.meta.createdAt ?? 0));
      setRecent(q.slice(0, 4));
    }

    void refresh();
    const onBanks = () => void refresh();
    window.addEventListener("tp_banks_updated", onBanks);
    return () => window.removeEventListener("tp_banks_updated", onBanks);
  }, []);

  const enabledBanks = useMemo(() => banks, [banks]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Testy Policyjne</h1>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Dostępne quizy</h2>
        <div className="flex gap-2">
          <Link href="/banks/">
            <Button variant="secondary">Banki pytań</Button>
          </Link>
          <Link href="/quiz/">
            <Button variant="secondary">Historia</Button>
          </Link>
        </div>
      </div>

      {enabledBanks.length ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enabledBanks.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/20"
            >
              <div className="text-sm font-semibold">{b.title}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-300">
                <div>Pytania: {b.questions.length}</div>
                <div>Kategorie: {b.categories.length}</div>
                <div>Typy: {new Set(b.questions.map((q) => q.type)).size}</div>
                <div>{b.builtIn ? "Wbudowany" : "Zaimportowany"}</div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <Link href={`/quiz/new/?bankId=${encodeURIComponent(b.id)}`}>
                  <Button>Rozpocznij quiz</Button>
                </Link>
                <Link href="/banks/">
                  <Button variant="ghost">Szczegóły</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
          Brak dostępnych quizów. Dodaj plik JSON do{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">public/question-banks/</code>.
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Ostatnie wyniki</h2>
          <Link href="/data/">
            <Button variant="ghost">Dane</Button>
          </Link>
        </div>

        {recent.length ? (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {recent.map((q) => {
              const res = q.session?.result ?? null;
              return (
                <div
                  key={q.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/80"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{q.meta.docName}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                      {new Date(q.meta.createdAt).toLocaleString("pl-PL")} • {q.questions.length} pytań
                    </div>
                    <div className="mt-3 flex gap-2">
                      {res ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            activeQuiz.setLastResultId(q.id);
                            activeQuiz.setActiveId(q.id);
                            window.location.href = withBasePath("/quiz/result/");
                          }}
                        >
                          Podsumowanie
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            activeQuiz.setActiveId(q.id);
                            window.location.href = withBasePath("/quiz/session/");
                          }}
                        >
                          Kontynuuj
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <ScoreRing value={res?.scorePercent ?? 0} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
            Brak wyników. Rozpocznij quiz, aby zobaczyć historię.
          </div>
        )}
      </div>
    </div>
  );
}
