import type { ReactNode } from "react";
import { Suspense } from "react";

import AdminSidebar from "@/components/features/dashboard/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminSidebar>
        {children}
      </AdminSidebar>
    </Suspense>
  );
}
