# Masterbuilder Platform - Complete User Flow
## From Initiation to Final Completion

---

## Overview

This document maps the complete user journey through the Masterbuilder Leadership Development Platform, covering all three user roles: **Admin**, **Facilitator**, and **Fellow**. The flow tracks users from initial system setup through program completion.

---

## 1. SYSTEM INITIATION PHASE

### 1.1 Platform Setup (Admin)

**Entry Point:** Admin receives platform access credentials

**Flow:**
1. Admin navigates to landing page (`/`)
2. Clicks "Log In" button
3. Redirected to `/login`
4. Selects "I'm an Admin" (or uses direct `/admin-login`)
5. Enters email address
6. System authenticates via Firebase Auth
7. System fetches admin profile from Firestore
8. Redirected to `/admin?tab=dashboard`

**Initial Dashboard View:**
- Empty state with zero companies, cohorts, fellows
- Navigation sidebar with management tabs
- Call-to-action to create first company

---

### 1.2 Company Onboarding (Admin)

**Objective:** Set up organizational structure

**Steps:**
1. Navigate to "Companies" tab (`/admin?tab=companies`)
2. Click "Create Company" button
3. Fill company creation form:
   - Company name (required)
   - Industry
   - Size range
   - Contact email
   - Phone number (with country code)
   - Location
   - Website
4. Submit form
5. System creates company record in Firestore
6. Company appears in companies list

**Data Created:**
- `companies` collection document
- Company ID generated for reference

---

### 1.3 Competency Framework Setup (Admin)

**Objective:** Define learning competencies and behavioral indicators

**Steps:**
1. Navigate to "Competencies" tab (`/admin?tab=competencies`)
2. Create competency dictionaries:
   - Click "Create Competency"
   - Enter competency code (e.g., "LY-1")
   - Enter title (e.g., "Self-Awareness")
   - Enter description
   - Select category: LY (Leading Yourself), LO (Leading Others), LYO (Leading Your Organization)
   - Select level: Basic, Intermediate, Advanced, Expert
3. Add behavioral indicators (minimum 4 per competency):
   - Click "Add Behavioral Indicator"
   - Enter BI code (e.g., "BI1")
   - Enter description
   - Repeat for each indicator
4. Submit competency
5. System stores in `competencies` and `behavioral_indicators` collections

**Data Created:**
- Competency records
- Behavioral indicator records linked to competencies

---

### 1.4 Grounding Module Creation (Admin)

**Objective:** Create foundational identity training content

**Steps:**
1. Navigate to "Grounding Modules" tab (`/admin?tab=grounding`)
2. Click "Create Grounding Module"
3. Fill module header:
   - Module name
   - Level (Basic/Intermediate/Advanced/Expert)
   - Description
   - Assign to company (optional)
4. Configure Part One (External Factors):
   - Add sub-factors
   - For each sub-factor:
     - Add video URLs
     - Add article links with titles and images
     - Create quiz questions (multiple choice)
5. Configure Part Two (Internal Factors):
   - Video section: Add video URLs
   - Document section: Add internal domain factors
     - Toggle between "Markdown" or "External Link"
     - Enter content accordingly
6. Submit module
7. System stores in `grounding_modules` collection

**Data Created:**
- Grounding module with nested structure
- Quiz questions for verification assessment

---

### 1.5 Cohort Creation (Admin)

**Objective:** Create learning cohorts for fellows

**Steps:**
1. Navigate to "Cohorts" tab (`/admin?tab=cohorts`)
2. Click "Create Cohort"
3. Fill cohort form:
   - Select company
   - Cohort name
   - Description
   - Wave level (Basic/Intermediate/Advanced/Expert)
   - Capacity (max fellows)
   - Duration in months
   - Enrollment mode (open/invite_only)
   - Start date
   - End date
   - Assign grounding module
   - Set grounding module active status
4. Submit cohort
5. System creates cohort record

**Data Created:**
- `cohorts` collection document
- Linked to company and grounding module

---

### 1.6 Wave Configuration (Admin)

**Objective:** Structure learning progression into waves

