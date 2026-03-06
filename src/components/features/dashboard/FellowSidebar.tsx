"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users2, 
  FileText, 
  Calendar,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/fellow",
    icon: LayoutDashboard,
    description: "Your program overview"
  },
  {
    title: "Competencies",
    href: "/fellow/competencies",
    icon: BookOpen,
    description: "Core skill development"
  },
  {
    title: "Fellows",
    href: "/fellow/Fellows",
    icon: Users2,
    description: "Fellow management"
  },
  {
    title: "Examinations",
    href: "/fellow/exams",
    icon: FileText,
    description: "Assessment tracking"
  },
  {
    title: "Schedule",
    href: "/fellow/schedule",
    icon: Calendar,
    description: "Cohort cadence"
  }
];

function Breadcrumb() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  
  const breadcrumbItems = [
    { label: "Home", href: "/fellow" },
    ...pathSegments.slice(1).map((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 2).join("/");
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      return { label, href };
    })
  ];

  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
      {breadcrumbItems.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
          <Link 
            href={item.href}
            className={cn(
              "hover:text-slate-900 transition-colors",
              index === breadcrumbItems.length - 1 && "text-slate-900 font-medium"
            )}
          >
            {item.label}
          </Link>
        </div>
      ))}
    </nav>
  );
}

interface FellowSidebarProps {
  children: ReactNode;
}

export default function FellowSidebar({ children }: FellowSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200">
          <Link href="/fellow" className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <LayoutDashboard className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Fellow Portal</p>
              <p className="text-xs text-slate-500">Leadership Development Learning Hub</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/fellow" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl transition-all group",
                  isActive 
                    ? "bg-blue-50 text-blue-700 border border-blue-200" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "size-10 rounded-lg flex items-center justify-center transition-colors",
                  isActive 
                    ? "bg-blue-100 text-blue-700" 
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                )}>
                  <item.icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-slate-200">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-700 mb-1">Current Cohort</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="size-2 rounded-full bg-emerald-500" />
              2024-B Active
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}
