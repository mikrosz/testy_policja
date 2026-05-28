"use client";

import type { QuizAnswer, QuizQuestion } from "@/lib/types";

export function QuestionView({
  question,
  answer,
  onAnswer,
  revealCorrect
}: {
  question: QuizQuestion;
  answer: QuizAnswer | null;
  onAnswer: (a: QuizAnswer) => void;
  revealCorrect: boolean;
}) {
  return (
    <div>
      <div className="text-sm font-semibold">{question.prompt}</div>
      {question.help ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{question.help}</div> : null}

      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold">Źródło</div>
        </div>
        <div className="mt-1 whitespace-pre-wrap">{question.sourceExcerpt}</div>
      </div>

      <div className="mt-4 space-y-2">
        {question.type === "truefalse" ? (
          <TrueFalse question={question} answer={answer} onAnswer={onAnswer} revealCorrect={revealCorrect} />
        ) : null}
        {question.type === "single" ? (
          <SingleChoice question={question} answer={answer} onAnswer={onAnswer} revealCorrect={revealCorrect} />
        ) : null}
        {question.type === "multiple" ? (
          <MultipleChoice question={question} answer={answer} onAnswer={onAnswer} revealCorrect={revealCorrect} />
        ) : null}
        {question.type === "fillblank" ? (
          <FillBlank question={question} answer={answer} onAnswer={onAnswer} revealCorrect={revealCorrect} />
        ) : null}
      </div>

      {revealCorrect ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
          <div className="font-semibold">Wyjaśnienie</div>
          <div className="mt-1">{question.explanation}</div>
          <div className="mt-1 opacity-80">Podstawa: {question.references.join(", ")}</div>
        </div>
      ) : null}
    </div>
  );
}

function pill(selected: boolean) {
  return selected
    ? "border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/80";
}

function TrueFalse({
  question,
  answer,
  onAnswer,
  revealCorrect
}: {
  question: Extract<QuizQuestion, { type: "truefalse" }>;
  answer: QuizAnswer | null;
  onAnswer: (a: QuizAnswer) => void;
  revealCorrect: boolean;
}) {
  const val = answer?.kind === "boolean" ? answer.value : null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {[true, false].map((v) => {
        const chosen = val === v;
        const correct = revealCorrect ? question.correct === v : null;
        return (
          <button
            key={String(v)}
            className={`rounded-lg border px-3 py-2 text-left text-sm ${pill(chosen)} ${
              revealCorrect && correct !== null
                ? correct
                  ? "ring-2 ring-emerald-400"
                  : chosen
                    ? "ring-2 ring-rose-400"
                    : ""
                : ""
            }`}
            onClick={() => onAnswer({ kind: "boolean", value: v })}
          >
            {v ? "Prawda" : "Fałsz"}
          </button>
        );
      })}
    </div>
  );
}

function SingleChoice({
  question,
  answer,
  onAnswer,
  revealCorrect
}: {
  question: Extract<QuizQuestion, { type: "single" }>;
  answer: QuizAnswer | null;
  onAnswer: (a: QuizAnswer) => void;
  revealCorrect: boolean;
}) {
  const val = answer?.kind === "single" ? answer.choiceId : null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {question.choices.map((c, idx) => {
        const chosen = val === c.id;
        const correct = revealCorrect ? question.correctChoiceId === c.id : null;
        return (
          <button
            key={c.id}
            className={`w-full rounded-xl border px-3 py-3 text-left text-sm ${pill(chosen)} ${
              revealCorrect && correct !== null
                ? correct
                  ? "ring-2 ring-emerald-400"
                  : chosen
                    ? "ring-2 ring-rose-400"
                    : ""
                : ""
            }`}
            onClick={() => onAnswer({ kind: "single", choiceId: c.id })}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
                {indexToLetter(idx)}
              </div>
              <div className="min-w-0">{c.label}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MultipleChoice({
  question,
  answer,
  onAnswer,
  revealCorrect
}: {
  question: Extract<QuizQuestion, { type: "multiple" }>;
  answer: QuizAnswer | null;
  onAnswer: (a: QuizAnswer) => void;
  revealCorrect: boolean;
}) {
  const vals = answer?.kind === "multiple" ? answer.choiceIds : [];
  function toggle(id: string) {
    const next = vals.includes(id) ? vals.filter((x) => x !== id) : [...vals, id];
    onAnswer({ kind: "multiple", choiceIds: next });
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {question.choices.map((c, idx) => {
        const chosen = vals.includes(c.id);
        const correct = revealCorrect ? question.correctChoiceIds.includes(c.id) : null;
        return (
          <button
            key={c.id}
            className={`w-full rounded-xl border px-3 py-3 text-left text-sm ${pill(chosen)} ${
              revealCorrect && correct !== null
                ? correct
                  ? "ring-2 ring-emerald-400"
                  : chosen
                    ? "ring-2 ring-rose-400"
                    : ""
                : ""
            }`}
            onClick={() => toggle(c.id)}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
                {indexToLetter(idx)}
              </div>
              <div className="min-w-0">{c.label}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function FillBlank({
  question,
  answer,
  onAnswer,
  revealCorrect
}: {
  question: Extract<QuizQuestion, { type: "fillblank" }>;
  answer: QuizAnswer | null;
  onAnswer: (a: QuizAnswer) => void;
  revealCorrect: boolean;
}) {
  const val = answer?.kind === "text" ? answer.value : "";
  const correct = revealCorrect ? question.correctText : null;
  return (
    <div>
      <input
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900/80"
        value={val}
        placeholder="Wpisz odpowiedź..."
        onChange={(e) => onAnswer({ kind: "text", value: e.target.value })}
      />
      {revealCorrect && correct ? (
        <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">Poprawnie: {correct}</div>
      ) : null}
    </div>
  );
}

function indexToLetter(i: number) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return letters[i] ?? String(i + 1);
}
