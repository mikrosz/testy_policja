"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { storage } from "@/lib/storage/storage";
import type { Quiz } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { activeQuiz } from "@/lib/quiz/activeQuiz";
import { buildRetryIncorrectQuiz } from "@/lib/quiz/buildBankQuiz";

export default function QuizResultPage() {
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    const id = activeQuiz.getLastResultId() ?? activeQuiz.getActiveId();
    setQuizId(id);
  }, []);

  useEffect(() => {
    if (!quizId) return;
    void (async () => {
      const loaded = await storage.quizzes.get(quizId);
      setQuiz(loaded ?? null);
    })();
  }, [quizId]);

  const result = useMemo(() => quiz?.session?.result ?? null, [quiz]);
  const incorrectCount = useMemo(() => result?.items.filter((i) => !i.isCorrect).length ?? 0, [result]);

  async function retryIncorrect() {
    if (!quiz?.session?.result) return;
    const retry = buildRetryIncorrectQuiz(quiz);
    if (!retry.questions.length) return;
    await storage.quizzes.put(retry);
    activeQuiz.setActiveId(retry.id);
    window.location.href = "/quiz/session/";
  }

  if (!quizId) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="text-sm text-slate-600 dark:text-slate-300">Brak ostatniego wyniku.</p>
        <div className="mt-3 flex gap-2">
          <Link href="/quiz/">
            <Button variant="secondary">Historia</Button>
          </Link>
          <Link href="/quiz/new/">
            <Button>Nowy quiz</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!quiz || !result) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="text-sm text-slate-600 dark:text-slate-300">Brak wyników (quiz nie został zakończony).</p>
        <div className="mt-3 flex gap-2">
          <Link href="/quiz/session/">
            <Button variant="secondary">Sesja</Button>
          </Link>
          <Link href="/quiz/">
            <Button variant="secondary">Historia</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">Wynik</h1>
          <p className="truncate text-sm text-slate-600 dark:text-slate-300">
            {quiz.meta.docName} • {quiz.questions.length} pytań
          </p>
        </div>
        <Link href="/">
          <Button variant="secondary">Strona główna</Button>
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <ScoreRing value={result.scorePercent} />
          <div className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            {result.correctCount} / {result.totalCount} poprawnych
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                activeQuiz.setActiveId(quiz.id);
                window.location.href = "/quiz/session/";
              }}
            >
              Przegląd odpowiedzi
            </Button>
            <Button variant="secondary" disabled={incorrectCount === 0} onClick={() => void retryIncorrect()}>
              Powtórz błędy ({incorrectCount})
            </Button>
            <Link href="/quiz/new/">
              <Button>Nowy quiz</Button>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold">Statystyki kategorii</h2>
          <div className="mt-3 space-y-2">
            {result.categoryStats.slice(0, 16).map((c) => (
              <div key={c.category} className="flex items-center justify-between gap-2 text-sm">
                <div className="truncate">{c.category}</div>
                <div className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                  {c.correct}/{c.total}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 p-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
            Słabe miejsca: {result.weakTopics.slice(0, 8).join(", ") || "brak"}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-sm font-semibold">Przegląd pytań</h2>
        <div className="mt-3 space-y-2">
          {result.items.map((it) => (
            <div key={it.questionId} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium">{it.prompt}</div>
                <div
                  className={
                    it.isCorrect
                      ? "shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                  }
                >
                  {it.isCorrect ? "OK" : "BŁĄD"}
                </div>
              </div>
              {it.category ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Kategoria: {it.category}</div> : null}
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">{it.explanation}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

