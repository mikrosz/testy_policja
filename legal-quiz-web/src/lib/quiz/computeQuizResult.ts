import type { Quiz, QuizAnswer, QuizQuestion, QuizResult } from "@/lib/types";

function isCorrect(question: QuizQuestion, answer: QuizAnswer | undefined): boolean {
  if (!answer) return false;
  switch (question.type) {
    case "truefalse":
      return answer.kind === "boolean" && answer.value === question.correct;
    case "fillblank":
      return answer.kind === "text" && answer.value.trim().toLowerCase() === question.correctText.trim().toLowerCase();
    case "single":
      return answer.kind === "single" && answer.choiceId === question.correctChoiceId;
    case "multiple": {
      if (answer.kind !== "multiple") return false;
      const a = new Set(answer.choiceIds);
      const c = new Set(question.correctChoiceIds);
      if (a.size !== c.size) return false;
      for (const x of c) if (!a.has(x)) return false;
      return true;
    }
    default:
      return false;
  }
}

export function computeQuizResult(quiz: Quiz, answers: Record<string, QuizAnswer>): QuizResult {
  const items = quiz.questions.map((q) => {
    const ok = isCorrect(q, answers[q.id]);
    return {
      questionId: q.id,
      prompt: q.prompt,
      isCorrect: ok,
      explanation: q.explanation,
      references: q.references,
      category: q.category,
      bankQuestionId: q.bankQuestionId
    };
  });
  const correctCount = items.filter((i) => i.isCorrect).length;
  const totalCount = items.length;
  const scorePercent = totalCount ? Math.round((correctCount / totalCount) * 100) : 0;

  const weakMap = new Map<string, number>();
  for (const it of items) {
    if (it.isCorrect) continue;
    for (const ref of it.references) weakMap.set(ref, (weakMap.get(ref) ?? 0) + 1);
  }
  const weakTopics = [...weakMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([k]) => k);

  const catMap = new Map<string, { correct: number; total: number }>();
  for (const it of items) {
    const c = it.category ?? "Ogólne";
    const v = catMap.get(c) ?? { correct: 0, total: 0 };
    v.total += 1;
    if (it.isCorrect) v.correct += 1;
    catMap.set(c, v);
  }
  const categoryStats = [...catMap.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.total - a.total);

  return { totalCount, correctCount, scorePercent, weakTopics, categoryStats, items };
}

