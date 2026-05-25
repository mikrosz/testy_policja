import type { QuestionBank } from "@/lib/types";
import { parseAndValidateBank } from "@/lib/banks/validateBank";

export type BuiltInBankIndex = {
  version: number;
  generatedAt?: string;
  banks: { path: string; title: string; detected_question_count: number; categories: string[]; types: string[] }[];
};

async function fetchJsonText(path: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const full = path.startsWith("/") ? `${basePath}${path}` : `${basePath}/${path}`;
  const res = await fetch(full, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Nie udało się pobrać banku: ${path}`);
  return res.text();
}

export async function loadBuiltInBanks(): Promise<QuestionBank[]> {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const indexRes = await fetch(`${basePath}/question-banks/index.json`, { cache: "no-store" });
  if (!indexRes.ok) return [];
  const index = (await indexRes.json()) as BuiltInBankIndex;
  if (!Array.isArray(index.banks)) return [];

  const banks: QuestionBank[] = [];
  for (const b of index.banks) {
    try {
      const txt = await fetchJsonText(b.path);
      const { bank } = await parseAndValidateBank(txt, { builtIn: true });
      banks.push(bank);
    } catch {
      // skip invalid built-in
    }
  }
  return banks;
}
