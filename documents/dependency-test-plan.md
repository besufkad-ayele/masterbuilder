# Comprehensive Dependency Test Plan

This document outlines the **exact order** of operations to create the full entity structure (Company, Cohort, Users, Competencies) to ensure no dependency errors occur. Follow these steps linearly.

---

## **Step 1: Create Master Competencies (Global)**
**Reason**: Cohorts need competencies to track progress. These must exist first.

1.  Navigate to **Admin Dashboard** > **Competencies** tab.
2.  Click **"Add Competency"**.
3.  **Entry 1 (Sample)**:
    -   **Title**: `Strategic Thinking`
    -   **Code**: `ST-001`
    -   **Description**: `Ability to plan for long-term organizational success.`
    -   **Level**: `Advanced`
    -   **Click Save**.
4.  **Entry 2 (Sample)**:
    -   **Title**: `Communication Excellence`
    -   **Code**: `COM-101`
    -   **Description**: `Clear and effective verbal and written communication.`
    -   **Level**: `Intermediate`
    -   **Click Save**.

---

## **Step 2: Create Grounding Dictionary (Global Template)**
**Reason**: Before assigning grounding modules to a company, a master "Dictionary" template must exist.

1.  Navigate to **Admin Dashboard** > **Grounding Modules** tab.
2.  Switch toggle to **Dictionary**.
3.  Click **"Create Dictionary"**.
4.  **Form Data (Sample)**:
    -   **Name**: `Executive Leadership Template`
    -   **Description**: `Standard curriculum for C-suite training.`
    -   **Module Structure**:
        -   **Internal Domain**: Add Factor -> Title: `Self-Awareness`.
        -   **External Domain**: Add Factor -> Title: `Market Analysis`.
    -   **Click Save**.

---

## **Step 3: Create Company (Organization)**
**Reason**: Cohorts, Fellows, and Libraries belong to a Company.

1.  Navigate to **Admin Dashboard** > **Companies** tab.
2.  Click **"Create Company"**.
3.  **Form Data (Sample)**:
    -   **Name**: `Acme Innovations`
    -   **Email**: `contact@acmeinno.com`
    -   **Industry**: `Technology`
    -   **Phone**: `911234567` (with country code +251)
    -   **Location**: `Addis Ababa`
    -   **Click Create**.
4.  **Verify**: You see "Acme Innovations" in the list. Note its ID (or name) for next steps.

---

## **Step 4: Create Cohort**
**Reason**: Fellows must belong to a Cohort, and a Cohort belongs to a Company.

1.  Navigate to **Admin Dashboard** > **Cohorts** tab.
2.  Click **"Create Cohort"**.
3.  **Form Data (Sample)**:
    -   **Name**: `Acme Leaders Q1`
    -   **Company**: Select `Acme Innovations`.
    -   **Start Date**: Today's Date.
    -   **End Date**: 3 months from now.
    -   **Status**: `Active`.
    -   **Competencies**: Select `Strategic Thinking` and `Communication Excellence` (created in Step 1).
    -   **Click Create**.

---

## **Step 5: Create Users (Fellows & Facilitators)**
**Reason**: Users are the final leaf nodes assigned to the structure above.

### A. Create a Facilitator
1.  Navigate to **Profile Management** > **Facilitator Management**.
2.  Click **"Add Facilitator"**.
3.  **Form Data**:
    -   **Name**: `Dr. Sarah Mentor`
    -   **Email**: `sarah@leadlife.com`
    -   **Assigned Companies**: Select `Acme Innovations`.
    -   **Specialization**: `Strategic Strategy`.
    -   **Click Create**.

### B. Create a Fellow
1.  Navigate to **Profile Management** > **Fellow Management**.
2.  Click **"Add Fellow"**.
3.  **Form Data**:
    -   **Name**: `John Doe`
    -   **Email**: `john.doe@acmeinno.com`
    -   **Company**: Select `Acme Innovations`.
    -   **Cohort**: Select `Acme Leaders Q1`.
    -   **Status**: `Active`.
    -   **Click Create**.

---

## **Validation**
1.  Go to **Admin Dashboard > Overview**.
    -   Check that `Active Company Agreements` count increased.
    -   Check that `Live Cohorts` count increased.
    -   Check that `Acme Leaders Q1` appears in the "Cohort health" list.
