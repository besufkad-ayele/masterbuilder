"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { AdminTabKey, getAdminTab } from "@/components/features/dashboard/admin/adminTabs";

function TabLoader() {
  return (
    <div className="flex justify-center p-12">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}

const AdminDashboardOverview = dynamic(
  () => import("@/components/features/dashboard/admin/AdminDashboardOverview"),
  { loading: () => <TabLoader /> },
);
const AdminCompaniesTab = dynamic(
  () => import("@/components/features/dashboard/admin/AdminCompaniesTab"),
  { loading: () => <TabLoader /> },
);
const ProfileManagementTab = dynamic(
  () => import("@/components/features/dashboard/admin/ProfileManagementTab"),
  { loading: () => <TabLoader /> },
);
const AdminCompetenciesTab = dynamic(
  () => import("@/components/features/dashboard/admin/AdminCompetenciesTab"),
  { loading: () => <TabLoader /> },
);
const AdminGroundingModulesTab = dynamic(
  () => import("@/components/features/dashboard/admin/AdminGroundingModulesTab"),
  { loading: () => <TabLoader /> },
);
const AdminCohortsTab = dynamic(
  () => import("@/components/features/dashboard/admin/AdminCohortsTab"),
  { loading: () => <TabLoader /> },
);
const AdminGroupsTab = dynamic(
  () => import("@/components/features/dashboard/admin/AdminGroupsTab"),
  { loading: () => <TabLoader /> },
);
const AdminCoachesTab = dynamic(
  () => import("@/components/features/dashboard/admin/AdminCoachesTab"),
  { loading: () => <TabLoader /> },
);
const AdminExaminationsTab = dynamic(
  () => import("@/components/features/dashboard/admin/AdminExaminationsTab"),
  { loading: () => <TabLoader /> },
);
const AdminNotificationsTab = dynamic(
  () => import("@/components/features/dashboard/admin/AdminNotificationsTab"),
  { loading: () => <TabLoader /> },
);
const AdminProfileTab = dynamic(
  () => import("@/components/features/dashboard/admin/AdminProfileTab"),
  { loading: () => <TabLoader /> },
);

interface AdminTabContentProps {
  tab?: string;
}

export default function AdminTabContent({ tab }: AdminTabContentProps) {
  const activeTab = getAdminTab(tab);

  switch (activeTab as AdminTabKey) {
    case "dashboard":
      return <AdminDashboardOverview />;
    case "companies":
      return <AdminCompaniesTab />;
    case "fellows":
      return <ProfileManagementTab />;
    case "competencies":
      return <AdminCompetenciesTab />;
    case "grounding":
      return <AdminGroundingModulesTab />;
    case "cohorts":
      return <AdminCohortsTab />;
    case "groups":
      return <AdminGroupsTab />;
    case "coaches":
      return <AdminCoachesTab />;
    case "examinations":
      return <AdminExaminationsTab />;
    case "notifications":
      return <AdminNotificationsTab />;
    case "profile":
      return <AdminProfileTab />;
    default:
      return <AdminDashboardOverview />;
  }
}
