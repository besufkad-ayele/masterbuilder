"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { CoachTabKey, getCoachTab } from "@/components/features/dashboard/coach/coachTabs";

function TabLoader() {
  return (
    <div className="flex justify-center p-12">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}

const CoachDashboardOverview = dynamic(
  () => import("@/components/features/dashboard/coach/CoachDashboardOverview"),
  { loading: () => <TabLoader /> },
);
const CoachFellowsTab = dynamic(
  () => import("@/components/features/dashboard/coach/CoachFellowsTab"),
  { loading: () => <TabLoader /> },
);
const CoachPortfolioEvaluation = dynamic(
  () => import("@/components/features/dashboard/coach/CoachPortfolioEvaluation"),
  { loading: () => <TabLoader /> },
);
const CoachProfileTab = dynamic(
  () => import("@/components/features/dashboard/coach/CoachProfileTab"),
  { loading: () => <TabLoader /> },
);

interface CoachTabContentProps {
  tab?: string;
}

export default function CoachTabContent({ tab }: CoachTabContentProps) {
  const activeTab = getCoachTab(tab);

  switch (activeTab as CoachTabKey) {
    case "dashboard":
      return <CoachDashboardOverview />;
    case "fellows":
      return <CoachFellowsTab />;
    case "evaluation":
      return <CoachPortfolioEvaluation />;
    case "profile":
      return <CoachProfileTab />;
    default:
      return <CoachDashboardOverview />;
  }
}
