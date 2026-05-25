import type {
  BankQuestionType,
  QuestionBank,
  QuestionBankQuestion,
  Quiz,
  QuizChoice,
  QuizConfig,
  QuizQuestion
} from "@/lib/types";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function toQuizQuestion(bank: QuestionBank, q: QuestionBankQuestion): QuizQuestion | null {
  const base = {
    id: crypto.randomUUID(),
    type: "truefalse" as const,
    prompt: normalize(q.question),
    sourceExcerpt: `Bank: ${bank.title}\nKategoria: ${q.category}\n\n${q.question}`.trim(),
    explanation: q.explanation?.trim() || `Pytanie z banku: ${bank.title}.`,
    references: [`Bank: ${bank.title}`, `Kategoria: ${q.category}`],
    category: q.category,
    bankTitle: bank.title,
    bankQuestionId: q.id,
    difficulty: q.difficulty
  };

  if (q.type === "truefalse") {
    return { ...base, type: "truefalse", correct: q.correct };
  }

  if (q.type === "fillblank") {
    const answer = normalize(q.answer);
    if (!answer) return null;
    return { ...base, type: "fillblank", correctText: answer };
  }

  if (q.type === "single_choice") {
    const choices: QuizChoice[] = q.choices.map((label, idx) => ({ id: String(idx), label }));
    if (q.correctIndex < 0 || q.correctIndex >= choices.length) return null;
    return { ...base, type: "single", choices, correctChoiceId: String(q.correctIndex) };
  }

  if (q.type === "multiple_choice") {
    const choices: QuizChoice[] = q.choices.map((label, idx) => ({ id: String(idx), label }));
    const correctChoiceIds = [...new Set(q.correctIndexes.map((i) => String(i)))].filter((id) =>
      choices.some((c) => c.id === id)
    );
    if (!correctChoiceIds.length) return null;
    return { ...base, type: "multiple", choices, correctChoiceIds };
  }

  return null;
}

function filterQuestions(bank: QuestionBank, categories: string[] | undefined, types: BankQuestionType[] | undefined, difficulty: QuizConfig["difficulty"]) {
  const catSet = categories?.length ? new Set(categories) : null;
  const typeSet = types?.length ? new Set(types) : null;
  const anyDifficulty = bank.questions.some((q) => q.difficulty);

  return bank.questions.filter((q) => {
    if (catSet && !catSet.has(q.category)) return false;
    if (typeSet && !typeSet.has(q.type)) return false;
    if (anyDifficulty && q.difficulty && q.difficulty !== difficulty) return false;
    return true;
  });
}

export function buildBankQuiz(bank: QuestionBank, config: QuizConfig): Quiz {
  const categories = config.categories ?? [];
  const questionTypes = config.questionTypes ?? [];

  const pool = filterQuestions(
    bank,
    categories.length ? categories : undefined,
    questionTypes.length ? questionTypes : undefined,
    config.difficulty
  );

  const ordered = config.randomize === false ? pool : shuffle(pool);
  const questions: QuizQuestion[] = [];
  const seenPrompts = new Set<string>();

  for (const raw of ordered) {
    const qq = toQuizQuestion(bank, raw);
    if (!qq) continue;
    if (qq.prompt.length < 40) continue;
    const k = `${qq.type}::${qq.category ?? ""}::${qq.prompt}`.toLowerCase();
    if (seenPrompts.has(k)) continue;
    seenPrompts.add(k);
    questions.push(qq);
    if (questions.length >= config.questionCount) break;
  }

  return {
    id: crypto.randomUUID(),
    meta: { docId: bank.id, docName: bank.title, createdAt: Date.now() },
    config: { ...config, bankId: bank.id },
    questions,
    session: { startedAt: Date.now(), answers: {} }
  };
}

export function buildRetryIncorrectQuiz(original: Quiz): Quiz {
  const incorrect = original.session?.result?.items.filter((i) => !i.isCorrect) ?? [];
  const ids = new Set<string | number>(
    incorrect
      .map((i) => i.bankQuestionId)
      .filter((x): x is string | number => x !== undefined)
  );
  const questions = original.questions.filter((q) => (q.bankQuestionId !== undefined ? ids.has(q.bankQuestionId) : false));

  return {
    id: crypto.randomUUID(),
    meta: { docId: original.meta.docId, docName: `${original.meta.docName} – powtórka błędów`, createdAt: Date.now() },
    config: original.config,
    questions,
    session: { startedAt: Date.now(), answers: {} }
  };
}
