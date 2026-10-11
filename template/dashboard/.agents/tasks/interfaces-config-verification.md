# Verification — Interfaces Configuration Refactor

Verification run once, batched, after all edits, from `template/dashboard/`.

## Build

Command:

```bash
npm run build
```

Real result: **SUCCESS** (exit code 0). Application bundle generation complete.
The lazy chunk `configuration-list-component` is produced, confirming the route now
resolves to the new `ConfigurationListComponent` at its `pages/` location:

```
chunk-DdZA5vee.js   | configuration-list-component |  17.30 kB |  4.10 kB
```

No TypeScript or template errors.

## Tests

Command:

```bash
npm test
```

Real result: **SUCCESS** (exit code 0). Runner: Vitest.

```
Test Files  54 passed (54)
     Tests  631 passed (631)
```

Includes the two new specs:
- `src/app/features/interfaces/pages/configuration-list/configuration-list.component.spec.ts`
- `src/app/features/interfaces/components/configuration-form/configuration-form.component.spec.ts`

No regressions in `monitor`, `interface.service`, or other interface tests.

## Orphan reference check

Command:

```bash
grep -rE "ConfigurationComponent|app-interfaces-configuration|configuration/configuration.component" template/dashboard/src
```

Real result: **No matches found.** The old `interfaces/configuration/` folder was deleted
and no orphan references remain.

## Summary of changes

- Added `features/interfaces/pages/configuration-list/` (`ConfigurationListComponent`, selector `app-configuration-list`) with all prior listing logic (data load, filters name/protocol/status, pagination, sort, row selection, CSV export, `viewMode` + detail navigation) and its spec.
- Added `features/interfaces/components/configuration-form/` (`ConfigurationFormComponent`, selector `app-configuration-form`) — reusable form with `FormMode = 'create' | 'edit' | 'view'`, `isReadonly = computed(() => mode() === 'view')`, `input.required<FormMode>()` for mode, `input<InterfaceConfig | null>()` for the entity, and `back`/`cancel` outputs. Only `view` is functional now; renders name, status, description, url, protocol, checkFrequency and the audit fields createdAt/lastModifiedAt as readonly+disabled inputs using the existing `interfaces.configuration.*` keys. Includes its spec.
- Updated `interfaces.routes.ts` to `loadComponent` the new list at `./pages/configuration-list/configuration-list.component`.
- Deleted the old `features/interfaces/configuration/` folder.
