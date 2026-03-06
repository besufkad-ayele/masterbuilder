import {
  BookOpen,
  Users,
  FileText,
  Award,
  TrendingUp,
  Settings,
  Calendar,
  Target,
  CheckCircle,
  Clock
} from "lucide-react";

export const FELLOW_TABS = [
  {
    key: "dashboard",
    title: "Dashboard",
    href: "/fellow?tab=dashboard",
    icon: TrendingUp,
    description: "Overview and progress",
  },
  {
    key: "learning",
    title: "Learning Path",
    href: "/fellow?tab=learning",
    icon: BookOpen,
    description: "Grounding modules and competencies",
  },
  {
    key: "portfolio",
    title: "Portfolio",
    href: "/fellow?tab=portfolio",
    icon: FileText,
    description: "STAR submissions",
  },
  {
    key: "exams",
    title: "Examinations",
    href: "/fellow?tab=exams",
    icon: Award,
    description: "Competency mastery exams",
  },
  {
    key: "cohort",
    title: "Cohort",
    href: "/fellow?tab=cohort",
    icon: Users,
    description: "Cohort information",
  },
  {
    key: "schedule",
    title: "Schedule",
    href: "/fellow?tab=schedule",
    icon: Calendar,
    description: "Deadlines and events",
  },
  {
    key: "wave-1",
    title: "Wave 1: Foundation",
    href: "/fellow?tab=wave-1",
    icon: Target,
    description: "Wave 1 competencies",
  },
  {
    key: "wave-2",
    title: "Wave 2: Expansion",
    href: "/fellow?tab=wave-2",
    icon: Target,
    description: "Wave 2 competencies",
  },
] as const;

export type FellowTabKey = (typeof FELLOW_TABS)[number]["key"];

export const DEFAULT_FELLOW_TAB: FellowTabKey = "dashboard";

export const isFellowTab = (value?: string): value is FellowTabKey =>
  FELLOW_TABS.some((tab) => tab.key === value) || (value?.startsWith('wave-') ?? false);

export const getFellowTab = (value?: string): FellowTabKey => {
  if (value?.startsWith('wave-')) return value as FellowTabKey;
  return isFellowTab(value) ? value : DEFAULT_FELLOW_TAB;
};
