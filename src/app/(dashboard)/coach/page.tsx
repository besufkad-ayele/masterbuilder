"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import CoachTabContent from "@/components/features/dashboard/coach/CoachTabContent";
import { getCoachTab } from "@/components/features/dashboard/coach/coachTabs";
import { StorageService } from "@/services/storageService";

function CoachDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get("tab");
  const activeTab = getCoachTab(rawTab ?? undefined);

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    const token = StorageService.getAuthToken();
    if (!user || !token || user.role !== "COACH") {
      router.replace("/");
    }
  }, [router]);

  return <CoachTabContent tab={activeTab} />;
}

export default function CoachDashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CoachDashboardContent />
    </Suspense>
  );
}
