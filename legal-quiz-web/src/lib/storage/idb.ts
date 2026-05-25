type StoreName = "quizzes" | "banks" | "settings" | "stats";

const DB_NAME = "tp_legal_quiz";
const DB_VERSION = 3;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("quizzes")) db.createObjectStore("quizzes", { keyPath: "id" });
      if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings", { keyPath: "key" });
      if (!db.objectStoreNames.contains("banks")) db.createObjectStore("banks", { keyPath: "id" });
      if (!db.objectStoreNames.contains("stats")) db.createObjectStore("stats", { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

async function tx<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const req = fn(s);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

export const idb = {
  async put<T extends { id: string }>(store: Extract<StoreName, "quizzes" | "banks">, value: T) {
    await tx(store, "readwrite", (s) => s.put(value));
  },
  async get<T>(store: Extract<StoreName, "quizzes" | "banks">, id: string): Promise<T | null> {
    const res = await tx(store, "readonly", (s) => s.get(id));
    return (res as T | undefined) ?? null;
  },
  async list<T>(store: Extract<StoreName, "quizzes" | "banks">): Promise<T[]> {
    const db = await openDb();
    return new Promise<T[]>((resolve, reject) => {
      const t = db.transaction(store, "readonly");
      const s = t.objectStore(store);
      const req = s.getAll();
      req.onsuccess = () => resolve((req.result as T[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error("IndexedDB list failed"));
    });
  },
  async delete(store: Extract<StoreName, "quizzes" | "banks">, id: string) {
    await tx(store, "readwrite", (s) => s.delete(id));
  },
  async kvPut(store: Extract<StoreName, "settings" | "stats">, key: string, value: unknown) {
    await tx(store, "readwrite", (s) => s.put({ key, value }));
  },
  async kvGet<T>(store: Extract<StoreName, "settings" | "stats">, key: string): Promise<T | null> {
    const res = await tx(store, "readonly", (s) => s.get(key));
    return (res as any)?.value ?? null;
  },
  async clear(store: StoreName) {
    await tx(store, "readwrite", (s) => s.clear());
  },
  async resetAll() {
    const db = await openDb();
    db.close();
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("IndexedDB delete failed"));
      req.onblocked = () => reject(new Error("IndexedDB delete blocked (close other tabs)"));
    });
  }
};
