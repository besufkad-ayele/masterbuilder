"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";

import AdminSidebar from "@/components/features/dashboard/AdminSidebar";
import { AdminDashboardProvider } from "@/context/AdminDashboardContext";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDashboardProvider>
        <AdminSidebar>{children}</AdminSidebar>
      </AdminDashboardProvider>
    </Suspense>
  );
}
