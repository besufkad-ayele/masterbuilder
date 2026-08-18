import ExcelJS from "exceljs";
import type { Cohort, Company } from "@/types";

export interface ParsedFellowImportRow {
  rowNumber: number;
  full_name: string;
  email: string;
  company_id?: string;
  organization?: string;
  highest_qualification?: string;
  current_role?: string;
  leadership_experience_years?: number;
  learning_goals?: string[];
  gender?: string;
  age?: number;
  primary_language?: string;
  availability?: string;
  cohort_id?: string;
  leadership_track?: string;
  key_skills?: string[];
  personality_style?: string;
  constraints?: string;
  errors: string[];
}

const normalizeString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeHeader = (value: string) =>
  (value ?? "")
    .toLowerCase()
    .replace(/\ufeff/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeCell = (value: unknown): string => {
  const text = normalizeString(value);
  if (!text) return "";

  return ["n/a", "na", "none", "null", "undefined"].includes(text.toLowerCase())
    ? ""
    : text;
};

const parseListValue = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map(item => normalizeString(item))
      .filter(Boolean)
      .flatMap(item => item.split(/[;,]/).map(part => part.trim()))
      .filter(Boolean);
  }

  const text = normalizeString(value);
  if (!text) return [];

  return text
    .split(/[;,]/)
    .map(item => item.trim())
    .filter(Boolean);
};

