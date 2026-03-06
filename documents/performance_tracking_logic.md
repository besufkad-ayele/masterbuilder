# Performance Tracking Architecture

This document defines the deep logic for each level of the MBLD fellowship performance system.

## 1. Grounding Level (10% Global Weight)
*   **Prerequisites**: All videos watched, all articles read.
*   **Verification**: "Part I Verification Assessment" (Quiz).
*   **Formula**: [(Score / 10) * 10%](file:///c:/Users/ayebe/Music/MBLD/lead-life/src/components/features/grounding/GroundingModuleView.tsx#736-737).
*   **Pass Threshold**: 5/10 (50%).
*   **Storage**: `grounding_results` collection.

## 2. Competency Level (Weighted Aggregate)
*   **Composition**: 
    *   **BI Proficiency (70%)**: Average of all BI scores in this competency.
    *   **Competency Exam (20%)**: Final assessment unlocked after all BIs are submitted.
    *   **Grounding Reference (10%)**: Global grounding score applied to each competency.
*   **Formula**: [(Grounding * 0.1) + (Avg(BI_Scores) * 0.7) + (Comp_Exam * 0.2)](file:///c:/Users/ayebe/Music/MBLD/lead-life/src/components/features/grounding/GroundingModuleView.tsx#736-737).
*   **Pass Threshold**: 75% overall.

## 3. Behavioral Indicator (BI) Level (Internal Split)
*   **Believe (Pass/Fail)**: Gatekeeper. Must be "Pass" to unlock Know/Do.
*   **Know (20%)**: Reflection Quiz result.
*   **Do (50%)**: STAR Portfolio (Approved & Scored).
*   **Formula**: [(Know_Score * 0.2) + (Do_Score * 0.5)](file:///c:/Users/ayebe/Music/MBLD/lead-life/src/components/features/grounding/GroundingModuleView.tsx#736-737). *Note: Result is out of 70% total at this level.*

## 4. Phase Level (Submission Rules)
### Believe Phase
*   **Requirement**: Engage with mindset content.
*   **Output**: Binary status.

### Know Phase
*   **Requirement**: Reflection Quiz.
*   **Pass Threshold**: 15/20 (75%).

### Do Phase (Portfolios)
*   **Limit**: Up to **3 portfolios** can be submitted per BI.
*   **Evaluation**: Only **one** approved and valued portfolio is used for the score.
*   **Pass Threshold**: 45/50 (90%) for the approved portfolio.
*   **Status**: Pending approval does not contribute to the score.

## 5. Implementation Mapping
| Collection | Field Mapping | Entity Reference |
| :--- | :--- | :--- |
| `grounding_results` | `score`, `status` | `fellow_id`, `grounding_id` |
| `phase_progress` | `phase_type`, `status`, `know_score` | `user_id`, `behavioral_indicator_id` |
| `portfolios` | `status`, `score`, `review_comment` | `user_id`, `behavioral_indicator_id` |
| `competency_exams` | `score`, `status` | `user_id`, `competency_id` |
