"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { storage } from "@/lib/storage/storage";
import type { Quiz } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { activeQuiz } from "@/lib/quiz/activeQuiz";
import { withBasePath } from "@/lib/nav/withBasePath";

export default function QuizHistoryPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    void (async () => {
      const loaded = await storage.quizzes.list();
      loaded.sort((a, b) => (b.meta.createdAt ?? 0) - (a.meta.createdAt ?? 0));
      setQuizzes(loaded);
    })();
  }, []);

  async function onDelete(id: string) {
    await storage.quizzes.delete(id);
    const loaded = await storage.quizzes.list();
    loaded.sort((a, b) => (b.meta.createdAt ?? 0) - (a.meta.createdAt ?? 0));
    setQuizzes(loaded);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Historia quizów</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">Wszystko zapisane lokalnie w IndexedDB.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/quiz/new/">
            <Button>Nowy quiz</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">Wróć</Button>
          </Link>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {quizzes.length ? (
          quizzes.map((q) => {
            const res = q.session?.result ?? null;
            return (
              <div
                key={q.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{q.meta.docName}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(q.meta.createdAt).toLocaleString("pl-PL")} • {q.questions.length} pytań
                    {res ? ` • wynik: ${res.scorePercent}%` : " • nieukończony"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={res ? "/quiz/result/" : "/quiz/session/"}>
                    <Button
                      variant="secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        if (res) activeQuiz.setLastResultId(q.id);
                        activeQuiz.setActiveId(q.id);
                        window.location.href = withBasePath(res ? "/quiz/result/" : "/quiz/session/");
                      }}
                    >
                      {res ? "Wynik" : "Kontynuuj"}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      activeQuiz.setActiveId(q.id);
                      window.location.href = withBasePath("/quiz/session/");
                    }}
                  >
                    Podgląd
                  </Button>
                  <Button variant="ghost" onClick={() => onDelete(q.id)}>
                    Usuń
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            Brak quizów.
          </div>
        )}
      </div>
    </div>
  );
}
