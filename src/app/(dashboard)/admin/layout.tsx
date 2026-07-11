import type { ReactNode } from "react";
import { Suspense } from "react";

import AdminSidebar from "@/components/features/dashboard/AdminSidebar";
import { AdminDashboardProvider } from "@/context/AdminDashboardContext";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminDashboardProvider>
      <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading admin workspace…</div>}>
        <AdminSidebar>
          {children}
        </AdminSidebar>
      </Suspense>
    </AdminDashboardProvider>
  );
}
