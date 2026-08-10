# Fix Form Styles Inconsistency — Bugfix Design

## Overview

The create/edit forms in three components (Parameters, Profiles, and Profile personal) use inconsistent HTML structure and CSS classes compared to the reference pattern established by the Users and Actions forms. The fix is purely template-level (HTML only): replace incorrect containers, class sizes, layouts, and button placements to match the standard pattern. No TypeScript logic changes are needed.

## Glossary

- **Bug_Condition (C)**: The form styling diverges from the reference pattern — the form uses incorrect container classes, input sizes, label sizes, layout grid, or button placement.
- **Property (P)**: All create/edit forms SHALL render with identical structure: `tp-filter-bar` container, `form-control-sm` inputs, `form-label-sm mb-1` labels, `form-select-sm` selects, `row g-2 mb-3` layout with column classes, section heading `h6`, and action buttons with `btn-sm` at the end of the form.
- **Preservation**: Existing list views, filter bars, detail views, login form, and the already-correct Users/Actions forms must remain unchanged. No behavioral (TypeScript) changes.
- **Reference Pattern**: The Users form (`users.component.html`) create/edit section, which uses `tp-filter-bar`, `form-control-sm`, `form-label form-label-sm mb-1`, `form-select-sm`, `row g-2 mb-3`, `col-md-*`, `h6.text-muted.text-uppercase.fw-semibold`, and buttons at end with `btn-sm`.
- **tp-filter-bar**: A project CSS utility class that provides a subtle bordered container with background and padding for form sections.
- **tp-form-grid**: A CSS grid layout used in detail/read-only views — NOT appropriate for editable forms.

## Bug Details

### Bug Condition

The bug manifests when a user opens the create/edit form in the Parameters, Profiles, or Profile personal components. These forms render with a different visual structure than the Users form, producing an inconsistent UI.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { component: string, viewMode: string }
  OUTPUT: boolean

  RETURN input.viewMode IN ['create', 'edit', 'form']
         AND input.component IN ['parameters', 'profiles', 'profile']
         AND formRendersWithIncorrectStyling(input.component)
