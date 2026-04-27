import {
  LayoutDashboard,
  Users,
  UserCircle,
  FileSearch,
  LogOut
} from "lucide-react";

export const COACH_TABS = [
  {
    key: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/coach?tab=dashboard",
    description: "Overview of your assigned Peer Circles",
  },
  {
    key: "fellows",
    title: "My Fellows",
    icon: Users,
    href: "/coach?tab=fellows",
    description: "View and support your assigned fellows",
  },
  {
    key: "evaluation",
    title: "Portfolio Hub",
    icon: FileSearch,
    href: "/coach?tab=evaluation",
    description: "Smart portfolio evaluation & feedback",
  },
  {
    key: "profile",
    title: "My Profile",
    icon: UserCircle,
    href: "/coach?tab=profile",
    description: "Manage your personal profile",
  },
] as const;

export type CoachTabKey = (typeof COACH_TABS)[number]["key"];

export const DEFAULT_COACH_TAB: CoachTabKey = "dashboard";

export const isCoachTab = (value?: string): value is CoachTabKey =>
  COACH_TABS.some((tab) => tab.key === value);

export const getCoachTab = (value?: string): CoachTabKey =>
  isCoachTab(value) ? value : DEFAULT_COACH_TAB;
