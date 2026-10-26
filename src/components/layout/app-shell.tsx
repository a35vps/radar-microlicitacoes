import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "./app-sidebar";

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="bg-background">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur">
            <SidebarTrigger aria-label="Alternar menu lateral" />
            <Separator orientation="vertical" className="h-5" />
            <p className="text-sm text-muted-foreground">
              Fonte oficial: <span className="font-medium text-foreground">PNCP</span> · Foco MG / RMBH · Teto R$ 15 mil
            </p>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
