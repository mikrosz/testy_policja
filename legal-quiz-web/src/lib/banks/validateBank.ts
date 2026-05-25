import type {
  BankFillBlank,
  BankMultipleChoice,
  BankSingleChoice,
  BankTrueFalse,
  QuestionBank,
  QuestionBankQuestion
} from "@/lib/types";

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asArray(v: unknown): unknown[] | null {
  return Array.isArray(v) ? v : null;
}

function normalizeCategory(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function safeId(v: unknown): string | number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) return v.trim();
  return crypto.randomUUID();
}

function normalizeType(t: string) {
  const v = t.toLowerCase().trim();
  if (v === "single_choice" || v === "single") return "single_choice";
  if (v === "multiple_choice" || v === "multiple") return "multiple_choice";
  if (v === "truefalse" || v === "true_false") return "truefalse";
  if (v === "fillblank" || v === "fill_in_blank") return "fillblank";
  return null;
}

function normalizeDifficulty(v: unknown): "easy" | "medium" | "hard" | undefined {
  if (typeof v !== "string") return undefined;
  const d = v.toLowerCase().trim();
  if (d === "easy" || d === "medium" || d === "hard") return d;
  return undefined;
}

function validateQuestion(raw: any): QuestionBankQuestion | null {
  const typeRaw = asString(raw?.type);
  const type = typeRaw ? normalizeType(typeRaw) : null;
  const question = asString(raw?.question);
  const category = asString(raw?.category) ?? "Ogólne";
  if (!type || !question || question.trim().length < 10) return null;

  const base = {
    id: safeId(raw?.id),
    category: normalizeCategory(category),
    question: question.trim(),
    type,
    difficulty: normalizeDifficulty(raw?.difficulty),
    explanation: isNonEmptyString(raw?.explanation) ? String(raw.explanation).trim() : undefined
  } as any;

  if (type === "single_choice") {
    const choices = asArray(raw?.choices)?.filter(isNonEmptyString).map((x) => x.trim()) ?? [];
    const correctIndex = typeof raw?.correctIndex === "number" ? raw.correctIndex : -1;
    if (choices.length < 2) return null;
    if (correctIndex < 0 || correctIndex >= choices.length) return null;
    const q: BankSingleChoice = { ...(base as any), type: "single_choice", choices, correctIndex };
    return q;
  }

  if (type === "multiple_choice") {
    const choices = asArray(raw?.choices)?.filter(isNonEmptyString).map((x) => x.trim()) ?? [];
    const correctIndexes = (asArray(raw?.correctIndexes) ?? [])
      .filter((n) => typeof n === "number" && Number.isInteger(n))
      .map((n) => Number(n));
    if (choices.length < 2) return null;
    if (!correctIndexes.length) return null;
    if (correctIndexes.some((i) => i < 0 || i >= choices.length)) return null;
    const q: BankMultipleChoice = { ...(base as any), type: "multiple_choice", choices, correctIndexes: [...new Set(correctIndexes)] };
    return q;
  }

  if (type === "truefalse") {
    const correct = typeof raw?.correct === "boolean" ? raw.correct : null;
    if (correct === null) return null;
    const q: BankTrueFalse = { ...(base as any), type: "truefalse", correct };
    return q;
  }

  if (type === "fillblank") {
    const answer = asString(raw?.answer);
    if (!answer || !answer.trim()) return null;
    const q: BankFillBlank = { ...(base as any), type: "fillblank", answer: answer.trim() };
    return q;
  }

  return null;
}

async function sha256Hex(text: string) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function parseAndValidateBank(
  jsonText: string,
  opts?: { builtIn?: boolean }
): Promise<{ bank: QuestionBank; warnings: string[] }> {
  let raw: any;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    throw new Error("Nieprawidłowy JSON.");
  }

  const title = asString(raw?.title)?.trim();
  if (!title) throw new Error('Brak pola "title".');

  const questionsRaw = asArray(raw?.questions);
  if (!questionsRaw) throw new Error('Brak pola "questions" (tablica).');

  const questions: QuestionBankQuestion[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (const q of questionsRaw) {
    const v = validateQuestion(q);
    if (!v) {
      warnings.push("Pominięto błędne pytanie (niezgodny format).");
      continue;
    }
    const key = `${v.type}::${v.category}::${v.question}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push(v);
  }

  if (!questions.length) throw new Error("Nie znaleziono żadnych poprawnych pytań w banku.");

  const categories = [...new Set(questions.map((q) => q.category))].sort((a, b) => a.localeCompare(b, "pl"));
  const questionCountDeclared = typeof raw?.question_count === "number" ? raw.question_count : undefined;

  const canonicalForId = JSON.stringify(
    {
      title,
      question_count: questionCountDeclared ?? questions.length,
      questions
    },
    null,
    0
  );
  const id = await sha256Hex(canonicalForId);

  const bank: QuestionBank = {
    id,
    title,
    importedAt: Date.now(),
    enabled: true,
    builtIn: Boolean(opts?.builtIn),
    questionCountDeclared,
    categories,
    questions
  };

  return { bank, warnings };
}