**Steps:**
1. Within cohort management, create waves:
   - Wave number (1, 2, 3, etc.)
   - Wave name
   - Description
   - Status (upcoming/active/locked/completed)
2. Assign competencies to wave:
   - Select competencies from library
   - Set display order
3. System creates wave records
4. System creates wave-competency links

**Data Created:**
- `waves` collection documents
- `wave_competencies` junction table records

---

### 1.7 Fellow Enrollment (Admin)

**Objective:** Add fellows to the platform

**Steps:**
1. Navigate to "Fellow Management" tab (`/admin?tab=fellow-management`)
2. Click "Create Fellow"
3. Fill fellow profile form:
   - Full name
   - Email (becomes login credential)
   - Fellow ID (e.g., MID-F0002)
   - Highest qualification
   - Current role
   - Organization
   - Leadership experience (years)
   - Key skills (array)
   - Learning goals (array)
   - Gender
   - Age
   - Primary language
   - Availability
   - Leadership track
   - Personality style
   - Constraints
   - Select company
   - Select cohort
   - Department
   - Position
   - Phone
   - Location
   - Bio
4. Submit form
5. System creates:
   - User account in Firebase Auth (password: "Password123!")
   - User record in `users` collection (role: FELLOW)
   - Fellow profile in `fellow_profiles` collection

**Data Created:**
- Firebase Auth user
- User document
- Fellow profile document

---

### 1.8 Facilitator Setup (Admin)

**Objective:** Add facilitators to guide cohorts

**Steps:**
1. Navigate to "Facilitator Management" tab
2. Click "Create Facilitator"
3. Fill facilitator form:
   - Full name
   - Email
   - Assign to companies (multiple selection)
   - Specialization areas
   - Department
   - Phone
   - Location
   - Bio
4. Submit form
5. System creates facilitator account and profile

**Data Created:**
- Firebase Auth user
- User document (role: FACILITATOR)
- Facilitator profile in `facilitator_profiles` collection

---

## 2. FELLOW LEARNING JOURNEY

### 2.1 Fellow First Login

**Entry Point:** Fellow receives email with login instructions

**Flow:**
1. Navigate to `/login`
2. Select "I'm a Fellow" card
3. Enter email address
4. System authenticates
5. System fetches fellow profile
6. Redirected to `/fellow/[companyId]`

**Initial Dashboard View:**
- Welcome message with fellow's name
- Overall progress: 0%
- Company branding
- Cohort information
- Current wave status
- Locked competencies (if grounding not completed)

---

### 2.2 Grounding Module Completion

**Objective:** Complete foundational identity training (10% of total score)

**Flow:**

#### Part One: External Factors

1. Fellow clicks on "Foundational Identity" card
2. Navigates to grounding module view
3. For each sub-factor:
   - **Watch Videos:**
     - Click video link
     - Video opens in modal/new tab
     - System tracks completion
   - **Read Articles:**
     - Click article link
     - Article opens in new tab
     - System tracks completion
4. After all content consumed:
   - "Part I Verification Assessment" unlocks
   - Fellow takes quiz (10 questions)
   - Must score 5/10 (50%) to pass
5. System calculates grounding score
6. Score stored in `grounding_results` collection

#### Part Two: Internal Factors

1. Fellow navigates to Part Two
2. **Video Section:**
   - Watch all internal domain videos
   - System tracks completion
3. **Document Section:**
   - Read markdown content or external links
   - System tracks completion
4. Mark Part Two as complete

**Data Created:**
- `grounding_results` document with:
  - `fellow_id`
  - `grounding_id`
  - `status`: 'completed'
  - `score`: 0-100
  - `is_passed`: true/false
  - `completed_content`: array of URLs

**Unlock Trigger:**
- Grounding completion unlocks Wave 1 competencies

---

### 2.3 Competency Learning Flow (Believe → Know → Do)

**Objective:** Master behavioral indicators through three-phase learning

#### Phase 1: BELIEVE (Mindset - Pass/Fail)

**Purpose:** Develop foundational mindset

**Steps:**
1. Fellow navigates to competency detail view
2. Selects first behavioral indicator
3. Clicks "Believe" tab
4. **Content Consumption:**
   - Watch belief videos (all required)
   - Read belief articles (all required)
   - System tracks completion
