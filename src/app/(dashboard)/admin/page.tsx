"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import AdminTabContent from "@/components/features/dashboard/admin/AdminTabContent";
import { getAdminTab } from "@/components/features/dashboard/admin/adminTabs";
import { StorageService } from "@/services/storageService";
import { getAllowedTabs } from "@/components/features/dashboard/admin/permissions";
import { auth } from "@/lib/firebase";

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get("tab");
  const activeTab = getAdminTab(rawTab ?? undefined);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const user = StorageService.getCurrentUser();

      if (!firebaseUser || !user) {
        StorageService.clearSession();
        router.push("/login");
        return;
      }

      const allowedTabs = getAllowedTabs(user.role, user.title);

      if (!rawTab || !allowedTabs.includes(activeTab as any)) {
        if (allowedTabs.length > 0) {
          router.push(`/admin?tab=${allowedTabs[0]}`);
        } else {
          router.push("/login");
        }
        return;
      }

      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [activeTab, rawTab, router]);

  if (!authReady) {
    return <div className="p-8 text-sm text-muted-foreground">Checking session...</div>;
  }

  return <AdminTabContent tab={activeTab} />;
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