END FUNCTION
```

Where `formRendersWithIncorrectStyling` is true when any of:
- Container is `card > card-body` instead of `tp-filter-bar`
- Inputs use `form-control` without `form-control-sm`
- Labels use `form-label` without `form-label-sm mb-1`
- Selects use `form-select` without `form-select-sm`
- Layout uses `tp-form-grid` instead of `row g-2 mb-3`
- Section heading `h6` is missing
- Action buttons lack `btn-sm` or are placed in the page header

### Examples

- **Parameters form**: Opens inside a `card > card-body` with `tp-form-grid`, labels with only `form-label`, inputs with only `form-control`, selects with only `form-select`, no section heading, and buttons without `btn-sm`. Expected: `tp-filter-bar` container, `form-control-sm`, `form-label-sm mb-1`, `form-select-sm`, `row g-2 mb-3` layout, `h6` section heading, `btn-sm` on buttons.
- **Profiles form**: Opens without any container div, and the Save/Cancel buttons are positioned in the page header alongside the title. Expected: `tp-filter-bar` wrapper around the form, buttons at end of form inside the form element.
- **Profile personal form**: Opens inside a `card > card-body` with `tp-form-grid`, labels with `form-label` (no sm), inputs with `form-control` (no sm), save button without `btn-sm`, margin `mt-4` instead of `mt-2`, no section heading. Expected: `tp-filter-bar` container, `form-control-sm`, `form-label-sm mb-1`, `row g-2 mb-3` layout, `h6` section heading, `btn-sm`, `mt-2`.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- The Users create/edit form must continue to render with its existing correct styling pattern
- The Actions edit form must continue to render with its existing correct styling pattern
- The login form must continue to render with its own special card-centered design, completely unmodified
- All list/filter sections in Parameters, Profiles, and Users must continue to render with their current tp-filter-bar styling unchanged
- All detail views must continue to render with their current card + tp-form-grid styling unchanged
- The Profiles form fields (name, description, action assignment list) must continue to use `form-control-sm` and the same internal field structure — only the container and button placement changes
- All form functionality (submit, validate, cancel, navigation) must continue to work identically with no behavioral changes

**Scope:**
All views and components that are NOT the create/edit form sections of Parameters, Profiles, or Profile personal are completely unaffected by this fix. This includes:
- List views with data tables
- Detail views with read-only card layouts
- Filter bars (already correct)
- Toolbar buttons
- Delete confirmation modals
- Login form

## Hypothesized Root Cause

Based on code analysis, the root causes are:

1. **Parameters form was built using the detail view pattern**: The developer reused the `card > card-body > tp-form-grid` structure from the detail view for the edit form, instead of following the Users form pattern. This was likely a copy-paste from the detail section.

2. **Profiles form buttons placed in header for UX convenience**: The developer placed Save/Cancel buttons in the page header next to the title for immediate visibility, but this diverges from the standard pattern where buttons are at the bottom of the form inside the container. The form itself was never wrapped in `tp-filter-bar`.

3. **Profile personal form was built independently**: The Profile component was likely developed separately from the administration section and adopted the card pattern for visual grouping, without knowledge of the `tp-filter-bar` convention established in the Users form.

4. **No shared form component or style guide enforcement**: Without a shared form layout component or automated style linting, each developer made independent structural choices, leading to drift.

## Correctness Properties

Property 1: Bug Condition - Form Styling Matches Reference Pattern

_For any_ form view in the affected components (Parameters create/edit, Profiles form, Profile personal edit), the fixed template SHALL render with `tp-filter-bar` container, `form-control-sm` on inputs, `form-label form-label-sm mb-1` on labels, `form-select-sm` on selects, `row g-2 mb-3` with column classes for layout, a section heading `h6.text-muted.text-uppercase.fw-semibold`, and action buttons with `btn-sm` positioned at the end of the form.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 2.15**

Property 2: Preservation - Unchanged Components and Views

_For any_ view that is NOT one of the affected form sections (Users form, Actions form, login form, all list views, all detail views, all filter bars), the fixed templates SHALL produce exactly the same rendered HTML as the original templates, preserving all existing styling and behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

All changes are HTML template modifications only. No TypeScript files are modified.

**File 1**: `template-dashboard/src/app/features/administration/parameters/parameters.component.html`

**Section**: CREATE / EDIT FORM (lines starting at `@if (viewMode() === 'create' || viewMode() === 'edit')`)

**Specific Changes**:
1. **Replace container**: Change `<div class="card"><div class="card-body">` to `<div class="tp-filter-bar">`
2. **Replace layout**: Change `<div class="tp-form-grid">` to `<div class="row g-2 mb-3">` with appropriate column wrappers (`col-md-4`, `col-12`)
3. **Add section heading**: Insert `<h6 class="text-muted text-uppercase fw-semibold mb-2" style="font-size: 0.75rem; letter-spacing: 0.05em;">` before the fields
4. **Fix labels**: Change `class="form-label"` to `class="form-label form-label-sm mb-1"`
5. **Fix inputs**: Change `class="form-control"` to `class="form-control form-control-sm"` (preserve `[class.is-invalid]` binding)
6. **Fix selects**: Change `class="form-select"` to `class="form-select form-select-sm"`
7. **Fix buttons**: Add `btn-sm` class to Save and Cancel buttons; change `mt-3` to `mt-2`
8. **Replace form-group divs**: Change `<div class="form-group">` and `<div class="form-group form-field-full">` to `<div class="col-md-4">` and `<div class="col-12">` respectively

---

**File 2**: `template-dashboard/src/app/features/administration/security/profiles/profiles.component.html`

**Section**: CREATE / EDIT FORM (lines starting at `@if (viewMode() === 'form')`)

**Specific Changes**:
1. **Add container**: Wrap the `<form>` element inside `<div class="tp-filter-bar">`
2. **Move buttons**: Remove Save and Cancel buttons from the page header div and place them at the end of the form, inside a `<div class="col-12 d-flex justify-content-end gap-2 mt-2">`
3. **Remove header buttons div**: The header should only contain the title (no action buttons)

---

**File 3**: `template-dashboard/src/app/features/profile/profile.component.html`

**Section**: The entire form section (inside `@else` after loading)

**Specific Changes**:
1. **Replace container**: Change `<div class="card"><div class="card-body">` to `<div class="tp-filter-bar">`
2. **Replace layout**: Change `<div class="tp-form-grid">` to `<div class="row g-2 mb-3">` with `<div class="col-md-4">` wrappers for each field
3. **Add section heading**: Insert `<h6 class="text-muted text-uppercase fw-semibold mb-2" style="font-size: 0.75rem; letter-spacing: 0.05em;">` before the fields (use translated key `'profile.sectionGeneral'`)
4. **Fix labels**: Change `class="form-label"` to `class="form-label form-label-sm mb-1"`
5. **Fix inputs**: Change `class="form-control"` to `class="form-control form-control-sm"` (preserve `readonly` and `[class.is-invalid]` bindings)
6. **Fix button**: Add `btn-sm` to the save button; change `mt-4` to `mt-2`
7. **Remove mb-3 on individual fields**: Replace `<div class="mb-3">` field wrappers with `<div class="col-md-4">` (row layout handles spacing via `g-2`)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code (visual inspection and DOM assertions), then verify the fix works correctly and preserves existing behavior. Since this is a pure CSS-class/HTML-structure bug, testing focuses on DOM structure assertions.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause by inspecting rendered DOM structure.

**Test Plan**: Write component tests (using Angular TestBed) that render each affected component in form mode and assert on the DOM structure and CSS classes. Run these tests on the UNFIXED code to observe failures confirming the incorrect classes.

**Test Cases**:
1. **Parameters Form Container Test**: Render parameters component in 'create' mode, query for `.tp-filter-bar` wrapper — will fail because current code uses `.card > .card-body`
2. **Parameters Form Input Size Test**: Render parameters component in 'create' mode, query all `input.form-control-sm` — will fail because inputs only have `form-control`
3. **Profiles Form Container Test**: Render profiles component in 'form' mode, query for `.tp-filter-bar` wrapper — will fail because no container exists
4. **Profiles Form Button Placement Test**: Render profiles component in 'form' mode, assert buttons are inside the form element — will fail because buttons are in the header
5. **Profile Personal Container Test**: Render profile component, query for `.tp-filter-bar` wrapper — will fail because current code uses `.card > .card-body`

**Expected Counterexamples**:
- DOM queries for `.tp-filter-bar` return null in Parameters and Profile forms
- DOM queries for `input.form-control-sm` return empty NodeList in Parameters and Profile forms
- Buttons in Profiles form are found outside the `<form>` element

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed templates produce the expected DOM structure.

**Pseudocode:**
```
FOR ALL component IN ['parameters', 'profiles', 'profile'] DO
  FOR ALL viewMode IN applicableFormModes(component) DO
    rendered := renderComponent(component, viewMode)
    ASSERT rendered.querySelector('.tp-filter-bar') IS NOT NULL
    ASSERT rendered.querySelectorAll('input.form-control-sm').length > 0
    ASSERT rendered.querySelectorAll('label.form-label-sm').length > 0
    ASSERT rendered.querySelector('.row.g-2.mb-3') IS NOT NULL
    ASSERT rendered.querySelector('h6.text-muted.text-uppercase.fw-semibold') IS NOT NULL
    ASSERT rendered.querySelectorAll('button.btn-sm').length >= 1
    ASSERT buttonsAreInsideForm(rendered)
  END FOR