5. After all content consumed:
   - Reflection quiz unlocks
   - Fellow takes quiz
   - Must pass to proceed
6. System updates `phase_progress`:
   - `phase_type`: 'believe'
   - `believe_passed`: true
   - `video_completed`: true
   - `article_completed`: true

**Unlock Trigger:**
- Passing Believe phase unlocks Know phase

---

#### Phase 2: KNOW (Knowledge - 20% of BI score)

**Purpose:** Acquire theoretical knowledge

**Steps:**
1. "Know" tab becomes accessible
2. Fellow clicks "Know" tab
3. **Content Consumption:**
   - Watch knowledge videos
   - Read knowledge articles
   - System tracks completion
4. After all content consumed:
   - Reflection quiz unlocks (20 questions)
   - Fellow takes quiz
   - Must score 15/20 (75%) to pass
5. System updates `phase_progress`:
   - `phase_type`: 'know'
   - `know_score`: 0-20
   - `completed_at`: timestamp

**Unlock Trigger:**
- Passing Know phase unlocks Do phase

---

#### Phase 3: DO (Application - 50% of BI score)

**Purpose:** Demonstrate practical application

**Steps:**
1. "Do" tab becomes accessible
2. Fellow clicks "Do" tab
3. Reads task instructions
4. **Portfolio Creation (STAR Method):**
   - Click "Create Portfolio"
   - Fill STAR framework:
     - **Situation:** Describe context
     - **Task:** Explain objective
     - **Action:** Detail steps taken
     - **Result:** Quantify outcomes
   - Upload evidence files (documents, images, links)
   - Submit portfolio
5. Portfolio status: 'submitted'
6. System creates `portfolios` document

**Portfolio Rules:**
- Maximum 3 submissions per behavioral indicator
- Only 1 approved portfolio counts toward score
- Must score 45/50 (90%) on approved portfolio to pass

**Data Created:**
- `portfolios` document with:
  - `user_id`
  - `behavioral_indicator_id`
  - `status`: 'submitted'
  - `star_situation`, `star_task`, `star_action`, `star_result`
  - `evidence_urls`: array
  - `submitted_at`: timestamp

---

### 2.4 Facilitator Review Process

**Objective:** Evaluate fellow portfolios

**Flow:**
1. Facilitator logs in
2. Navigates to `/facilitator/[companyId]`
3. Views "Portfolio Evaluation" queue
4. Filters by:
   - Cohort
   - Fellow
   - Competency
   - Status (submitted/under_review)
5. Clicks portfolio to review
6. Reviews STAR content and evidence
7. Provides feedback:
   - Written comments
   - Score (0-50)
   - Status: approved/rejected
8. Submits review
9. System updates portfolio:
   - `status`: 'approved' or 'rejected'
   - `score`: 0-50
   - `feedback`: reviewer comments
   - `reviewed_by`: facilitator ID
   - `reviewed_at`: timestamp
10. Fellow receives notification

**Resubmission Flow (if rejected):**
1. Fellow views feedback
2. Revises portfolio
3. Changes status to 'resubmitted'
4. Facilitator reviews again
5. Process repeats until approved or 3 attempts exhausted

---

### 2.5 Behavioral Indicator Score Calculation

**Formula:**
```
BI Score = (Know Score × 0.2) + (Do Score × 0.5)
         = (know_score/20 × 20) + (portfolio_score/50 × 50)
         = Max 70 points
```

**Example:**
- Know Quiz: 18/20 = 90% → 18 points
- Portfolio: 48/50 = 96% → 48 points
- **BI Total: 66/70 = 94.3%**

---

### 2.6 Competency Completion

**Objective:** Complete all behavioral indicators in a competency

**Flow:**
1. Fellow completes all BIs (minimum 4) in competency
2. System calculates competency average
3. Competency exam unlocks
4. Fellow takes competency exam
5. Exam score contributes 20% to competency total

**Competency Score Formula:**
```
Competency Score = (Grounding × 0.1) + (Avg BI Scores × 0.7) + (Exam × 0.2)
```

