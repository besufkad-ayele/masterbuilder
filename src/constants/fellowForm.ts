// --- Fellow Form Constants ---

export const GENDER_OPTIONS = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Non-binary", label: "Non-binary" },
    { value: "Prefer not to say", label: "Prefer not to say" },
] as const;

export type GenderOption = (typeof GENDER_OPTIONS)[number]["value"];

export const QUALIFICATION_OPTIONS = [
    { value: "High School Diploma", label: "High School Diploma" },
    { value: "Bachelor's Degree", label: "Bachelor's Degree" },
    { value: "Master's Degree", label: "Master's Degree" },
    { value: "MBA", label: "MBA" },
    { value: "PhD", label: "PhD" },
    { value: "Professional Certificate", label: "Professional Certificate" },
    { value: "Other", label: "Other" },
] as const;

export type QualificationOption = (typeof QUALIFICATION_OPTIONS)[number]["value"];

export const PRIMARY_LANGUAGE_OPTIONS = [
    { value: "Amharic", label: "Amharic" },
    { value: "English", label: "English" },
    { value: "French", label: "French" },
    { value: "Arabic", label: "Arabic" },
    { value: "Swahili", label: "Swahili" },
    { value: "Other", label: "Other" },
] as const;

export type PrimaryLanguageOption = (typeof PRIMARY_LANGUAGE_OPTIONS)[number]["value"];

export const AVAILABILITY_OPTIONS = [
    { value: "Weekdays (Morning)", label: "Weekdays (Morning)" },
    { value: "Weekdays (Afternoon)", label: "Weekdays (Afternoon)" },
    { value: "Weekdays (Evening)", label: "Weekdays (Evening)" },
    { value: "Weekends", label: "Weekends" },
    { value: "Flexible", label: "Flexible" },
] as const;

export type AvailabilityOption = (typeof AVAILABILITY_OPTIONS)[number]["value"];

export const LEADERSHIP_TRACK_OPTIONS = [
    { value: "Executive Presence", label: "Executive Presence" },
    { value: "Financial Strategy", label: "Financial Strategy" },
    { value: "People Leadership", label: "People Leadership" },
    { value: "Operational Excellence", label: "Operational Excellence" },
    { value: "Digital Transformation", label: "Digital Transformation" },
    { value: "Entrepreneurial Leadership", label: "Entrepreneurial Leadership" },
    { value: "Other", label: "Other" },
] as const;

export type LeadershipTrackOption = (typeof LEADERSHIP_TRACK_OPTIONS)[number]["value"];

export const FELLOW_STATUS_OPTIONS = [
    { value: "Onboarding", label: "Onboarding" },
    { value: "Active", label: "Active" },
    { value: "Paused", label: "Paused" },
    { value: "Graduated", label: "Graduated" },
    { value: "Competency Reset", label: "Competency Reset" },
] as const;

export type FellowStatusOption = (typeof FELLOW_STATUS_OPTIONS)[number]["value"];
