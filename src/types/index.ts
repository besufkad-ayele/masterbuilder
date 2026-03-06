// --- Enums (Aligned with DBML) ---

export type UserRole = 'ADMIN' | 'FACILITATOR' | 'FELLOW';

export type WaveLevel = 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';

export type CohortStatus = 'upcoming' | 'active' | 'completed' | 'archived';

export type EnrollmentMode = 'open' | 'invite_only';

export type PhaseType = 'believe' | 'know' | 'do';

export type PortfolioStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'resubmitted';

export type EvidenceType = 'file' | 'link' | 'text';

export type WaveStatus = 'upcoming' | 'active' | 'locked' | 'completed';

// --- Core Identity & Organizations ---
export interface subsidiaries {
  id: string;
  name: string;
  industry?: string;
  size_range?: string; // '1-10', '11-50', '51-200', '201-500', '500+'
  contact_email?: string;
  logoUrl?: string;
  phone?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  size_range?: string; // '1-10', '11-50', '51-200', '201-500', '500+'
  contact_email?: string;
  logoUrl?: string;
  website?: string;
  subsidiaries?: subsidiaries[];
  phone?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title?: string; // Added for Admins/Facilitators
  password_hash?: string;
  created_at: string;
  updated_at: string;
  // Legacy fields to be phased out but kept for compatibility during migration
  companyId?: string;
  cohortId?: string;
}

export type FellowStatus = 'Onboarding' | 'Active' | 'Paused' | 'Graduated' | 'Competency Reset';

