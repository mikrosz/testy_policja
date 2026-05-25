import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppShell } from "@/components/ui/AppShell";
import { BuiltInBankLoader } from "@/components/banks/BuiltInBankLoader";

export const metadata: Metadata = {
  title: "Testy Policyjne",
  description: "W pełni statyczna platforma quizów offline z ustaw i aktów prawnych (bez backendu)."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-slate-900 dark:bg-bg-dark dark:text-slate-50">
        <ThemeProvider>
          <BuiltInBankLoader />
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