**Example:**
- Grounding: 80/100 = 8 points
- Average BI: 66/70 = 66 points
- Exam: 85/100 = 17 points
- **Competency Total: 91/100 = 91%**

**Pass Threshold:** 75% overall

**Data Created:**
- Exam attempt record
- Competency completion status

---

### 2.7 Wave Completion

**Objective:** Complete all competencies in a wave

**Flow:**
1. Fellow completes all assigned competencies
2. System calculates wave average
3. Wave marked as 'completed'
4. Next wave unlocks (if available)
5. System creates `wave_results` document:
   - `user_id`
   - `wave_id`
   - `competency_avg`: average of all competency scores
   - `exam_score`: average of all exam scores
   - `grounding_score`: grounding module score
   - `final_score`: weighted total
   - `completed_at`: timestamp

---

### 2.8 Program Completion

**Objective:** Complete all waves in cohort

**Flow:**
1. Fellow completes final wave
2. System calculates overall program score
3. Fellow status updated to 'Graduated'
4. Certificate generated (future feature)
5. Fellow gains access to alumni resources (future feature)

**Overall Progress Calculation:**
```
Overall Progress = Average of all competency scores across all waves
```

---

## 3. FACILITATOR WORKFLOW

### 3.1 Facilitator Dashboard

**Entry Point:** `/facilitator/[companyId]`

**Features:**
- Cohort overview
- Fellow progress tracking
- Portfolio evaluation queue
- Quiz evaluation queue
- Performance analytics
- Communication tools

---

### 3.2 Cohort Management

**Activities:**
1. Monitor cohort health metrics
2. Track engagement rates
3. Identify at-risk fellows
4. Send notifications
5. Schedule check-ins

---

### 3.3 Evaluation Workflows

#### Portfolio Evaluation
- Review submitted portfolios
- Provide detailed feedback
- Assign scores
- Approve/reject submissions

#### Quiz Evaluation
- Monitor quiz performance
- Identify knowledge gaps
- Provide additional resources

---

### 3.4 Performance Tracking

**Metrics Monitored:**
- Individual fellow progress
- Cohort completion rates
- Average scores by competency
- Time to completion
- Resubmission rates

---

## 4. ADMIN MONITORING & MANAGEMENT

### 4.1 Admin Dashboard Overview

**Entry Point:** `/admin?tab=dashboard`

**Key Metrics:**
- Active company agreements
- Live cohorts
- Total fellows enrolled
- Fellow engagement rate
- Completion rate
- Coaches & mentors count

---

### 4.2 Ongoing Management Tasks

#### Company Management
- Update company information
- Add subsidiaries
- Manage company status
- Archive inactive companies

#### Cohort Management
- Monitor cohort progress
- Adjust cohort settings
- Extend deadlines
- Archive completed cohorts

#### Fellow Management
- Update fellow profiles
- Change cohort assignments
- Reset competency progress (if needed)
- Manage fellow status

#### Competency Management
- Update competency definitions
- Add new behavioral indicators
- Modify quiz questions
- Archive outdated competencies

#### Grounding Module Management
- Update module content
- Add new resources
- Modify quiz questions
- Version control

---

### 4.3 Reporting & Analytics

**Available Reports:**
- Cohort health reports
- Fellow performance reports
- Competency mastery reports
- Engagement analytics
- Completion trends
- Time-to-completion analysis

---

## 5. DATA FLOW SUMMARY

### Collections & Relationships

```
companies
  ├── cohorts
  │     ├── waves
  │     │     └── wave_competencies → competencies
  │     └── grounding_modules
  ├── fellow_profiles
  │     ├── phase_progress
  │     ├── portfolios
  │     ├── grounding_results
  │     └── wave_results
  └── facilitator_profiles

competencies
  └── behavioral_indicators
        └── phases (believe/know/do content)
```

---

## 6. KEY DECISION POINTS & GATES

### Gate 1: Grounding Completion
- **Requirement:** Pass Part I quiz (50%)
- **Unlocks:** Wave 1 competencies
- **Impact:** 10% of overall score

### Gate 2: Believe Phase
- **Requirement:** Complete all content + pass quiz
- **Unlocks:** Know phase
- **Impact:** Gatekeeper (pass/fail)

