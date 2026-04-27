"use client"

import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, ReactNode } from "react"
import { ChevronRight, LayoutDashboard, LogOut, Menu } from "lucide-react"

import { COACH_TABS, getCoachTab } from "./coachTabs"
import { cn } from "@/lib/utils"
import { StorageService } from "@/services/storageService"

interface CoachSidebarProps {
  children: ReactNode
}

export default function CoachSidebar({ children }: CoachSidebarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = getCoachTab(searchParams.get("tab") ?? undefined)

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (!user || user.role !== 'COACH') {
      // Basic check, full check will be in the page/layout
      setCurrentUser(user);
    } else {
      setCurrentUser(user);
    }
  }, []);

  const handleSignOut = () => {
    StorageService.clearSession();
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "h-screen overflow-y-auto bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-80" : "w-20"
      )}>
        {/* Sidebar Header */}
        <div className={cn(
          "p-6 border-b border-border transition-all duration-300",
          !isSidebarOpen && "px-3 py-6"
        )}>
          <Link href="/coach?tab=dashboard" className="flex items-center gap-3">
            <div className={cn(
              "rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-all duration-300",
              isSidebarOpen ? "size-10" : "size-10 mx-auto"
            )}>
              <LayoutDashboard className="size-5" />
            </div>
            <div className={cn(
              "transition-all duration-300 overflow-hidden",
              isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}>
              <p className="text-lg font-semibold text-foreground whitespace-nowrap">Coach Portal</p>
              <p className="text-xs text-muted-foreground whitespace-nowrap">MasterBuilder Academy</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 space-y-2 transition-all duration-300",
          isSidebarOpen ? "p-6" : "p-3"
        )}>
          {COACH_TABS.map((item) => {
            const isActive = item.key === activeTab

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-start gap-3 rounded-xl transition-all group border",
                  isSidebarOpen ? "p-4" : "p-3 justify-center",
                  isActive
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "border-transparent text-foreground/80 hover:text-foreground hover:bg-muted/70"
                )}
                title={!isSidebarOpen ? item.title : undefined}
              >
                <div
                  className={cn(
                    "rounded-lg flex items-center justify-center transition-colors shrink-0",
                    isSidebarOpen ? "size-10" : "size-8",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                </div>
                <div className={cn(
                  "flex-1 min-w-0 transition-all duration-300 overflow-hidden",
                  isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
                )}>
                  <p className="font-medium text-sm whitespace-nowrap">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className={cn(
          "border-t border-border transition-all duration-300",
          isSidebarOpen ? "p-6" : "p-3"
        )}>
          <div className={cn(
            "rounded-xl bg-muted/70 transition-all duration-300",
            isSidebarOpen ? "p-4" : "p-2"
          )}>
            {isSidebarOpen ? (
              <>
                <p className="text-xs font-medium text-foreground mb-1">Coach Profile</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="size-2 rounded-full bg-emerald-500" />
                  {currentUser?.name || "Coach"}
                </div>
                <button
                  onClick={handleSignOut}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center p-2 rounded-lg text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="size-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative bg-muted/30">
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={cn(
            "fixed top-4 z-50 size-10 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center",
            isSidebarOpen ? "left-84" : "left-22"
          )}
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isSidebarOpen ? <ChevronRight className="size-5" /> : <Menu className="size-5" />}
        </button>

        {/* Main Content Area */}
        <div className="max-w-6xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
