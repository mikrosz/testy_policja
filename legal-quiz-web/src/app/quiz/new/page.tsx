import { Suspense } from "react";
import { NewQuizClient } from "@/app/quiz/new/NewQuizClient";

export default function NewQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
          <div className="text-sm text-slate-600 dark:text-slate-300">Ładowanie ustawień...</div>
        </div>
      }
    >
      <NewQuizClient />
    </Suspense>
  );
}

