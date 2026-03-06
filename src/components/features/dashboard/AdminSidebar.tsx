"use client"

import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, ReactNode } from "react"
import { ChevronRight, LayoutDashboard, LogOut } from "lucide-react"

import { ADMIN_TABS, getAdminTab } from "@/components/features/dashboard/admin/adminTabs"
import { getAllowedTabs } from "./admin/permissions"
import { cn } from "@/lib/utils"
import { StorageService } from "@/services/storageService"

function Breadcrumb() {
  const searchParams = useSearchParams();
  const activeTab = getAdminTab(searchParams.get("tab") ?? undefined);
  const activeItem = ADMIN_TABS.find((tab) => tab.key === activeTab);

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      <div className="flex items-center">
        <Link href="/admin?tab=dashboard" className="hover:text-foreground transition-colors">

        </Link>
      </div>
      <ChevronRight className="w-4 h-4 mx-2" />
      <div className="flex items-center text-foreground font-medium">{activeItem?.title ?? "Dashboard"}</div>
    </nav>
  );
}

interface AdminSidebarProps {
  children: ReactNode
}

export default function AdminSidebar({ children }: AdminSidebarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = getAdminTab(searchParams.get("tab") ?? undefined)

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleSignOut = () => {
    StorageService.clearSession();
    router.push("/login");
  };

  const allowedTabs = getAllowedTabs(currentUser?.role, currentUser?.title);
  const filteredTabs = ADMIN_TABS.filter(tab => allowedTabs.includes(tab.key));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-80 h-screen overflow-y-auto bg-card border-r border-border flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border">
          <Link href="/admin?tab=dashboard" className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <LayoutDashboard className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Admin Console</p>
              <p className="text-xs text-muted-foreground">{currentUser?.title || "Leadership Development"}</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-2">
          {filteredTabs.map((item) => {
            const isActive = item.key === activeTab

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl transition-all group border",
                  isActive
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "border-transparent text-foreground/80 hover:text-foreground hover:bg-muted/70"
                )}
              >
                <div
                  className={cn(
                    "size-10 rounded-lg flex items-center justify-center transition-colors",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-border">
          <div className="rounded-xl bg-muted/70 p-4">
            <p className="text-xs font-medium text-foreground mb-1">System Status</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="size-2 rounded-full bg-emerald-500" />
              Logged in as {currentUser?.name || "User"}
            </div>
            <button
              onClick={handleSignOut}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors cursor-pointer"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </button>
          </div>
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto">
        {/* Sticky Breadcrumb */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Breadcrumb />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-12">
          {children}
        </div>
      </main>
    </div>
  )
}