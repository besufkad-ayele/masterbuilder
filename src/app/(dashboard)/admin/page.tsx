"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import AdminTabContent from "@/components/features/dashboard/admin/AdminTabContent";
import { getAdminTab } from "@/components/features/dashboard/admin/adminTabs";
import { StorageService } from "@/services/storageService";
import { getAllowedTabs } from "@/components/features/dashboard/admin/permissions";

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get("tab");
  const activeTab = getAdminTab(rawTab ?? undefined);

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const allowedTabs = getAllowedTabs(user.role, user.title);

    // If no tab specified or current tab not allowed, redirect to first allowed
    if (!rawTab || !allowedTabs.includes(activeTab as any)) {
      if (allowedTabs.length > 0) {
        router.push(`/admin?tab=${allowedTabs[0]}`);
      } else {
        router.push("/login");
      }
    }
  }, [activeTab, rawTab, router]);

  return <AdminTabContent tab={activeTab} />;
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
