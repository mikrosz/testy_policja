"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { storage } from "@/lib/storage/storage";
import type { Quiz, QuizAnswer } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QuestionView } from "@/components/quiz/QuestionView";
import { computeQuizResult } from "@/lib/quiz/computeQuizResult";
import { activeQuiz } from "@/lib/quiz/activeQuiz";
import { updateStatsOnFinish } from "@/lib/stats/userStats";
import { withBasePath } from "@/lib/nav/withBasePath";

export default function QuizSessionPage() {
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    setQuizId(activeQuiz.getActiveId());
  }, []);

  useEffect(() => {
    if (!quizId) return;
    void (async () => {
      const loaded = await storage.quizzes.get(quizId);
      if (!loaded) {
        setQuiz(null);
        return;
      }
      setQuiz(loaded);
      setIndex(0);
      setAnswers(loaded.session?.answers ?? {});
      setStartedAt(loaded.session?.startedAt ?? Date.now());
    })();
  }, [quizId]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  const current = useMemo(() => {
    if (!quiz) return null;
    return quiz.questions[index] ?? null;
  }, [quiz, index]);

  const isReview = Boolean(quiz?.session?.finishedAt);

  const revealNow = useMemo(() => {
    if (isReview) return true;
    if (!current) return false;
    // Immediate feedback only for single-step questions.
    if (current.type === "single" || current.type === "truefalse") return Boolean(answers[current.id]);
    return false;
  }, [isReview, current, answers]);

  const categoryProgress = useMemo(() => {
    if (!quiz) return [];
    const map = new Map<string, { total: number; answered: number }>();
    for (const q of quiz.questions) {
      const c = q.category ?? "Ogólne";
      const v = map.get(c) ?? { total: 0, answered: 0 };
      v.total += 1;
      if (answers[q.id]) v.answered += 1;
      map.set(c, v);
    }
    return [...map.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [quiz, answers]);

  const remaining = useMemo(() => {
    if (!quiz?.config.timer.enabled) return null;
    const elapsedSeconds = Math.floor((now - startedAt) / 1000);
    return Math.max(0, quiz.config.timer.seconds - elapsedSeconds);
  }, [quiz, now, startedAt]);

  useEffect(() => {
    if (!quiz?.config.timer.enabled) return;
    if (remaining === null) return;
    if (remaining > 0) return;
    void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, quiz?.config.timer.enabled]);

  async function persist(partial: Partial<Quiz["session"]>) {
    if (!quiz) return;
    const updated: Quiz = {
      ...quiz,
      session: {
        startedAt,
        answers,
        ...partial
      }
    };
    setQuiz(updated);
    await storage.quizzes.put(updated);
  }

  async function onAnswer(ans: QuizAnswer) {
    if (isReview) return;
    if (!current) return;
    const next = { ...answers, [current.id]: ans };
    setAnswers(next);
    await persist({ answers: next });
  }

  async function finish() {
    if (!quiz) return;
    const result = computeQuizResult(quiz, answers);
    const finalized: Quiz = {
      ...quiz,
      session: {
        startedAt,
        answers,
        finishedAt: Date.now(),
        result
      }
    };
    await storage.quizzes.put(finalized);
    await updateStatsOnFinish(finalized);
    activeQuiz.setLastResultId(finalized.id);
    window.location.href = withBasePath("/quiz/result/");
  }

  if (!quizId) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="text-sm text-slate-600 dark:text-slate-300">Brak aktywnej sesji quizu.</p>
        <div className="mt-3 flex gap-2">
          <Link href="/quiz/new/">
            <Button>Nowy quiz</Button>
          </Link>
          <Link href="/quiz/">
            <Button variant="secondary">Historia</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="text-sm text-slate-600 dark:text-slate-300">Nie znaleziono quizu o ID: {quizId}</p>
        <div className="mt-3 flex gap-2">
          <Link href="/quiz/">
            <Button variant="secondary">Historia</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">Strona główna</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{isReview ? "Podgląd quizu" : "Quiz"}</h1>
          <p className="truncate text-sm text-slate-600 dark:text-slate-300">
            {quiz.meta.docName} • {quiz.questions.length} pytań
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {remaining !== null && !isReview ? (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs tabular-nums text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
              Pozostało: {Math.floor(remaining / 60)
                .toString()
                .padStart(2, "0")}
              :{(remaining % 60).toString().padStart(2, "0")}
            </div>
          ) : null}
          {!isReview ? (
            <Button variant="secondary" onClick={finish}>
              Zakończ
            </Button>
          ) : (
            <Link href="/quiz/result/">
              <Button variant="secondary" onClick={() => activeQuiz.setLastResultId(quiz.id)}>
                Wynik
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/20">
          <div className="text-sm font-semibold">Kategorie i postęp</div>
          <div className="mt-2 space-y-2">
            {categoryProgress.map((c) => (
              <div key={c.category} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-medium">{c.category}</div>
                  <div className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {c.answered}/{c.total}
                  </div>
                </div>
                <div className="mt-2">
                  <ProgressBar value={c.answered} max={c.total} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-slate-200 p-3 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-200">
            Tryb egzaminu: 1 pytanie na raz • wynik po zakończeniu.
          </div>
        </aside>

        <section>
          <div className="mt-0">
            <ProgressBar value={index + 1} max={quiz.questions.length} />
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/20">
            {current ? (
              <QuestionView
                question={current}
                answer={answers[current.id] ?? null}
                onAnswer={onAnswer}
                revealCorrect={revealNow}
              />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">Brak pytania.</p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <Button variant="secondary" disabled={index <= 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
              Poprzednie
            </Button>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {index + 1} / {quiz.questions.length}
            </div>
            {index < quiz.questions.length - 1 ? (
              <Button onClick={() => setIndex((i) => Math.min(quiz.questions.length - 1, i + 1))}>Następne</Button>
            ) : !isReview ? (
              <Button onClick={finish}>Zakończ</Button>
            ) : (
              <Button variant="secondary" onClick={() => setIndex(0)}>
                Do początku
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
