"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, LogOut } from "lucide-react";

import { COACH_TABS, getCoachTab } from "./coachTabs";
import { ResponsiveDashboardShell } from "@/components/layout/ResponsiveDashboardShell";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/sessionStore";

interface CoachSidebarProps {
  children: ReactNode;
}

function CoachSidebarPanel({
  isSidebarOpen,
  onSignOut,
}: {
  isSidebarOpen: boolean;
  onSignOut: () => void;
}) {
  const searchParams = useSearchParams();
  const activeTab = getCoachTab(searchParams.get("tab") ?? undefined);
  const currentUser = useSessionStore((s) => s.user);

  return (
    <aside
      className={cn(
        "flex h-full max-h-dvh flex-col overflow-hidden border-r border-border bg-card transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-80" : "w-20",
      )}
    >
      <div className={cn("shrink-0 border-b border-border transition-all duration-300", isSidebarOpen ? "p-6" : "px-3 py-6")}>
        <Link
          href="/coach?tab=dashboard"
          className={cn(
            "flex items-center gap-3",
            isSidebarOpen ? "justify-start" : "justify-center",
          )}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LayoutDashboard className="size-5" />
          </div>
          <div
            className={cn(
              "min-w-0 overflow-hidden transition-all duration-300",
              isSidebarOpen ? "flex-1 opacity-100" : "w-0 opacity-0",
            )}
          >
            <p className="truncate text-lg font-semibold leading-tight text-foreground">Coach Portal</p>
            <p className="truncate text-xs leading-tight text-muted-foreground">MasterBuilder Academy</p>
          </div>
        </Link>
      </div>

      <nav className={cn("min-h-0 flex-1 space-y-2 overflow-y-auto transition-all duration-300", isSidebarOpen ? "p-6" : "p-3")}>
        {COACH_TABS.map((item) => {
          const isActive = item.key === activeTab;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl border transition-all",
                isSidebarOpen ? "p-4" : "justify-center p-3",
                isActive
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-transparent text-foreground/80 hover:bg-muted/70 hover:text-foreground",
              )}
              title={!isSidebarOpen ? item.title : undefined}
            >
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-lg transition-colors",
                  isSidebarOpen ? "size-10" : "size-8",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground",
                )}
              >
                <item.icon className="size-5" />
              </div>
              <div
                className={cn(
                  "min-w-0 flex-1 overflow-hidden transition-all duration-300",
                  isSidebarOpen ? "opacity-100" : "w-0 opacity-0",
                )}
              >
                <p className="truncate text-sm font-medium leading-tight">{item.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className={cn("shrink-0 border-t border-border transition-all duration-300", isSidebarOpen ? "p-6" : "p-3")}>
        <div className={cn("rounded-xl bg-muted/70 transition-all duration-300", isSidebarOpen ? "p-4" : "p-2")}>
          {isSidebarOpen ? (
            <>
              <p className="mb-1 text-xs font-medium text-foreground">Coach Profile</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="size-2 rounded-full bg-emerald-500" />
                {currentUser?.name || "Coach"}
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                <LogOut className="size-3.5" />
                Sign Out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onSignOut}
              className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-destructive/10 p-2 text-destructive transition-colors hover:bg-destructive/20"
              title="Sign Out"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default function CoachSidebar({ children }: CoachSidebarProps) {
  const router = useRouter();
  const hydrate = useSessionStore((s) => s.hydrate);
  const clearSession = useSessionStore((s) => s.clearSession);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const handleSignOut = () => {
    clearSession();
    router.push("/login");
  };

  const sidebar = <CoachSidebarPanel isSidebarOpen={isSidebarOpen} onSignOut={handleSignOut} />;

  return (
    <ResponsiveDashboardShell
      mobileTitle="Coach Portal"
      sidebar={sidebar}
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
    >
      {children}
    </ResponsiveDashboardShell>
  );
}
