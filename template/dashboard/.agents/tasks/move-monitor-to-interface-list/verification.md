# Verification — Move `monitor` component to `pages/interface-list`

Working directory for all commands: `template/dashboard`.

## Build

Command:

```bash
npx ng build
```

Result: **PASS**. Application bundle generation complete (no errors). The lazy chunk
`interface-list-component` is emitted, confirming the moved component compiles and is
wired into the route. No broken relative imports.

## Tests — new spec

Command:

```bash
npx ng test --include=src/app/features/interfaces/pages/interface-list/interface-list.component.spec.ts
```

Result: **PASS**. 1 test file, 4 tests passed:
- `should create`
- `ngOnInit` loads without throwing, clears loading and starts in `list` view
- `clearFilters` resets all five filter signals and `currentPage` to 0
- `applyFilters` with invalid date range does not reload (`hasInvalidDateRange()` true, page unchanged)

## Tests — interfaces module suite (regression)

Command:

```bash
npx ng test --include="src/app/features/interfaces/**/*.spec.ts"
```

Result: **PASS**. 4 test files, 44 tests passed.

## Reference check before deleting old folder

```bash
grep -rn "monitor/monitor.component|MonitorComponent" src/   # only matched the old file itself
```

After updating the route, the only remaining references were inside the old
`monitor/` folder, which was then deleted. No remaining `MonitorComponent` references.
