# UI Framework

CapperWeb intentionally uses **custom Tailwind components** in `src/components/common/ui.tsx` rather than [shadcn/ui](https://ui.shadcn.com/).

## Rationale

- Smaller bundle — no Radix dependency tree for the initial control-plane MVP
- Full control over styling aligned with the Capper dark theme
- Components are thin wrappers (`Button`, `Card`, `ConfirmDialog`, `StatusBadge`) matching SPEC interaction patterns

## When to adopt shadcn

Consider migrating if you need accessible comboboxes, complex dialogs, or form primitives at scale. The migration path is documented in SPEC Phase 4 polish.

## Component map

| SPEC pattern   | Implementation                          |
|----------------|-----------------------------------------|
| ConfirmDialog  | `ConfirmDialog` in `ui.tsx`             |
| StatusBadge    | `StatusBadge` / `DaemonBadge`           |
| DataTable      | Native `<table>` with Tailwind            |
| PageHeader     | `PageHeader`                            |
| Empty states   | `EmptyState`                            |
