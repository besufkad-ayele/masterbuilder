import type { ReactNode } from "react";
import { Suspense } from "react";

import CoachSidebar from "@/components/features/dashboard/coach/CoachSidebar";

export default function CoachLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CoachSidebar>
        {children}
      </CoachSidebar>
    </Suspense>
  );
}
