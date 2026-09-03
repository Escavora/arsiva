import { ArsivaProvider } from "@/components/arsiva/store";
import { AppShell } from "@/components/arsiva/shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ArsivaProvider>
      <AppShell>{children}</AppShell>
    </ArsivaProvider>
  );
}
