import type { ReactNode } from "react";
import { Suspense } from "react";

import CoachSidebar from "@/components/features/dashboard/coach/CoachSidebar";
import { CoachDashboardProvider } from "@/context/CoachDashboardContext";

export default function CoachLayout({ children }: { children: ReactNode }) {
  return (
    <CoachDashboardProvider>
      <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading coach workspace…</div>}>
        <CoachSidebar>
          {children}
        </CoachSidebar>
      </Suspense>
    </CoachDashboardProvider>
  );
}