const parseNumber = (value: unknown): number | undefined => {
  const text = normalizeString(value);
  if (!text) return undefined;
  const parsed = Number(text.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map(value => value.trim());
};

const matchHeader = (headers: Record<string, string>, possibleKeys: string[]): string | undefined => {
  const normalizedKeys = possibleKeys.map(key => normalizeHeader(key));

  for (const [headerName, mappedValue] of Object.entries(headers)) {
    const normalizedHeader = normalizeHeader(headerName);
    if (normalizedKeys.includes(normalizedHeader)) {
      return mappedValue;
    }
  }

  return undefined;
};

const buildRecordFromHeaderMap = (
  row: Record<string, string>,
  headerMap: Record<string, string>
): Partial<ParsedFellowImportRow> => {
  const record: Partial<ParsedFellowImportRow> = {};

  const fullName = matchHeader(headerMap, ["full name", "full_name", "name"]);
  const email = matchHeader(headerMap, ["email", "email address"]);
  const companyId = matchHeader(headerMap, ["company id", "company_id", "company", "parent organization"]);
  const org = matchHeader(headerMap, ["organization", "department", "business unit", "specific business unit", "specific business unit department"]);
  const highestQualification = matchHeader(headerMap, [
    "highest educational qualification",
    "highest eduactional qulification",
    "highest eduactional qualification",
    "highest education",
    "qualification",
    "highest educational qulification",
  ]);
  const currentRole = matchHeader(headerMap, ["current role", "role", "job title", "position"]);
  const leadershipYears = matchHeader(headerMap, [
    "years of experience in leadership position",
    "leadership experience years",
    "years of leadership experience",
    "leadership experience",
    "experience in leadership position",
  ]);
  const learningGoals = matchHeader(headerMap, ["learning goals", "learning_goals", "learning goal"]);
  const gender = matchHeader(headerMap, ["gender"]);
  const age = matchHeader(headerMap, ["age"]);
  const availability = matchHeader(headerMap, ["availability", "availability days times", "availability days times "]);
  const primaryLanguage = matchHeader(headerMap, ["primary language", "primary_language"]);
  const leadershipTrack = matchHeader(headerMap, ["leadership track", "leadership_track", "leadership area", "leadership track interest area"]);
  const keySkills = matchHeader(headerMap, ["key skills", "key_skills", "skills"]);
  const personalityStyle = matchHeader(headerMap, ["personality style", "personality_style", "working style"]);
  const constraints = matchHeader(headerMap, ["constraints", "constraints travel conflicts"]);

  if (fullName) record.full_name = normalizeCell(row[fullName]);
  if (email) record.email = normalizeCell(row[email]);
  if (companyId) record.company_id = normalizeCell(row[companyId]);
  if (org) record.organization = normalizeCell(row[org]);
  if (highestQualification) record.highest_qualification = normalizeCell(row[highestQualification]);
  if (currentRole) record.current_role = normalizeCell(row[currentRole]);
  if (leadershipYears) record.leadership_experience_years = parseNumber(normalizeCell(row[leadershipYears]));
  if (learningGoals) record.learning_goals = parseListValue(normalizeCell(row[learningGoals]));
  if (gender) record.gender = normalizeCell(row[gender]);
  if (age) record.age = parseNumber(normalizeCell(row[age]));
  if (availability) record.availability = normalizeCell(row[availability]);
  if (primaryLanguage) record.primary_language = normalizeCell(row[primaryLanguage]);
  if (leadershipTrack) record.leadership_track = normalizeCell(row[leadershipTrack]);
  if (keySkills) record.key_skills = parseListValue(normalizeCell(row[keySkills]));
  if (personalityStyle) record.personality_style = normalizeCell(row[personalityStyle]);
  if (constraints) record.constraints = normalizeCell(row[constraints]);

  return record;
};

const mapCompanyIdFromName = (
  rawCompanyValue: string | undefined,
  companies: Company[]
): string | undefined => {
  if (!rawCompanyValue) return undefined;

  const trimmed = rawCompanyValue.trim();
  const matchById = companies.find(company => company.id === trimmed || company.name === trimmed);
  if (matchById) return matchById.id;

  const fuzzyMatch = companies.find(company =>
    company.name.toLowerCase().includes(trimmed.toLowerCase()) ||
    trimmed.toLowerCase().includes(company.name.toLowerCase())
  );

  return fuzzyMatch?.id;
};

const mapCohortIdFromName = (
  rawCohortValue: string | undefined,
  cohorts: Cohort[]
): string | undefined => {
  if (!rawCohortValue) return undefined;

  const trimmed = rawCohortValue.trim();
  const matchById = cohorts.find(cohort => cohort.id === trimmed || cohort.name === trimmed);
  if (matchById) return matchById.id;

  const fuzzyMatch = cohorts.find(cohort =>
    cohort.name.toLowerCase().includes(trimmed.toLowerCase()) ||
    trimmed.toLowerCase().includes(cohort.name.toLowerCase())
  );

  return fuzzyMatch?.id;
};

export const parseFellowImportFile = async (
  file: File,
  companies: Company[] = [],
  cohorts: Cohort[] = []
): Promise<ParsedFellowImportRow[]> => {
  const fileName = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();

  let rows: Record<string, string>[] = [];

  if (fileName.endsWith(".csv")) {
    const text = new TextDecoder().decode(buffer);
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0]);
    for (let i = 1; i < lines.length; i += 1) {
      const values = parseCsvLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? "";
      });
      rows.push(row);
    }
  } else {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const rawRows = worksheet.getSheetValues();
    if (rawRows.length < 2) return [];

    const firstRow = rawRows[1] ?? [];
    const headers = Array.isArray(firstRow)
      ? firstRow.map((value: any) => normalizeString(value))
      : [];

    for (let rowIndex = 2; rowIndex <= rawRows.length - 1; rowIndex += 1) {
      const values = rawRows[rowIndex] ?? [];
      if (!Array.isArray(values) || values.every((value: any) => value === null || value === undefined || String(value).trim() === "")) {
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((header: string, index: number) => {
        const value = values[index];
        row[header] = normalizeString(value);
      });
      rows.push(row);
    }
  }

  if (!rows.length) return [];

  const parsedRows: ParsedFellowImportRow[] = rows.map((row, index) => {
    const headerMap = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, key])
    );

    const record = buildRecordFromHeaderMap(row, headerMap);
    const errors: string[] = [];

    const companyId =
      record.company_id && record.company_id.trim()
        ? mapCompanyIdFromName(record.company_id, companies) || record.company_id
        : undefined;

    const cohortId =
      record.cohort_id && record.cohort_id.trim()
        ? mapCohortIdFromName(record.cohort_id, cohorts) || record.cohort_id
        : undefined;

    if (!record.full_name || !record.full_name.trim()) errors.push("Missing full name");
    if (!record.email || !record.email.trim()) errors.push("Missing email");
    if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) errors.push("Invalid email format");

    return {
      rowNumber: index + 2,
      full_name: record.full_name || "",
      email: record.email || "",
      company_id: companyId,
      organization: record.organization,
      highest_qualification: record.highest_qualification,
      current_role: record.current_role,
      leadership_experience_years: record.leadership_experience_years,
      learning_goals: record.learning_goals,
      gender: record.gender,
      age: record.age,
      primary_language: record.primary_language,
      availability: record.availability,
      cohort_id: cohortId,
      leadership_track: record.leadership_track,
      key_skills: record.key_skills,
      personality_style: record.personality_style,
      constraints: record.constraints,
      errors,
    };
  });

  return parsedRows;
};

export const buildFellowImportPayload = (
  row: ParsedFellowImportRow,
  companyId: string,
  companyName?: string
) => ({
  full_name: row.full_name,
  email: row.email,
  organization: row.organization || companyName || "",
  status: "Onboarding" as const,
  key_skills: row.key_skills || [],
  learning_goals: row.learning_goals || [],
  age: row.age ?? 0,
  company_id: companyId,
  gender: row.gender || "",
  highest_qualification: row.highest_qualification || "",
  current_role: row.current_role || "",
  leadership_experience_years: row.leadership_experience_years ?? 0,
  primary_language: row.primary_language || "",
  availability: row.availability || "",
  leadership_track: row.leadership_track || "",
  personality_style: row.personality_style || "",
  constraints: row.constraints || "",
  is_active: true,
  fellow_id: "",
});
