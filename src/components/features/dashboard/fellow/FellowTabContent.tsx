import FellowDashboard from "./FellowDashboard";
import FellowGroundingModules from "./FellowGroundingModules";
import FellowExaminationsTab from "./FellowExaminationsTab";
import FellowPortfolio from "./FellowPortfolio";
import { FellowTabKey, getFellowTab } from "./fellowTabs";
import { JSX } from "react";
import FellowWavesView from "./FellowWavesView";

interface FellowTabContentProps {
  tab?: string;
  fellowId: string;
}

export default function FellowTabContent({ tab, fellowId }: FellowTabContentProps) {
  const activeTab = getFellowTab(tab);

  // Handle dynamic wave tabs
  if (activeTab.startsWith('wave-')) {
    const waveId = activeTab.replace('wave-', '');
    return <FellowWavesView fellowId={fellowId} waveId={waveId} />;
  }

  const content: Record<string, JSX.Element> = {
    dashboard: <FellowDashboard fellowId={fellowId} />,
    learning: <FellowGroundingModules fellowId={fellowId} />,
    portfolio: <FellowPortfolio fellowId={fellowId} />,
    exams: <FellowExaminationsTab fellowId={fellowId} />,
    cohort: <div className="p-8 bg-white rounded-3xl border border-[#E8E4D8]">Cohort Info - Coming Soon</div>,
    schedule: <div className="p-8 bg-white rounded-3xl border border-[#E8E4D8]">Schedule - Coming Soon</div>,
  };

  return content[activeTab] || content.dashboard;
}
