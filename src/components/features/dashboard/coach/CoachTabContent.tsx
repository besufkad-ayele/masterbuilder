import CoachDashboardOverview from "@/components/features/dashboard/coach/CoachDashboardOverview";
import CoachFellowsTab from "@/components/features/dashboard/coach/CoachFellowsTab";
import CoachPortfolioEvaluation from "@/components/features/dashboard/coach/CoachPortfolioEvaluation";
import CoachProfileTab from "@/components/features/dashboard/coach/CoachProfileTab";
import { CoachTabKey, getCoachTab } from "@/components/features/dashboard/coach/coachTabs";
import { JSX } from "react";

interface CoachTabContentProps {
  tab?: string;
}

export default function CoachTabContent({ tab }: CoachTabContentProps) {
  const activeTab = getCoachTab(tab);

  const content: Record<CoachTabKey, JSX.Element> = {
    dashboard: <CoachDashboardOverview />,
    fellows: <CoachFellowsTab />,
    evaluation: <CoachPortfolioEvaluation />,
    profile: <CoachProfileTab />,
  };

  return content[activeTab];
}
