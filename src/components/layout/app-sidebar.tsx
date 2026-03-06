"use client"

import * as React from "react"
import {
  BarChart3,
  BookOpen,
  Building2,
  FileCheck2,
  FileText,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  Users2,
  UserCog,
} from "lucide-react"


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { TeamSwitcher } from "./team-switcher"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { StorageService } from "@/services/storageService"

// Admin sidebar data based on the shadcn sidebar-07 layout.
const data = {
  teams: [
    {
      name: "Lead Life",
      logo: ShieldCheck,
      plan: "Governance",
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "#",
      icon: LayoutDashboard,
      isActive: true,
      permissions: ["Super Admin", "Profile Admin", "Content Admin"],
      items: [
        { title: "Dashboard", url: "/admin?tab=dashboard", permissions: ["Super Admin", "Profile Admin", "Content Admin"] },
        { title: "Performance", url: "/admin?tab=performance", permissions: ["Super Admin", "Profile Admin", "Content Admin"] },
      ],
    },
    {
      title: "Company Ops",
      url: "#",
      icon: Building2,
      permissions: ["Super Admin", "Profile Admin"],
      items: [
        { title: "Companies", url: "/admin?tab=companies", permissions: ["Super Admin", "Profile Admin"] },
        { title: "Profile Management", url: "/admin?tab=fellows", permissions: ["Super Admin", "Profile Admin"] },
      ],
    },
    {
      title: "Learning Systems",
      url: "#",
      icon: BookOpen,
      permissions: ["Super Admin", "Content Admin"],
      items: [
        { title: "Competencies", url: "/admin?tab=competencies", permissions: ["Super Admin", "Content Admin"] },
        { title: "Cohorts", url: "/admin?tab=cohorts", permissions: ["Super Admin", "Content Admin"] },
        { title: "Grounding", url: "/admin?tab=grounding", permissions: ["Super Admin", "Content Admin"] },
      ],
    },
    {
      title: "Evaluation",
      url: "#",
      icon: FileCheck2,
      permissions: ["Super Admin", "Content Admin"],
      items: [
        { title: "Portfolio Review", url: "/admin?tab=portfolio", permissions: ["Super Admin", "Content Admin"] },
        { title: "Quiz Evaluation", url: "/admin?tab=quiz", permissions: ["Super Admin", "Content Admin"] },
      ],
    },
  ],
  projects: [
    { name: "Program Health", url: "/admin?tab=dashboard", icon: Gauge, permissions: ["Super Admin"] },
    { name: "Global Roster", url: "/admin?tab=fellows", icon: Users2, permissions: ["Super Admin", "Profile Admin"] },
  ],
  settings: [
    { name: "My Profile", url: "/admin?tab=profile", icon: Settings2, permissions: ["Super Admin", "Profile Admin", "Content Admin"] },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    setUser(StorageService.getCurrentUser());
  }, []);

  const adminTitle = user?.title || "Super Admin";

  const filteredNavMain = data.navMain
    .filter(item => !item.permissions || item.permissions.includes(adminTitle))
    .map(item => ({
      ...item,
      items: item.items?.filter(subItem => !subItem.permissions || subItem.permissions.includes(adminTitle))
    }));

  const filteredProjects = data.projects.filter(item =>
    !item.permissions || item.permissions.includes(adminTitle)
  );

  const filteredSettings = data.settings.filter(item =>
    !item.permissions || item.permissions.includes(adminTitle)
  );

  const sidebarUser = {
    name: user?.name || "Admin User",
    email: user?.email || "admin@leadlife.com",
    avatar: "/avatars/shadcn.jpg",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavProjects projects={filteredProjects} label="Admin Tools" />
        <NavProjects projects={filteredSettings} label="System" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
