import { AdminTabKey } from "./adminTabs";

export const ROLE_PERMISSIONS: Record<string, AdminTabKey[]> = {
    "System Administrator": [
        "dashboard",
        "companies",
        "competencies",
        "grounding",
        "fellows",
        "cohorts",
        "groups",
        "examinations",
        "notifications",
        "profile"
    ],
    "Super Admin": [
        "dashboard",
        "companies",
        "competencies",
        "grounding",
        "fellows",
        "cohorts",
        "groups",
        "examinations",
        "notifications",
        "profile"
    ],
    "Executive Director": [
        "dashboard",
        "companies",
        "fellows",
        "groups",
        "notifications",
        "profile"
    ],
    "Profile Admin": [
        "dashboard",
        "companies",
        "fellows",
        "groups",
        "notifications",
        "profile"
    ],
    "Program Coordinator": [
        "companies",
        "cohorts",
        "fellows",
        "groups",
        "notifications",
        "profile"
    ],
    "Content Manager": [
        "competencies",
        "grounding",
        "examinations",
        "notifications",
        "profile"
    ],
    "Content Admin": [
        "competencies",
        "grounding",
        "examinations",
        "notifications",
        "profile"
    ],
    "FACILITATOR": [
        "profile"
    ]
};

export const getAllowedTabs = (role: string, title?: string): AdminTabKey[] => {
    if (role === 'FACILITATOR') return ROLE_PERMISSIONS["FACILITATOR"];
    if (role === 'ADMIN') {
        return title ? ROLE_PERMISSIONS[title] || ROLE_PERMISSIONS["System Administrator"] : ROLE_PERMISSIONS["System Administrator"];
    }
    return [];
};