END FOR
```

### Preservation Checking

**Goal**: Verify that for all views where the bug condition does NOT hold, the templates produce the same DOM as the original code.

**Pseudocode:**
```
FOR ALL component IN ['parameters', 'profiles', 'profile', 'users', 'actions'] DO
  FOR ALL viewMode IN nonFormModes(component) DO
    ASSERT renderComponent_original(component, viewMode) = renderComponent_fixed(component, viewMode)
  END FOR
END FOR

FOR component = 'users' DO
  FOR ALL viewMode IN ['create', 'edit'] DO
    ASSERT renderComponent_original(component, viewMode) = renderComponent_fixed(component, viewMode)
  END FOR
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It can generate many different component states (different data, different selections)
- It catches edge cases where conditional rendering might be affected
- It provides strong guarantees that non-form views are completely unchanged

**Test Plan**: Observe behavior on UNFIXED code first for list views, detail views, and the Users form, then write tests capturing that the DOM structure remains identical after fix.

**Test Cases**:
1. **Users Form Preservation**: Verify Users create/edit form continues to render with `tp-filter-bar`, `form-control-sm`, `btn-sm` — unchanged by this fix
2. **Parameters List Preservation**: Verify Parameters list view (filter bar, toolbar, table) renders identically after fix
3. **Profiles Detail Preservation**: Verify Profiles detail view (card with tp-form-grid) renders identically after fix
4. **Profile Loading State Preservation**: Verify Profile component loading spinner renders identically after fix
5. **Login Form Preservation**: Verify login form is completely untouched

### Unit Tests

- Test each affected component in form mode: assert `tp-filter-bar` container present
- Test each affected component in form mode: assert all inputs have `form-control-sm`
- Test each affected component in form mode: assert all labels have `form-label-sm mb-1`
- Test each affected component in form mode: assert `row g-2 mb-3` layout present
- Test each affected component in form mode: assert section heading `h6` present
- Test each affected component in form mode: assert action buttons have `btn-sm`
- Test Profiles component in form mode: assert buttons are inside the form, not in the header

### Property-Based Tests

- Generate random form data for each component and verify DOM structure matches the reference pattern regardless of data content
- Generate random component states (create vs edit) and verify styling is consistent in both modes
- Test that class lists on form elements match exactly the reference pattern across many renders

### Integration Tests

- Full visual regression: render each affected form and compare screenshot against Users form layout
- Navigation flow: open list -> create -> fill form -> save -> verify correct container/classes at each step
- Edit flow: open list -> select -> detail -> edit -> verify form renders with correct styling
