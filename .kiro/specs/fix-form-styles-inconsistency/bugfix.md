# Bugfix Requirements Document

## Introduction

Los formularios de creación/edición en el dashboard Angular presentan estilos inconsistentes entre componentes. El formulario de Users y el de Actions son el patrón correcto de referencia, pero los formularios de Parameters, Profiles y Profile personal no siguen las mismas convenciones de contenedor, tamaños de input/label/botón ni layout. Esto produce una experiencia visual fragmentada y rompe la coherencia del design system.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user opens the Parameters create/edit form THEN the system renders the form inside a `<div class="card"><div class="card-body">` container instead of the standard `tp-filter-bar` container

1.2 WHEN the user opens the Parameters create/edit form THEN the system renders inputs with class `form-control` (normal size) instead of `form-control-sm`

1.3 WHEN the user opens the Parameters create/edit form THEN the system renders selects with class `form-select` instead of `form-select-sm`

1.4 WHEN the user opens the Parameters create/edit form THEN the system renders labels with only `form-label` class instead of `form-label form-label-sm mb-1`

1.5 WHEN the user opens the Parameters create/edit form THEN the system renders action buttons at normal size (`btn-primary`, `btn-outline-secondary`) instead of `btn-sm`

1.6 WHEN the user opens the Parameters create/edit form THEN the system uses `tp-form-grid` layout instead of `row g-2 mb-3` with column classes

1.7 WHEN the user opens the Parameters create/edit form THEN the system does not render the section heading (`h6.text-muted.text-uppercase.fw-semibold`) above the field group

1.8 WHEN the user opens the Profiles create/edit form THEN the system renders the form without a `tp-filter-bar` container (no background/border)

1.9 WHEN the user opens the Profiles create/edit form THEN the system positions the Save and Cancel buttons in the page header (next to the title) instead of at the end of the form

1.10 WHEN the user opens the Profile personal edit form THEN the system renders the form inside a `<div class="card"><div class="card-body">` container instead of the standard `tp-filter-bar` container

1.11 WHEN the user opens the Profile personal edit form THEN the system renders inputs with class `form-control` (normal size) instead of `form-control-sm`

1.12 WHEN the user opens the Profile personal edit form THEN the system renders labels with only `form-label` class instead of `form-label form-label-sm mb-1`

1.13 WHEN the user opens the Profile personal edit form THEN the system renders the Save button at normal size without `btn-sm`

1.14 WHEN the user opens the Profile personal edit form THEN the system does not render a section heading (`h6.text-muted.text-uppercase.fw-semibold`) above the field group

1.15 WHEN the user opens the Profile personal edit form THEN the system uses `tp-form-grid` layout instead of `row g-2 mb-3` with column classes

### Expected Behavior (Correct)

2.1 WHEN the user opens the Parameters create/edit form THEN the system SHALL render the form inside a `<div class="tp-filter-bar">` container

2.2 WHEN the user opens the Parameters create/edit form THEN the system SHALL render all text inputs with class `form-control form-control-sm`

2.3 WHEN the user opens the Parameters create/edit form THEN the system SHALL render all selects with class `form-select form-select-sm`

2.4 WHEN the user opens the Parameters create/edit form THEN the system SHALL render all labels with classes `form-label form-label-sm mb-1`

2.5 WHEN the user opens the Parameters create/edit form THEN the system SHALL render action buttons with `btn-sm` class (e.g. `btn btn-primary btn-sm`, `btn btn-outline-secondary btn-sm`)

2.6 WHEN the user opens the Parameters create/edit form THEN the system SHALL use `row g-2 mb-3` layout with appropriate column classes (`col-md-4`, `col-12`, etc.)

2.7 WHEN the user opens the Parameters create/edit form THEN the system SHALL render a section heading (`<h6 class="text-muted text-uppercase fw-semibold mb-2">`) above the fields group

2.8 WHEN the user opens the Profiles create/edit form THEN the system SHALL wrap the form content inside a `<div class="tp-filter-bar">` container

2.9 WHEN the user opens the Profiles create/edit form THEN the system SHALL position the Save and Cancel buttons at the end of the form (inside the form, with `d-flex justify-content-end gap-2 mt-2`) instead of in the page header

2.10 WHEN the user opens the Profile personal edit form THEN the system SHALL render the form inside a `<div class="tp-filter-bar">` container instead of a card

2.11 WHEN the user opens the Profile personal edit form THEN the system SHALL render all text inputs with class `form-control form-control-sm`

2.12 WHEN the user opens the Profile personal edit form THEN the system SHALL render all labels with classes `form-label form-label-sm mb-1`

2.13 WHEN the user opens the Profile personal edit form THEN the system SHALL render the Save button with `btn-sm` class

2.14 WHEN the user opens the Profile personal edit form THEN the system SHALL render a section heading (`<h6 class="text-muted text-uppercase fw-semibold mb-2">`) above the fields group

2.15 WHEN the user opens the Profile personal edit form THEN the system SHALL use `row g-2 mb-3` layout with appropriate column classes (`col-md-4`, etc.)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user views the Users create/edit form THEN the system SHALL CONTINUE TO render the form with the existing correct styling pattern (tp-filter-bar, form-control-sm, btn-sm, row layout)

3.2 WHEN the user views the Actions edit form THEN the system SHALL CONTINUE TO render the form with the existing correct styling pattern (tp-filter-bar, form-control-sm, btn-sm, row layout)

3.3 WHEN the user views the login form THEN the system SHALL CONTINUE TO render it with its own special card-centered design, unmodified

3.4 WHEN the user views any list/filter section in Parameters, Profiles, or Users THEN the system SHALL CONTINUE TO render the filter bars and data tables with their current styling unchanged

3.5 WHEN the user views any detail view in Parameters, Profiles, or Users THEN the system SHALL CONTINUE TO render the detail cards with their current styling (card with tp-form-grid) unchanged

3.6 WHEN the user views the Profiles form fields (name, description, action assignment list) THEN the system SHALL CONTINUE TO render the fields with `form-control-sm` and the same structure, only the container and button placement changes

3.7 WHEN the user interacts with form functionality (submit, validate, cancel) in any of the affected forms THEN the system SHALL CONTINUE TO execute the same logic without behavioral changes
