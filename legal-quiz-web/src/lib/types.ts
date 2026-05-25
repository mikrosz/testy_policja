export type QuizQuestionType = "single" | "multiple" | "truefalse" | "fillblank";

export type BankQuestionType = "single_choice" | "multiple_choice" | "truefalse" | "fillblank";

export type QuestionBankQuestionBase = {
  id: string | number;
  category: string;
  question: string;
  type: BankQuestionType;
  difficulty?: "easy" | "medium" | "hard";
  explanation?: string;
};

export type BankSingleChoice = QuestionBankQuestionBase & {
  type: "single_choice";
  choices: string[];
  correctIndex: number;
};

export type BankMultipleChoice = QuestionBankQuestionBase & {
  type: "multiple_choice";
  choices: string[];
  correctIndexes: number[];
};

export type BankTrueFalse = QuestionBankQuestionBase & {
  type: "truefalse";
  correct: boolean;
};

export type BankFillBlank = QuestionBankQuestionBase & {
  type: "fillblank";
  answer: string;
};

export type QuestionBankQuestion = BankSingleChoice | BankMultipleChoice | BankTrueFalse | BankFillBlank;

export type QuestionBank = {
  id: string; // content hash
  title: string;
  importedAt: number;
  enabled: boolean;
  builtIn: boolean;
  questionCountDeclared?: number;
  categories: string[];
  questions: QuestionBankQuestion[];
};

export type QuizConfig = {
  bankId?: string;
  categories?: string[];
  questionTypes?: BankQuestionType[];
  randomize?: boolean;
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  types: QuizQuestionType[]; // reserved for future; keep empty
  timer: { enabled: boolean; seconds: number };
};

export type QuizQuestionBase = {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  help?: string;
  sourceExcerpt: string;
  explanation: string;
  references: string[];
  category?: string;
  bankTitle?: string;
  bankQuestionId?: string | number;
  difficulty?: "easy" | "medium" | "hard";
};

export type QuizChoice = { id: string; label: string };

export type QuizQuestion =
  | (QuizQuestionBase & { type: "truefalse"; correct: boolean })
  | (QuizQuestionBase & { type: "fillblank"; correctText: string })
  | (QuizQuestionBase & { type: "single"; choices: QuizChoice[]; correctChoiceId: string })
  | (QuizQuestionBase & { type: "multiple"; choices: QuizChoice[]; correctChoiceIds: string[] });

export type QuizAnswer =
  | { kind: "boolean"; value: boolean }
  | { kind: "text"; value: string }
  | { kind: "single"; choiceId: string }
  | { kind: "multiple"; choiceIds: string[] };

export type QuizResult = {
  totalCount: number;
  correctCount: number;
  scorePercent: number;
  weakTopics: string[];
  categoryStats: { category: string; correct: number; total: number }[];
  items: {
    questionId: string;
    prompt: string;
    isCorrect: boolean;
    explanation: string;
    references: string[];
    category?: string;
    bankQuestionId?: string | number;
  }[];
};

export type Quiz = {
  id: string;
  meta: { docId: string; docName: string; createdAt: number };
  config: QuizConfig;
  questions: QuizQuestion[];
  session?: {
    startedAt: number;
    finishedAt?: number;
    answers: Record<string, QuizAnswer>;
    result?: QuizResult;
  };
};

