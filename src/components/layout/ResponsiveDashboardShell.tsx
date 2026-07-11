"use client";

import { ReactNode } from "react";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface ResponsiveDashboardShellProps {
  children: ReactNode;
  sidebar: ReactNode;
  mobileTitle: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function ResponsiveDashboardShell({
  children,
  sidebar,
  mobileTitle,
  isSidebarOpen = true,
  onToggleSidebar,
}: ResponsiveDashboardShellProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden h-full shrink-0 overflow-hidden lg:block">{sidebar}</div>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
          <p className="truncate text-sm font-semibold text-foreground">{mobileTitle}</p>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex h-full w-[min(20rem,90vw)] flex-col p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>{mobileTitle}</SheetTitle>
                <SheetDescription>Dashboard navigation</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-hidden">{sidebar}</div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className={cn(
                "fixed top-4 z-50 hidden size-10 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all hover:bg-primary/90 lg:flex",
                isSidebarOpen ? "left-[19.5rem]" : "left-[4.5rem]",
              )}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? <ChevronRight className="size-5" /> : <Menu className="size-5" />}
            </button>
          )}

          <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
