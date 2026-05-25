import type { Quiz } from "@/lib/types";
import { storage } from "@/lib/storage/storage";

export type UserStats = {
  version: 1;
  totalFinishedQuizzes: number;
  totalQuestions: number;
  totalCorrect: number;
  currentStreakDays: number;
  bestStreakDays: number;
  lastFinishedDay: string | null; // YYYY-MM-DD
};

const KEY = "user_stats_v1";

function dayKey(ts: number) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function getUserStats(): Promise<UserStats> {
  const existing = await storage.stats.get<UserStats>(KEY);
  return (
    existing ?? {
      version: 1,
      totalFinishedQuizzes: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      currentStreakDays: 0,
      bestStreakDays: 0,
      lastFinishedDay: null
    }
  );
}

export async function updateStatsOnFinish(quiz: Quiz) {
  const finishedAt = quiz.session?.finishedAt ?? Date.now();
  const res = quiz.session?.result;
  if (!res) return;

  const stats = await getUserStats();
  const today = dayKey(finishedAt);

  let nextStreak = stats.currentStreakDays;
  if (!stats.lastFinishedDay) {
    nextStreak = 1;
  } else if (stats.lastFinishedDay === today) {
    nextStreak = stats.currentStreakDays;
  } else {
    const prev = new Date(stats.lastFinishedDay);
    const cur = new Date(today);
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
    nextStreak = diffDays === 1 ? stats.currentStreakDays + 1 : 1;
  }

  const updated: UserStats = {
    ...stats,
    totalFinishedQuizzes: stats.totalFinishedQuizzes + 1,
    totalQuestions: stats.totalQuestions + res.totalCount,
    totalCorrect: stats.totalCorrect + res.correctCount,
    currentStreakDays: nextStreak,
    bestStreakDays: Math.max(stats.bestStreakDays, nextStreak),
    lastFinishedDay: today
  };

  await storage.stats.put(KEY, updated);
}