export interface FellowProfile {
  id: string;
  user_id: string;
  fellow_id: string; // e.g. MID-F0002
  full_name: string;
  email: string;
  highest_qualification: string;
  current_role: string;
  organization: string;
  leadership_experience_years: number;
  key_skills: string[];
  learning_goals: string[];
  gender: string;
  age: number;
  primary_language: string;
  availability: string;
  leadership_track: string;
  personality_style: string;
  constraints: string;
  status: FellowStatus;
  company_id: string;
  cohort_id?: string;
  current_wave_id?: string;
  enrolled_at?: string;
  department?: string;
  position?: string;
  is_active: boolean;
  phone?: string;
  location?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface FacilitatorProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  company_ids: string[];
  specialization: string[];
  department?: string;
  is_active: boolean;
  phone?: string;
  location?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminProfile {
  id: string;
  user_id: string;
  title?: string;
  is_active: boolean;
  phone?: string;
  location?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

// --- Program Structure ---

export interface Cohort {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  wave_level: string; // 'Basic' | 'Intermediate' | etc.
  capacity?: number;
  duration_months?: number; // Duration of the cohort in months
  enrollment_mode: EnrollmentMode;
  status: CohortStatus;
  grounding_module_id?: string; // ID of the assigned grounding module
  is_grounding_active: boolean; // Whether the grounding module is active for this cohort
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Wave {
  id: string;
  cohort_id: string;
  number: number;
  name?: string;
  description?: string;
  status: WaveStatus;
  phase_states?: {
    believe: 'active' | 'locked';
    know: 'active' | 'locked';
    do: 'active' | 'locked';
  };
  final_exam_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Competency {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string; // 'ly' | 'lo' | 'lyo'
  level: string; // 'Basic' | 'Intermediate' | etc.
  created_at: string;
  updated_at: string;
}

export interface WaveCompetency {
  id: string;
  wave_id: string;
  competency_id: string;
  display_order?: number;
  created_at: string;
}

// --- Learning Content ---

export interface BehavioralIndicator {
  id: string;
  competency_id: string;
  title: string;
  description: string;
  code?: string;
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: string;
  behavioral_indicator_id: string;
  phase_type: PhaseType;
  video_url?: string;
  article_url?: string;
  quiz_id?: string;
  do_instructions?: string;
  created_at: string;
  updated_at: string;
}

// --- Progress & Evidence ---

export interface PhaseProgress {
  id: string;
  user_id: string;
  behavioral_indicator_id: string;
  phase_type: PhaseType;
  believe_passed?: boolean;
  know_score?: number; // 0-20 or 0-100
  portfolio_id?: string;
  completed_at?: string;
  video_completed?: boolean;
  article_completed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  behavioral_indicator_id: string;
  competency_id?: string; // Added for competency-level tracking
  status: PortfolioStatus;
  star_situation?: string;
  star_task?: string;
  star_action?: string;
  star_result?: string;
  //  drive_link?: string;
  evidence_urls: string[];
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  feedback?: string;
  ai_feedback?: string;
  score?: number;
  created_at: string;
  updated_at: string;
}

// --- Grounding Modules (Content Definition) ---

export interface ExternalSubFactor {
  id: string;
  name: string;
  video_urls: string[];
  articles: {
    title: string;
    link: string;
    image_url: string;
  }[];
  quiz: QuizQuestion[];
}

export interface InternalVideoSubFactor {
  id: string;
  name: string;
  video_urls: string[];
}

export interface InternalDocumentSubFactor {
  id: string;
  name: string;
  markdown?: string;
  article_title?: string;
  article_link?: string;
  article_image_url?: string;
  content_mode?: 'markdown' | 'link';
}

export interface GroundingModuleStructure {
  part_one: {
    name: string;
    weight: string;
    completion_assessment: {
      type: string;
      description: string;
      quiz_questions: ReflectionQuestion[];
    };
    sub_factors: ExternalSubFactor[];
  };
  part_two: {
    name: string;
    description: string;
    video_section: {
      title: string;
      sub_factors: InternalVideoSubFactor[];
    };
    document_section: {
      title: string;
      factors: InternalDocumentSubFactor[];
    };
  };
}

export interface GroundingModule {
  id: string;
  company_id?: string;
  name: string;
  level: string; // 'Basic' | 'Intermediate' | 'Advanced' | 'Expert'
  description: string;
  structure: GroundingModuleStructure;
  created_at: string;
  updated_at: string;
}

export type GroundingLibrary = GroundingModule;

export interface GroundingSubmission {
  id: string;
  user_id: string;
  company_id: string;
  module_id: string;
  part_one_completed: boolean;
  part_two_completed: boolean;
  quiz_score?: number;
  created_at: string;
  updated_at: string;
}

export interface GroundingResult {
  id: string;
  fellow_id: string;       // matches user_id
  grounding_id: string;    // references grounding_modules
  status: 'in_progress' | 'completed';
  started_at: string;
  score?: number;
  is_passed?: boolean;
  completed_content?: string[]; // Track URLs/IDs of watched videos and read articles
  created_at: string;
  updated_at: string;
}


// --- Aggregated Results ---

export interface WaveResult {
  id: string;
  user_id: string;
  wave_id: string;
  competency_avg: number;
  exam_score: number;
  grounding_score: number;
  final_score: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// --- Frontend Helper Types (Dashboard States) ---

export interface AdminDashboardState {
  users: User[];
  companies: Company[];
  cohorts: Cohort[];
  fellows: FellowProfile[];
  facilitators: FacilitatorProfile[];
  competencies: Competency[];
  results: WaveResult[];
  evaluations: Portfolio[];
  groundingModules: GroundingModule[];
}

export interface FellowDashboardState {
  user: User;
  profile: FellowProfile;
  company: Company;
  cohort: Cohort;
  currentWave?: Wave;
  waves: Wave[];
  competencies: Competency[];
  progress: PhaseProgress[];
  portfolios: Portfolio[];
  waveCompetencies: WaveCompetency[];
  groundingModule?: GroundingModule;
  groundingResults: GroundingResult[];
  examAttempts: any[]; // Using any[] for ExamAttempt if not exported from types
  exams: any[];        // Using any[] for Exam if not exported from types
  behavioralIndicators: BehavioralIndicator[];
}

// --- Competency Dictionary & Library (New Structures) ---

export interface DictionaryBehavior {
  id: string;
  code: string;
  description: string;
}

export interface DictionaryProficiencyLevel {
  level: WaveLevel;
  name: string;
  behavioral_indicators: DictionaryBehavior[];
}

export interface CompetencyDictionary {
  id: string;
  code: string;
  name: string;
  definition: string;
  importance: string;
  proficiency_levels: DictionaryProficiencyLevel[];
  created_at: string;
  updated_at: string;
}

export interface ReflectionQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: string;
  explanation?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export interface LearningResource {
  source: string | null;
  title?: string | null;
  cover_pic_link?: string | null;
}

export interface ContentItem {
  url: string;
  title: string;
  image?: string;
}

export interface BIResources {
  believe: {
    videos: LearningResource[];
    articles: LearningResource[];
    quiz: ReflectionQuestion[];
  };
  know: {
    videos: LearningResource[];
    articles: LearningResource[];
    quiz: ReflectionQuestion[];
  };
  do: {
    instruction: string;
    description: string;
    reflection_questions: ReflectionQuestion[];
  };
}

export interface LibraryBehavioralIndicator {
  code: string;
  description: string;
  resources: BIResources;
}

export interface CompetencyLibrary {
  id: string;
  company_id: string; // Added to link library to a specific company
  competency_domain: string; // e.g., 'Leading Yourself (LY)'
  dictionary_id?: string;
  competency: {
    name: string;
    definition: string;
    current_level: string;
    target_level: string;
    level_descriptor: string;
    behavioral_indicators: LibraryBehavioralIndicator[];
  };
  created_at: string;
  updated_at: string;
}

// --- Storage Keys ---

export const STORAGE_KEYS = {
  ADMIN_STATE: 'ldp_admin_state',
  FELLOW_STATE: 'ldp_fellow_state',
  CURRENT_USER: 'ldp_current_user',
  AUTH_TOKEN: 'ldp_auth_token'
} as const;

// Legacy Aliases for compatibility
export type BehavioralIndicatorUI = { id: string; code: string; description: string };
export type CompetencyDirectory = CompetencyDictionary;
export interface CompetencyFramework {
  frameworkName: string;
  overallCompetency: { title: string; description: string };
  competencies: any[];
}
