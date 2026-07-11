import type {
  AdminDashboardState,
  CoachDashboardState,
  CoachProfile,
  Cohort,
  Company,
  Competency,
  CompetencyDictionary,
  CompetencyLibrary,
  FacilitatorProfile,
  FellowDashboardState,
  FellowProfile,
  GroundingModule,
  GroundingResult,
  LDPNotification,
  PeerCircle,
  PhaseProgress,
  Portfolio,
  User,
  UserRole,
  Wave,
  WaveCompetency,
  WaveResult,
  BehavioralIndicator,
  AdminProfile,
} from '@/types';

type ApiRecord = Record<string, unknown>;

function toIso(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function mapUser(raw: ApiRecord): User {
  return {
    id: String(raw.id),
    email: String(raw.email),
    name: String(raw.name),
    role: raw.role as UserRole,
    title: raw.title ? String(raw.title) : undefined,
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapCompany(raw: ApiRecord): Company {
  return {
    id: String(raw.id),
    name: String(raw.name),
    industry: raw.industry ? String(raw.industry) : undefined,
    size_range: (raw.sizeRange ?? raw.size_range) as string | undefined,
    contact_email: (raw.contactEmail ?? raw.contact_email) as string | undefined,
    logoUrl: (raw.logoUrl ?? raw.logo_url) as string | undefined,
    website: raw.website ? String(raw.website) : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    location: raw.location ? String(raw.location) : undefined,
    subsidiaries: raw.subsidiaries as Company['subsidiaries'],
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapCohort(raw: ApiRecord): Cohort {
  return {
    id: String(raw.id),
    company_id: String(raw.companyId ?? raw.company_id),
    name: String(raw.name),
    description: raw.description ? String(raw.description) : undefined,
    wave_level: String(raw.waveLevel ?? raw.wave_level ?? ''),
    capacity: raw.capacity as number | undefined,
    duration_months: (raw.durationMonths ?? raw.duration_months) as number | undefined,
    enrollment_mode: (raw.enrollmentMode ?? raw.enrollment_mode) as Cohort['enrollment_mode'],
    status: raw.status as Cohort['status'],
    grounding_module_id: (raw.groundingModuleId ?? raw.grounding_module_id) as string | undefined,
    is_grounding_active: Boolean(raw.isGroundingActive ?? raw.is_grounding_active),
    start_date: raw.startDate ? toIso(raw.startDate) : raw.start_date as string | undefined,
    end_date: raw.endDate ? toIso(raw.endDate) : raw.end_date as string | undefined,
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapFellow(raw: ApiRecord): FellowProfile {
  return {
    id: String(raw.id),
    user_id: String(raw.userId ?? raw.user_id),
    fellow_id: String(raw.fellowId ?? raw.fellow_id),
    full_name: String(raw.fullName ?? raw.full_name),
    email: String(raw.email),
    highest_qualification: String(raw.highestQualification ?? raw.highest_qualification ?? ''),
    current_role: String(raw.currentRole ?? raw.current_role ?? ''),
    organization: String(raw.organization ?? ''),
    leadership_experience_years: Number(raw.leadershipExperienceYears ?? raw.leadership_experience_years ?? 0),
    key_skills: (raw.keySkills ?? raw.key_skills ?? []) as string[],
    learning_goals: (raw.learningGoals ?? raw.learning_goals ?? []) as string[],
    gender: String(raw.gender ?? ''),
    age: Number(raw.age ?? 0),
    primary_language: String(raw.primaryLanguage ?? raw.primary_language ?? ''),
    availability: String(raw.availability ?? ''),
    leadership_track: String(raw.leadershipTrack ?? raw.leadership_track ?? ''),
    personality_style: String(raw.personalityStyle ?? raw.personality_style ?? ''),
    constraints: String(raw.constraints ?? ''),
    status: (raw.status ?? 'Onboarding') as FellowProfile['status'],
    company_id: String(raw.companyId ?? raw.company_id),
    cohort_id: (raw.cohortId ?? raw.cohort_id) as string | undefined,
    peer_circle_id: (raw.peerCircleId ?? raw.peer_circle_id) as string | undefined,
    current_wave_id: (raw.currentWaveId ?? raw.current_wave_id) as string | undefined,
    is_active: Boolean(raw.isActive ?? raw.is_active ?? true),
    phone: raw.phone ? String(raw.phone) : undefined,
    location: raw.location ? String(raw.location) : undefined,
    bio: raw.bio ? String(raw.bio) : undefined,
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapFacilitator(raw: ApiRecord): FacilitatorProfile {
  const companies = raw.companies as ApiRecord[] | undefined;
  return {
    id: String(raw.id),
    user_id: String(raw.userId ?? raw.user_id),
    full_name: String(raw.fullName ?? raw.full_name),
    email: String(raw.email),
    company_ids: companies
      ? companies.map((c) => String(c.companyId ?? (c.company as ApiRecord)?.id))
      : ((raw.company_ids ?? []) as string[]),
    specialization: (raw.specialization ?? []) as string[],
    department: raw.department ? String(raw.department) : undefined,
    is_active: Boolean(raw.isActive ?? raw.is_active ?? true),
    phone: raw.phone ? String(raw.phone) : undefined,
    location: raw.location ? String(raw.location) : undefined,
    bio: raw.bio ? String(raw.bio) : undefined,
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapCoach(raw: ApiRecord): CoachProfile {
  return {
    id: String(raw.id),
    user_id: String(raw.userId ?? raw.user_id),
    full_name: String(raw.fullName ?? raw.full_name),
    email: String(raw.email),
    specialization: (raw.specialization ?? []) as string[],
    is_active: Boolean(raw.isActive ?? raw.is_active ?? true),
    phone: raw.phone ? String(raw.phone) : undefined,
    location: raw.location ? String(raw.location) : undefined,
    bio: raw.bio ? String(raw.bio) : undefined,
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapCompetency(raw: ApiRecord): Competency {
  return {
    id: String(raw.id),
    code: String(raw.code),
    title: String(raw.title),
    description: String(raw.description),
    category: String(raw.category),
    level: String(raw.level),
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapGroundingModule(raw: ApiRecord): GroundingModule {
  return {
    id: String(raw.id),
    company_id: (raw.companyId ?? raw.company_id) as string | undefined,
    name: String(raw.name),
    level: String(raw.level),
    description: String(raw.description),
    structure: raw.structure as GroundingModule['structure'],
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapNotification(raw: ApiRecord): LDPNotification {
  return {
    id: String(raw.id),
    title: String(raw.title),
    message: String(raw.message),
    image_url: (raw.imageUrl ?? raw.image_url) as string | undefined,
    type: (raw.type ?? 'info') as LDPNotification['type'],
    link: raw.link ? String(raw.link) : undefined,
    is_active: Boolean(raw.isActive ?? raw.is_active ?? true),
    target_audience: String(raw.targetAudience ?? raw.target_audience ?? 'all'),
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapDictionary(raw: ApiRecord): CompetencyDictionary {
  return {
    id: String(raw.id),
    code: String(raw.code),
    name: String(raw.name),
    definition: String(raw.definition),
    importance: String(raw.importance),
    proficiency_levels: (raw.proficiencyLevels ?? raw.proficiency_levels) as CompetencyDictionary['proficiency_levels'],
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapLibrary(raw: ApiRecord): CompetencyLibrary {
  return {
    id: String(raw.id),
    company_id: String(raw.companyId ?? raw.company_id),
    competency_domain: String(raw.competencyDomain ?? raw.competency_domain),
    dictionary_id: (raw.dictionaryId ?? raw.dictionary_id) as string | undefined,
    competency: raw.competency as CompetencyLibrary['competency'],
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapPortfolio(raw: ApiRecord): Portfolio {
  return {
    id: String(raw.id),
    user_id: String(raw.userId ?? raw.user_id),
    behavioral_indicator_id: String(raw.behavioralIndicatorId ?? raw.behavioral_indicator_id),
    competency_id: (raw.competencyId ?? raw.competency_id) as string | undefined,
    status: raw.status as Portfolio['status'],
    evidence_urls: (raw.evidenceUrls ?? raw.evidence_urls ?? []) as string[],
    star_situation: (raw.starSituation ?? raw.star_situation) as string | undefined,
    star_task: (raw.starTask ?? raw.star_task) as string | undefined,
    star_action: (raw.starAction ?? raw.star_action) as string | undefined,
    star_result: (raw.starResult ?? raw.star_result) as string | undefined,
    submitted_at: raw.submittedAt ? toIso(raw.submittedAt) : undefined,
    reviewed_at: raw.reviewedAt ? toIso(raw.reviewedAt) : undefined,
    reviewed_by: (raw.reviewedBy ?? raw.reviewed_by) as string | undefined,
    feedback: raw.feedback ? String(raw.feedback) : undefined,
    ai_feedback: (raw.aiFeedback ?? raw.ai_feedback) as string | undefined,
    score: raw.score as number | undefined,
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapWaveResult(raw: ApiRecord): WaveResult {
  return {
    id: String(raw.id),
    user_id: String(raw.userId ?? raw.user_id),
    wave_id: String(raw.waveId ?? raw.wave_id),
    competency_avg: Number(raw.competencyAvg ?? raw.competency_avg ?? 0),
    exam_score: Number(raw.examScore ?? raw.exam_score ?? 0),
    grounding_score: Number(raw.groundingScore ?? raw.grounding_score ?? 0),
    final_score: Number(raw.finalScore ?? raw.final_score ?? 0),
    completed_at: raw.completedAt ? toIso(raw.completedAt) : undefined,
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapPeerCircle(raw: ApiRecord): PeerCircle {
  const members = raw.members as ApiRecord[] | undefined;
  const fellowIds = raw.fellow_ids as string[] | undefined;
  return {
    id: String(raw.id),
    name: String(raw.name),
    coach_id: String(raw.coachId ?? raw.coach_id),
    cohort_id: String(raw.cohortId ?? raw.cohort_id),
    company_id: String(raw.companyId ?? raw.company_id),
    fellow_ids: fellowIds ?? members?.map((m) => String(m.fellowId ?? m.fellow_id)) ?? [],
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapAdminDashboard(raw: ApiRecord): AdminDashboardState {
  return {
    users: ((raw.users as ApiRecord[]) ?? []).map(mapUser),
    companies: ((raw.companies as ApiRecord[]) ?? []).map(mapCompany),
    cohorts: ((raw.cohorts as ApiRecord[]) ?? []).map(mapCohort),
    fellows: ((raw.fellows as ApiRecord[]) ?? []).map(mapFellow),
    facilitators: ((raw.facilitators as ApiRecord[]) ?? []).map(mapFacilitator),
    coaches: ((raw.coaches as ApiRecord[]) ?? []).map(mapCoach),
    peerCircles: ((raw.peerCircles as ApiRecord[]) ?? []).map(mapPeerCircle),
    competencies: ((raw.competencies as ApiRecord[]) ?? []).map(mapCompetency),
    results: ((raw.results as ApiRecord[]) ?? []).map(mapWaveResult),
    evaluations: ((raw.evaluations as ApiRecord[]) ?? []).map(mapPortfolio),
    groundingModules: ((raw.groundingModules as ApiRecord[]) ?? []).map(mapGroundingModule),
    notifications: ((raw.notifications as ApiRecord[]) ?? []).map(mapNotification),
  };
}

/** Convert frontend snake_case company payload to API camelCase */
export function toApiCompany(data: Partial<Company>): Record<string, unknown> {
  return {
    name: data.name,
    industry: data.industry,
    sizeRange: data.size_range,
    contactEmail: data.contact_email,
    logoUrl: data.logoUrl,
    website: data.website,
    phone: data.phone,
    location: data.location,
    subsidiaries: data.subsidiaries,
  };
}

export function toApiCohort(data: Partial<Cohort>): Record<string, unknown> {
  return {
    companyId: data.company_id,
    name: data.name,
    description: data.description,
    waveLevel: data.wave_level,
    capacity: data.capacity,
    durationMonths: data.duration_months,
    enrollmentMode: data.enrollment_mode,
    status: data.status,
    groundingModuleId: data.grounding_module_id,
    isGroundingActive: data.is_grounding_active,
    startDate: data.start_date,
    endDate: data.end_date,
  };
}

export function toApiFellow(data: Partial<FellowProfile> & { password?: string }): Record<string, unknown> {
  return {
    email: data.email,
    fullName: data.full_name,
    password: data.password,
    fellowId: data.fellow_id,
    companyId: data.company_id,
    cohortId: data.cohort_id,
    highestQualification: data.highest_qualification,
    currentRole: data.current_role,
    organization: data.organization,
    leadershipExperienceYears: data.leadership_experience_years,
    keySkills: data.key_skills,
    learningGoals: data.learning_goals,
    gender: data.gender,
    age: data.age,
    primaryLanguage: data.primary_language,
    availability: data.availability,
    leadershipTrack: data.leadership_track,
    personalityStyle: data.personality_style,
    constraints: data.constraints,
    status: data.status,
    isActive: data.is_active,
  };
}

export function toApiNotification(data: Partial<LDPNotification>): Record<string, unknown> {
  return {
    title: data.title,
    message: data.message,
    imageUrl: data.image_url,
    type: data.type,
    link: data.link,
    isActive: data.is_active,
    targetAudience: data.target_audience,
  };
}

export function toApiGroundingModule(
  data: Partial<GroundingModule>,
): Record<string, unknown> {
  return {
    name: data.name,
    level: data.level,
    description: data.description,
    structure: data.structure,
    companyId: data.company_id,
  };
}

export function mapWave(raw: ApiRecord): Wave {
  return {
    id: String(raw.id),
    cohort_id: String(raw.cohortId ?? raw.cohort_id),
    number: Number(raw.number),
    name: raw.name ? String(raw.name) : undefined,
    description: raw.description ? String(raw.description) : undefined,
    status: raw.status as Wave['status'],
    phase_states: (raw.phaseStates ?? raw.phase_states) as Wave['phase_states'],
    final_exam_id: (raw.finalExamId ?? raw.final_exam_id) as string | undefined,
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapWaveCompetency(raw: ApiRecord): WaveCompetency {
  return {
    id: String(raw.id),
    wave_id: String(raw.waveId ?? raw.wave_id),
    competency_id: String(raw.competencyId ?? raw.competency_id),
    display_order: (raw.displayOrder ?? raw.display_order) as number | undefined,
    created_at: toIso(raw.createdAt ?? raw.created_at),
  };
}

export function mapBehavioralIndicator(raw: ApiRecord): BehavioralIndicator {
  return {
    id: String(raw.id),
    competency_id: String(raw.competencyId ?? raw.competency_id),
    title: String(raw.title),
    description: String(raw.description),
    code: raw.code ? String(raw.code) : undefined,
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapPhaseProgress(raw: ApiRecord): PhaseProgress {
  return {
    id: String(raw.id),
    user_id: String(raw.userId ?? raw.user_id),
    behavioral_indicator_id: String(raw.behavioralIndicatorId ?? raw.behavioral_indicator_id),
    phase_type: (raw.phaseType ?? raw.phase_type) as PhaseProgress['phase_type'],
    believe_passed: (raw.believePassed ?? raw.believe_passed) as boolean | undefined,
    know_score: (raw.knowScore ?? raw.know_score) as number | undefined,
    portfolio_id: (raw.portfolioId ?? raw.portfolio_id) as string | undefined,
    completed_at: raw.completedAt ? toIso(raw.completedAt) : undefined,
    video_completed: (raw.videoCompleted ?? raw.video_completed) as boolean | undefined,
    article_completed: (raw.articleCompleted ?? raw.article_completed) as boolean | undefined,
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapGroundingResult(raw: ApiRecord): GroundingResult {
  return {
    id: String(raw.id),
    fellow_id: String(raw.fellowId ?? raw.fellow_id),
    grounding_id: String(raw.groundingId ?? raw.grounding_id),
    status: (raw.status ?? 'in_progress') as GroundingResult['status'],
    started_at: toIso(raw.startedAt ?? raw.started_at),
    score: raw.score as number | undefined,
    is_passed: (raw.isPassed ?? raw.is_passed) as boolean | undefined,
    completed_content: (raw.completedContent ?? raw.completed_content ?? []) as string[],
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapExam(raw: ApiRecord): Record<string, unknown> {
  return {
    id: String(raw.id),
    cohort_id: raw.cohortId ?? raw.cohort_id,
    competency_id: raw.competencyId ?? raw.competency_id,
    title: raw.title,
    questions: raw.questions,
    access_code: raw.accessCode ?? raw.access_code,
    time_allocated_minutes: raw.timeAllocatedMinutes ?? raw.time_allocated_minutes,
    is_enabled: raw.isEnabled ?? raw.is_enabled,
    allow_retake: raw.allowRetake ?? raw.allow_retake,
    is_portal_open: raw.isPortalOpen ?? raw.is_portal_open,
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapExamAttempt(raw: ApiRecord): Record<string, unknown> {
  return {
    id: String(raw.id),
    exam_id: raw.examId ?? raw.exam_id,
    examination_id: raw.examinationId ?? raw.examination_id,
    user_id: raw.userId ?? raw.user_id,
    score: raw.score,
    passed: raw.passed,
    answers: raw.answers,
    status: raw.status,
    graded_by: raw.gradedBy ?? raw.graded_by,
    submitted_at: raw.submittedAt ? toIso(raw.submittedAt) : raw.submitted_at,
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapExamination(raw: ApiRecord): Record<string, unknown> {
  return {
    id: String(raw.id),
    cohort_id: raw.cohortId ?? raw.cohort_id,
    title: raw.title,
    competency_ids: raw.competencyIds ?? raw.competency_ids ?? [],
    fellow_ids: raw.fellowIds ?? raw.fellow_ids ?? [],
    access_code: raw.accessCode ?? raw.access_code,
    time_allocated_minutes: raw.timeAllocatedMinutes ?? raw.time_allocated_minutes,
    is_enabled: raw.isEnabled ?? raw.is_enabled,
    is_portal_open: raw.isPortalOpen ?? raw.is_portal_open,
    allow_retake: raw.allowRetake ?? raw.allow_retake,
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapExaminationAttempt(raw: ApiRecord): Record<string, unknown> {
  return {
    id: String(raw.id),
    examination_id: raw.examinationId ?? raw.examination_id,
    user_id: raw.userId ?? raw.user_id,
    cohort_id: raw.cohortId ?? raw.cohort_id,
    title: raw.title,
    score: raw.score,
    passed: raw.passed,
    answers: raw.answers,
    written_scores: raw.writtenScores ?? raw.written_scores,
    competency_results: raw.competencyResults ?? raw.competency_results,
    competency_snapshots: raw.competencySnapshots ?? raw.competency_snapshots,
    draft_state: raw.draftState ?? raw.draft_state,
    has_written: raw.hasWritten ?? raw.has_written,
    status: raw.status,
    started_at: raw.startedAt ? toIso(raw.startedAt) : raw.started_at,
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapAdminProfile(raw: ApiRecord): AdminProfile {
  return {
    id: String(raw.id),
    user_id: String(raw.userId ?? raw.user_id),
    title: raw.title ? String(raw.title) : undefined,
    is_active: Boolean(raw.isActive ?? raw.is_active ?? true),
    phone: raw.phone ? String(raw.phone) : undefined,
    location: raw.location ? String(raw.location) : undefined,
    bio: raw.bio ? String(raw.bio) : undefined,
    created_at: toIso(raw.createdAt ?? raw.created_at),
    updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  };
}

export function mapFellowDashboard(raw: ApiRecord): FellowDashboardState {
  return {
    user: mapUser(raw.user as ApiRecord),
    profile: mapFellow(raw.profile as ApiRecord),
    company: mapCompany(raw.company as ApiRecord),
    cohort: mapCohort(raw.cohort as ApiRecord),
    currentWave: raw.currentWave ? mapWave(raw.currentWave as ApiRecord) : undefined,
    waves: ((raw.waves as ApiRecord[]) ?? []).map(mapWave),
    competencies: ((raw.competencies as ApiRecord[]) ?? []).map(mapCompetency),
    progress: ((raw.progress as ApiRecord[]) ?? []).map(mapPhaseProgress),
    portfolios: ((raw.portfolios as ApiRecord[]) ?? []).map(mapPortfolio),
    waveCompetencies: ((raw.waveCompetencies as ApiRecord[]) ?? []).map(mapWaveCompetency),
    groundingModule: raw.groundingModule
      ? mapGroundingModule(raw.groundingModule as ApiRecord)
      : undefined,
    groundingResults: ((raw.groundingResults as ApiRecord[]) ?? []).map(mapGroundingResult),
    examAttempts: ((raw.examAttempts as ApiRecord[]) ?? []).map(mapExamAttempt),
    exams: ((raw.exams as ApiRecord[]) ?? []).map(mapExam),
    examinations: ((raw.examinations as ApiRecord[]) ?? []).map(mapExamination),
    examinationAttempts: ((raw.examinationAttempts as ApiRecord[]) ?? []).map(mapExaminationAttempt),
    behavioralIndicators: ((raw.behavioralIndicators as ApiRecord[]) ?? []).map(mapBehavioralIndicator),
    notifications: ((raw.notifications as ApiRecord[]) ?? []).map(mapNotification),
  };
}

export function mapCoachDashboard(raw: ApiRecord): CoachDashboardState {
  return {
    user: mapUser(raw.user as ApiRecord),
    profile: mapCoach(raw.profile as ApiRecord),
    peerCircle: raw.peerCircle ? mapPeerCircle(raw.peerCircle as ApiRecord) : null,
    fellows: ((raw.fellows as ApiRecord[]) ?? []).map(mapFellow),
    portfolios: ((raw.portfolios as ApiRecord[]) ?? []).map(mapPortfolio),
    progress: ((raw.progress as ApiRecord[]) ?? []).map(mapPhaseProgress),
    notifications: ((raw.notifications as ApiRecord[]) ?? []).map(mapNotification),
  };
}

export function toApiProgress(data: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    user_id: 'userId',
    behavioral_indicator_id: 'behavioralIndicatorId',
    phase_type: 'phaseType',
    believe_passed: 'believePassed',
    know_score: 'knowScore',
    portfolio_id: 'portfolioId',
    video_completed: 'videoCompleted',
    article_completed: 'articleCompleted',
    completed_at: 'completedAt',
  };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    out[map[k] ?? k] = v;
  }
  return out;
}

export function toApiPortfolio(data: Partial<Portfolio>): Record<string, unknown> {
  return {
    userId: data.user_id,
    behavioralIndicatorId: data.behavioral_indicator_id,
    competencyId: data.competency_id,
    status: data.status,
    starSituation: data.star_situation,
    starTask: data.star_task,
    starAction: data.star_action,
    starResult: data.star_result,
    evidenceUrls: data.evidence_urls,
    feedback: data.feedback,
    score: data.score,
    reviewedBy: data.reviewed_by,
  };
}
