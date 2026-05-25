"use client";

import { useEffect } from "react";
import { loadBuiltInBanks } from "@/lib/banks/builtInBanks";
import { storage } from "@/lib/storage/storage";

export function BuiltInBankLoader() {
  useEffect(() => {
    void (async () => {
      const builtIns = await loadBuiltInBanks();
      if (!builtIns.length) return;

      const existing = await storage.banks.list();
      const existingBuiltInIds = new Set(existing.filter((b) => b.builtIn).map((b) => b.id));
      const newBuiltInIds = new Set(builtIns.map((b) => b.id));

      // Upsert built-ins (preserve enabled flag if user changed it).
      for (const b of builtIns) {
        const prev = await storage.banks.get(b.id);
        await storage.banks.put(prev ? { ...b, enabled: prev.enabled } : b);
      }

      // Remove old built-in banks that are no longer present in /public/question-banks/.
      for (const id of existingBuiltInIds) {
        if (!newBuiltInIds.has(id)) await storage.banks.delete(id);
      }

      window.dispatchEvent(new Event("tp_banks_updated"));
    })();
  }, []);

  return null;
}
