import AdminCompaniesTab from "@/components/features/dashboard/admin/AdminCompaniesTab";
import AdminCompetenciesTab from "@/components/features/dashboard/admin/AdminCompetenciesTab";
import AdminCohortsTab from "@/components/features/dashboard/admin/AdminCohortsTab";
import AdminDashboardOverview from "@/components/features/dashboard/admin/AdminDashboardOverview";
import ProfileManagementTab from "@/components/features/dashboard/admin/ProfileManagementTab";
import AdminProfileTab from "@/components/features/dashboard/admin/AdminProfileTab";
import AdminGroundingModulesTab from "@/components/features/dashboard/admin/AdminGroundingModulesTab";
import AdminExaminationsTab from "@/components/features/dashboard/admin/AdminExaminationsTab";
import AdminGroupsTab from "@/components/features/dashboard/admin/AdminGroupsTab";
import AdminCoachesTab from "@/components/features/dashboard/admin/AdminCoachesTab";
import AdminNotificationsTab from "@/components/features/dashboard/admin/AdminNotificationsTab";
import { AdminTabKey, getAdminTab } from "@/components/features/dashboard/admin/adminTabs";
import { JSX } from "react";

interface AdminTabContentProps {
  tab?: string;
}

export default function AdminTabContent({ tab }: AdminTabContentProps) {
  const activeTab = getAdminTab(tab);

  const content: Record<AdminTabKey, JSX.Element> = {
    dashboard: <AdminDashboardOverview />,
    companies: <AdminCompaniesTab />,
    fellows: <ProfileManagementTab />,
    competencies: <AdminCompetenciesTab />,
    grounding: <AdminGroundingModulesTab />,
    cohorts: <AdminCohortsTab />,
    groups: <AdminGroupsTab />,
    coaches: <AdminCoachesTab />,
    examinations: <AdminExaminationsTab />,
    notifications: <AdminNotificationsTab />,
    profile: <AdminProfileTab />,
  };

  return content[activeTab];
}
