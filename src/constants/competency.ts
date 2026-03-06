export const COMPETENCY_DOMAINS = [
    "Leading Yourself (LY)",
    "Leading Others (LO)",
    "Leading the Organization (LTO)"
] as const;

export type CompetencyDomain = typeof COMPETENCY_DOMAINS[number];
