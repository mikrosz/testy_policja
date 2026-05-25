import type { Quiz, QuestionBank } from "@/lib/types";
import { idb } from "@/lib/storage/idb";

export const storage = {
  quizzes: {
    list: () => idb.list<Quiz>("quizzes"),
    get: (id: string) => idb.get<Quiz>("quizzes", id),
    put: (quiz: Quiz) => idb.put("quizzes", quiz),
    delete: (id: string) => idb.delete("quizzes", id)
  },
  banks: {
    list: () => idb.list<QuestionBank>("banks"),
    get: (id: string) => idb.get<QuestionBank>("banks", id),
    put: (bank: QuestionBank) => idb.put("banks", bank),
    delete: (id: string) => idb.delete("banks", id)
  },
  stats: {
    get: <T,>(key: string) => idb.kvGet<T>("stats", key),
    put: (key: string, value: unknown) => idb.kvPut("stats", key, value)
  },
  resetAll: () => idb.resetAll()
};
