```markdown
# Admin Dashboard - Detailed Manual Testing Checklist

## 1. Authentication & Access Control
- [ ] **Admin Login**: Navigate to `/login`, enter admin credentials, and click "Login".
- [ ] **Redirection**: Verify immediate redirection to `/admin?tab=dashboard`.
- [ ] **URL Persistence**: Verify the `tab=dashboard` query parameter is present in the address bar.
- [ ] **Unauthorized Access (Unauthenticated)**: Open a private window, navigate to `/admin`, and verify redirection to `/login`.
- [ ] **Unauthorized Access (Fellow)**: Log in as a Fellow, attempt to navigate to `/admin`, and verify "Access Denied" or redirection to `/dashboard`.

## 2. Dashboard Overview & Analytics
- [ ] **Initial Load State**: Refresh the page and verify the global loading spinner appears before data renders.
- [ ] **Stats Cards Accuracy**:
    - [ ] **Active Company Agreements**: Cross-reference count with the total rows in the 'Companies' tab.
    - [ ] **Live Cohorts**: Cross-reference count with the total items in the 'Cohorts' list.
    - [ ] **Fellow Engagement**: Manually calculate `(Active Fellows / Total Fellows) * 100` and verify the percentage matches.
    - [ ] **Coaches & Mentors**: Cross-reference count with the total rows in 'Facilitator Management'.
- [ ] **Cohort Health Table**:
    - [ ] Verify the list renders at least one cohort (if data exists).
    - [ ] Verify "Risk Level" badges (Low/Medium/High) are color-coded correctly.
    - [ ] Verify "Engagement Stats" sparklines or percentages are visible.
- [ ] **Quick Navigation**:
    - [ ] Click "Companies" card -> Verify navigation to `/admin?tab=companies`.
    - [ ] Click "Fellows" card -> Verify navigation to `/admin?tab=fellow-management`.

## 3. Company Management ('Companies' Tab)
- [ ] **Data Grid**: Verify columns for Name, Email, Industry, Location, and Phone are populated.
- [ ] **Create Company Workflow**:
    - [ ] Click "Create Company" to open the modal.
    - [ ] Fill in all required fields.
    - [ ] **Phone Logic**: Toggle "Phone" input; verify the country code prefix (e.g., +1) is prepended.
    - [ ] **Submission State**: Click "Create"; verify the button text changes to "Creating..." and shows a spinner.
    - [ ] **Success Handling**: Verify the modal closes, a success toast appears, and the new company appears at the top of the list.
- [ ] **Update Company Workflow**:
    - [ ] Click "Edit" on an existing row.
    - [ ] Modify the "Industry" and "Location" fields.
    - [ ] Click "Save Changes"; verify "Saving..." state and list update.
- [ ] **Delete Company Workflow**:
    - [ ] Click "Delete" on a row.
    - [ ] **Validation**: Type an incorrect company name; verify the "Delete" button remains disabled or shows an error alert.
    - [ ] **Execution**: Type the exact company name; verify the button text changes to "Deleting..." and the row is removed from the UI.

## 4. Grounding Dictionaries ('Grounding Modules' Tab)
- [ ] **Dictionary Creation**:
    - [ ] Click "Create Dictionary" and fill in the header info.
    - [ ] **Dynamic Form Logic**: Click "Add Internal Domain Factor".
    - [ ] **Toggle Behavior**: 
        - [ ] Click "Markdown" -> Verify the Markdown editor/textarea is visible and the Link input is hidden.
        - [ ] Click "External Link" -> Verify the URL input is visible and the Markdown editor is hidden.
    - [ ] **State Persistence**: Enter text in Markdown, switch to Link, then back to Markdown; verify if data is cleared or preserved based on requirements.
- [ ] **Persistence**: Save the dictionary and verify it appears in the Grounding Modules list.

## 5. Profile & User Management
- [ ] **Management Navigation**:
    - [ ] Navigate to "Profile Management" tab.
    - [ ] Click "Fellow Management" -> Verify it switches the active tab/view to the Fellow list.
    - [ ] Click "Facilitator Management" -> Verify it switches the active tab/view to the Facilitator list.
- [ ] **Admin Profile View ('My Profile')**:
    - [ ] Navigate to "My Profile".
    - [ ] **Role-Based UI**: Verify "Contact Info" and "System Activity" are visible.
    - [ ] **Exclusion Check**: Ensure Fellow-specific fields (Qualifications, Learning Goals, Behavioral Traits) are **NOT** rendered.

## 6. Caching, Performance & State
- [ ] **SWR/Cache Verification**:
    - [ ] Load the Dashboard.
    - [ ] Navigate to "Companies", then click the back button or "Dashboard" tab.
    - [ ] **Verify**: Data should render instantly from cache without a new loading spinner.
- [ ] **Cache Invalidation**:
    - [ ] Perform a hard refresh (Cmd+R / F5).
    - [ ] **Verify**: The loading spinner must appear as the cache is rehydrated.
- [ ] **Data Consistency**: Update a company name, navigate to the Dashboard, and verify if any aggregate stats (if applicable) reflect the change immediately.
```
