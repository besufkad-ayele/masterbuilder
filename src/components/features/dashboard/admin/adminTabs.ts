import {
  BookOpen,
  Building2,
  FileText,
  LayoutDashboard,
  Users2,
  Calendar,
  ShieldCheck,
  UserCog,
  BarChart3,
  FileCheck2,
  GraduationCap,
  Megaphone,
  Network
} from "lucide-react";

export const ADMIN_TABS = [
  {
    key: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin?tab=dashboard",
    description: "Overview and command center",
  },
  {
    key: "companies",
    title: "Companies",
    icon: Building2,
    href: "/admin?tab=companies",
    description: "Manage company agreements",
  },
  {
    key: "competencies",
    title: "Competencies",
    icon: BookOpen,
    href: "/admin?tab=competencies",
    description: "Manage competency library",
  },
  {
    key: "grounding",
    title: "Grounding Modules",
    icon: ShieldCheck,
    href: "/admin?tab=grounding",
    description: "Configure grounding module delivery",
  },
  {
    key: "fellows",
    title: "Profile Management",
    icon: UserCog,
    href: "/admin?tab=fellows",
    description: "Manage fellows, facilitators, and admins",
  },
  {
    key: "cohorts",
    title: "Cohorts",
    icon: Calendar,
    href: "/admin?tab=cohorts",
    description: "Create and manage cohorts",
  },
  {
    key: "groups",
    title: "Peer Circles",
    icon: Network,
    href: "/admin?tab=groups",
    description: "Manage coaching groups and assignments",
  },
  {
    key: "coaches",
    title: "Coaches",
    icon: GraduationCap,
    href: "/admin?tab=coaches",
    description: "Manage coach profiles and credentials",
  },
  {
    key: "examinations",
    title: "Examinations",
    icon: FileText,
    href: "/admin?tab=examinations",
    description: "Manage and create competency-linked exams",
  },
  {
    key: "notifications",
    title: "Notifications",
    icon: Megaphone,
    href: "/admin?tab=notifications",
    description: "Broadcast platform-wide updates",
  },
  {
    key: "profile",
    title: "My Profile",
    icon: Users2,
    href: "/admin?tab=profile",
    description: "View and manage your personal profile",
  },
] as const;

export type AdminTabKey = (typeof ADMIN_TABS)[number]["key"];

export const DEFAULT_ADMIN_TAB: AdminTabKey = "dashboard";

export const isAdminTab = (value?: string): value is AdminTabKey =>
  ADMIN_TABS.some((tab) => tab.key === value);

export const getAdminTab = (value?: string): AdminTabKey =>
  isAdminTab(value) ? value : DEFAULT_ADMIN_TAB;
