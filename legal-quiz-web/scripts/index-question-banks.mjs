import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const dir = path.join(root, "public", "question-banks");
const outPath = path.join(dir, "index.json");

function normalizeType(t) {
  const v = String(t || "").toLowerCase();
  if (v === "single_choice" || v === "single") return "single_choice";
  if (v === "multiple_choice" || v === "multiple") return "multiple_choice";
  if (v === "truefalse" || v === "true_false") return "truefalse";
  if (v === "fillblank" || v === "fill_in_blank") return "fillblank";
  if (v === "open" || v === "otwarte") return "open";
  return null;
}

function safeString(v) {
  return typeof v === "string" ? v.trim() : "";
}

async function main() {
  let files = [];
  try {
    files = await readdir(dir);
  } catch {
    // No directory; write empty index.
    await writeFile(outPath, JSON.stringify({ version: 1, banks: [] }, null, 2), "utf8");
    return;
  }

  const jsonFiles = files.filter((f) => f.toLowerCase().endsWith(".json") && f.toLowerCase() !== "index.json");
  const banks = [];

  for (const file of jsonFiles) {
    const full = path.join(dir, file);
    try {
      const text = await readFile(full, "utf8");
      const raw = JSON.parse(text);
      const title = safeString(raw?.title) || file.replace(/\.json$/i, "");
      const questions = Array.isArray(raw?.questions) ? raw.questions : [];
      const categories = new Set();
      const types = new Set();
      for (const q of questions) {
        const cat = safeString(q?.category) || "Ogólne";
        categories.add(cat);
        const nt = normalizeType(q?.type);
        if (nt) types.add(nt);
      }
      banks.push({
        path: `/question-banks/${file}`,
        title,
        question_count: typeof raw?.question_count === "number" ? raw.question_count : undefined,
        detected_question_count: questions.length,
        categories: [...categories].sort(),
        types: [...types].sort()
      });
    } catch {
      // Skip malformed bank file in index.
    }
  }

  banks.sort((a, b) => a.title.localeCompare(b.title, "pl"));
  const payload = { version: 1, generatedAt: new Date().toISOString(), banks };
  await writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`[index-question-banks] Wrote ${outPath} (${banks.length} banks)`);
}

await main();
