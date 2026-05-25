const KEY_ACTIVE = "tp_active_quiz_id";
const KEY_LAST_RESULT = "tp_last_result_quiz_id";

export const activeQuiz = {
  getActiveId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(KEY_ACTIVE);
  },
  setActiveId(id: string) {
    localStorage.setItem(KEY_ACTIVE, id);
  },
  clearActiveId() {
    localStorage.removeItem(KEY_ACTIVE);
  },
  getLastResultId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(KEY_LAST_RESULT);
  },
  setLastResultId(id: string) {
    localStorage.setItem(KEY_LAST_RESULT, id);
  }
};