### Gate 3: Know Phase
- **Requirement:** Score 75% on reflection quiz
- **Unlocks:** Do phase
- **Impact:** 20% of BI score

### Gate 4: Do Phase
- **Requirement:** Approved portfolio (90% score)
- **Unlocks:** Next BI or competency exam
- **Impact:** 50% of BI score

### Gate 5: Competency Exam
- **Requirement:** All BIs completed
- **Unlocks:** Next competency or wave
- **Impact:** 20% of competency score

### Gate 6: Wave Completion
- **Requirement:** All competencies passed (75%)
- **Unlocks:** Next wave
- **Impact:** Contributes to overall progress

---

## 7. NOTIFICATION & COMMUNICATION FLOW

### System Notifications

**Fellow Notifications:**
- New content unlocked
- Quiz available
- Portfolio reviewed
- Deadline reminders
- Achievement milestones

**Facilitator Notifications:**
- New portfolio submissions
- Fellow at risk
- Cohort milestones
- Evaluation reminders

**Admin Notifications:**
- System alerts
- Cohort completion
- Low engagement warnings
- Data integrity issues

---

## 8. ERROR HANDLING & EDGE CASES

### Common Scenarios

#### Fellow Cannot Access Content
- **Check:** Grounding completion status
- **Check:** Previous phase completion
- **Check:** Cohort active status
- **Action:** Display lock icon with explanation

#### Portfolio Rejected 3 Times
- **Action:** Escalate to facilitator for 1-on-1 guidance
- **Action:** Provide additional resources
- **Option:** Allow competency reset (admin only)

#### Quiz Failed Multiple Times
- **Action:** Require content review
- **Action:** Unlock additional study materials
- **Action:** Schedule facilitator check-in

#### Cohort Behind Schedule
- **Action:** Send engagement reminders
- **Action:** Extend deadlines (admin)
- **Action:** Provide additional support resources

---

## 9. FUTURE ENHANCEMENTS

### Planned Features
- Real-time collaboration tools
- AI-powered portfolio feedback
- Peer review system
- Gamification elements
- Mobile app
- Offline mode
- Certificate generation
- Alumni network
- Advanced analytics dashboard
- Integration with HR systems

---

## 10. SUCCESS METRICS

### Platform Success Indicators
- Fellow completion rate > 80%
- Average competency score > 75%
- Portfolio approval rate on first submission > 60%
- Fellow engagement rate > 90%
- Time to program completion < planned duration
- Fellow satisfaction score > 4.5/5
- Facilitator efficiency (portfolios reviewed per week)

---

## APPENDIX: Route Map

### Public Routes
- `/` - Landing page
- `/login` - Role-based login
- `/admin-login` - Direct admin login
- `/get-started` - Onboarding information

### Admin Routes
- `/admin?tab=dashboard` - Overview
- `/admin?tab=companies` - Company management
- `/admin?tab=cohorts` - Cohort management
- `/admin?tab=competencies` - Competency library
- `/admin?tab=grounding` - Grounding modules
- `/admin?tab=fellow-management` - Fellow management
- `/admin?tab=facilitator-management` - Facilitator management
- `/admin?tab=profile` - Admin profile

### Facilitator Routes
- `/facilitator/[companyId]` - Facilitator dashboard
- `/facilitator/[companyId]?tab=cohorts` - Cohort view
- `/facilitator/[companyId]?tab=fellows` - Fellow tracking
- `/facilitator/[companyId]?tab=portfolios` - Portfolio evaluation
- `/facilitator/[companyId]?tab=performance` - Analytics

### Fellow Routes
- `/fellow/[companyId]` - Fellow dashboard
- `/fellow/[companyId]?tab=learning` - Learning modules
- `/fellow/[companyId]?tab=wave-[waveId]` - Wave view
- `/fellow/[companyId]?tab=wave-[waveId]&comp=[compId]` - Competency detail
- `/fellow/[companyId]?tab=performance` - Progress tracking
- `/fellow/[companyId]?tab=profile` - Fellow profile

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-24  
**Maintained By:** Development Team
