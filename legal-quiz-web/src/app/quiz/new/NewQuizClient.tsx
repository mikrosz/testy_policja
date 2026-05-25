"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { NumberInput } from "@/components/ui/NumberInput";
import { CheckboxGroup } from "@/components/ui/CheckboxGroup";
import { storage } from "@/lib/storage/storage";
import type { BankQuestionType, QuestionBank, QuizConfig } from "@/lib/types";
import { buildBankQuiz } from "@/lib/quiz/buildBankQuiz";
import { ToastHost, useToasts } from "@/components/ui/Toast";
import { activeQuiz } from "@/lib/quiz/activeQuiz";
import { withBasePath } from "@/lib/nav/withBasePath";

const BANK_QUESTION_TYPES: { key: BankQuestionType; label: string }[] = [
  { key: "single_choice", label: "Jednokrotnego wyboru" },
  { key: "multiple_choice", label: "Wielokrotnego wyboru" },
  { key: "truefalse", label: "Prawda / Fałsz" },
  { key: "fillblank", label: "Uzupełnij lukę" }
];

export function NewQuizClient() {
  const searchParams = useSearchParams();
  const preselectId = searchParams.get("bankId") ?? "";

  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [bankId, setBankId] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategories, setShowCategories] = useState(false);
  const [count, setCount] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<QuizConfig["difficulty"]>("medium");
  const [types, setTypes] = useState<BankQuestionType[]>(["truefalse", "single_choice"]);
  const [randomize, setRandomize] = useState(true);
  const [withTimer, setWithTimer] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState<number>(1800);
  const [isBuilding, setIsBuilding] = useState(false);
  const { toasts, pushToast, removeToast } = useToasts();

  useEffect(() => {
    async function refresh() {
      const loaded = (await storage.banks.list()).filter((b) => b.enabled);
      loaded.sort((a, b) => a.title.localeCompare(b.title, "pl"));
      setBanks(loaded);
      const chosen = loaded.find((b) => b.id === preselectId)?.id ?? loaded[0]?.id ?? "";
      setBankId((prev) => (prev ? prev : chosen));
    }
    void refresh();
    const onBanks = () => void refresh();
    window.addEventListener("tp_banks_updated", onBanks);
    return () => window.removeEventListener("tp_banks_updated", onBanks);
  }, [preselectId]);

  const bank = useMemo(() => banks.find((b) => b.id === bankId) ?? null, [banks, bankId]);
  const categoryOptions = useMemo(() => (bank?.categories ?? []).map((c) => ({ value: c, label: c })), [bank]);

  useEffect(() => {
    // Always start collapsed when bank changes (and avoid any stale UI state).
    setShowCategories(false);
  }, [bankId]);

  async function onBuild() {
    if (!bank) return;
    if (types.length === 0) {
      pushToast({ kind: "warning", title: "Brak typów", message: "Zaznacz co najmniej jeden typ pytania." });
      return;
    }
    setIsBuilding(true);
    try {
      const config: QuizConfig = {
        bankId: bank.id,
        categories,
        questionTypes: types,
        randomize,
        questionCount: count,
        difficulty,
        types: [],
        timer: withTimer ? { enabled: true, seconds: timerSeconds } : { enabled: false, seconds: 0 }
      };
      const quiz = buildBankQuiz(bank, config);
      if (quiz.questions.length === 0) {
        throw new Error("Brak pytań spełniających wybrane filtry (kategorie/typy).");
      }
      await storage.quizzes.put(quiz);
      activeQuiz.setActiveId(quiz.id);
      pushToast({ kind: "success", title: "Utworzono quiz", message: "Przenoszę do sesji..." });
      window.location.href = withBasePath("/quiz/session/");
    } catch (e) {
      pushToast({
        kind: "error",
        title: "Nie udało się utworzyć quizu",
        message: e instanceof Error ? e.message : "Nieznany błąd."
      });
    } finally {
      setIsBuilding(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Ustawienia quizu</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">Dopasuj parametry testu i rozpocznij.</p>
        </div>
        <Link href="/">
          <Button variant="secondary">Wróć</Button>
        </Link>
      </div>

      <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/20">
        <Select
          label="Bank pytań"
          value={bankId}
          onChange={(v) => {
            setBankId(v);
            setCategories([]);
            setShowCategories(false);
          }}
          options={banks.map((b) => ({ value: b.id, label: b.title }))}
          placeholder={banks.length ? "Wybierz..." : "Dodaj bank w public/question-banks/ lub zaimportuj w „Banki”"}
        />

        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-medium">Kategorie</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
                Opcjonalnie — wybierz kategorie, jeśli chcesz zawęzić zakres.
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-900"
              onClick={() => setShowCategories((v) => !v)}
            >
              {showCategories ? "Zwiń" : "Wybierz"}
              {categories.length ? ` (${categories.length})` : ""}
            </button>
          </div>
          {showCategories ? (
            <div className="mt-3">
              <CheckboxGroup
                label=""
                values={categories}
                onChange={(vals) => setCategories(vals)}
                options={categoryOptions}
              />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <NumberInput label="Liczba pytań" value={count} onChange={setCount} min={1} max={200} step={1} />
          <Select
            label="Trudność (jeśli dostępna w banku)"
            value={difficulty}
            onChange={(v) => setDifficulty(v as QuizConfig["difficulty"])}
            options={[
              { value: "easy", label: "Łatwa" },
              { value: "medium", label: "Średnia" },
              { value: "hard", label: "Trudna" }
            ]}
          />
        </div>

        <CheckboxGroup
          label="Typy pytań"
          values={types}
          onChange={(vals) => setTypes(vals as BankQuestionType[])}
          options={BANK_QUESTION_TYPES.map((t) => ({ value: t.key, label: t.label }))}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={randomize}
            onChange={(e) => setRandomize(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
          />
          Losuj kolejność pytań
        </label>

        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={withTimer}
              onChange={(e) => setWithTimer(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
            />
            Timer (tryb egzaminu)
          </label>
          <NumberInput
            label="Czas (sekundy)"
            value={timerSeconds}
            onChange={setTimerSeconds}
            min={60}
            max={4 * 60 * 60}
            step={60}
            disabled={!withTimer}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onBuild} disabled={!bank || isBuilding}>
            {isBuilding ? "Przygotowuję..." : "Start"}
          </Button>
        </div>
      </div>

      <ToastHost toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
