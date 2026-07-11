"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { getFellowTab } from "./fellowTabs";
import { useFellowDashboard } from "@/hooks/use-dashboard";

function TabLoader() {
  return (
    <div className="flex justify-center p-12">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}

const FellowDashboard = dynamic(() => import("./FellowDashboard"), { loading: () => <TabLoader /> });
const FellowGroundingModules = dynamic(() => import("./FellowGroundingModules"), {
  loading: () => <TabLoader />,
});
const FellowExaminationsTab = dynamic(() => import("./FellowExaminationsTab"), {
  loading: () => <TabLoader />,
});
const FellowPortfolio = dynamic(() => import("./FellowPortfolio"), { loading: () => <TabLoader /> });
const FellowWavesView = dynamic(() => import("./FellowWavesView"), { loading: () => <TabLoader /> });

interface FellowTabContentProps {
  tab?: string;
  fellowId: string;
}

export default function FellowTabContent({ tab, fellowId }: FellowTabContentProps) {
  const { data: dashboardData } = useFellowDashboard(fellowId);
  const activeTab = getFellowTab(tab);
  const hasEnabledExams = (dashboardData?.examinations || []).some(
    (exam: { is_enabled?: boolean }) => exam?.is_enabled === true,
  );

  if (activeTab.startsWith("wave-")) {
    const waveId = activeTab.replace("wave-", "");
    return <FellowWavesView fellowId={fellowId} waveId={waveId} />;
  }

  switch (activeTab) {
    case "dashboard":
      return <FellowDashboard fellowId={fellowId} />;
    case "learning":
      return <FellowGroundingModules fellowId={fellowId} />;
    case "portfolio":
      return <FellowPortfolio fellowId={fellowId} />;
    case "exams":
      return hasEnabledExams ? (
        <FellowExaminationsTab fellowId={fellowId} />
      ) : (
        <FellowDashboard fellowId={fellowId} />
      );
    case "cohort":
      return (
        <div className="rounded-3xl border border-[#E8E4D8] bg-white p-8">Cohort Info - Coming Soon</div>
      );
    case "schedule":
      return (
        <div className="rounded-3xl border border-[#E8E4D8] bg-white p-8">Schedule - Coming Soon</div>
      );
    default:
      return <FellowDashboard fellowId={fellowId} />;
  }
}
