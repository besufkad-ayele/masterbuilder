import { AdminTabKey } from "./adminTabs";

export const ROLE_PERMISSIONS: Record<string, AdminTabKey[]> = {
    "System Administrator": [
        "dashboard",
        "companies",
        "competencies",
        "grounding",
        "fellows",
        "cohorts",
        "examinations",
        "profile"
    ],
    "Super Admin": [
        "dashboard",
        "companies",
        "competencies",
        "grounding",
        "fellows",
        "cohorts",
        "examinations",
        "profile"
    ],
    "Executive Director": [
        "dashboard",
        "companies",
        "fellows",
        "profile"
    ],
    "Profile Admin": [
        "dashboard",
        "companies",
        "fellows",
        "profile"
    ],
    "Program Coordinator": [
        "companies",
        "cohorts",
        "fellows",
        "profile"
    ],
    "Content Manager": [
        "competencies",
        "grounding",
        "examinations",
        "profile"
    ],
    "Content Admin": [
        "competencies",
        "grounding",
        "examinations",
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
