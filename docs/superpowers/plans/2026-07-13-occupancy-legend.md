# Occupancy Legend Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Tenant Calendar occupancy legend into its top-right header and remove the footer legend row.

**Architecture:** Generalize the existing `DashboardPanel` metadata slot from `string` to `ReactNode`, then pass a responsive date-range and legend composition from `OccupancyBoard`. Keep occupancy data and cell rendering untouched.

**Tech Stack:** React 19, TypeScript 5, Tailwind CSS 4, Vitest, React Testing Library

## Global Constraints

- Preserve the existing shadcn dashboard visual language.
- Keep `Present`, `Out`, and `Inactive` labels and colors unchanged.
- Keep the legend right-aligned and allow it to stack on narrow screens.
- Add no dependencies, animation, or occupancy behavior changes.
- Leave the development server listening on port 4000.

---

### Task 1: Move the Occupancy Legend

**Files:**
- Modify: `src/app/(app)/dashboard/dashboard-content.test.tsx`
- Modify: `src/app/(app)/dashboard/dashboard-content.tsx`

**Interfaces:**
- Consumes: `DashboardPanel`, `OccupancyBoard`, `ReactNode`
- Produces: A labelled `Occupancy status legend` group inside the Tenant Calendar header

- [ ] **Step 1: Write the failing placement test**

Add to the existing Tenant Calendar test after its heading assertion:

```tsx
const calendarHeading = screen.getByRole("heading", {
  level: 2,
  name: "Tenant Calendar",
})
const calendarPanel = calendarHeading.closest("section")

expect(calendarPanel).not.toBeNull()

const occupancyLegend = within(calendarPanel!).getByRole("group", {
  name: "Occupancy status legend",
})

expect(calendarHeading.parentElement).toContainElement(occupancyLegend)
expect(occupancyLegend).toHaveTextContent("Present")
expect(occupancyLegend).toHaveTextContent("Out")
expect(occupancyLegend).toHaveTextContent("Inactive")
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- 'src/app/(app)/dashboard/dashboard-content.test.tsx'`

Expected: FAIL because no labelled occupancy legend exists in the panel header.

- [ ] **Step 3: Implement the compact header legend**

Change the `DashboardPanel` metadata prop and wrapper to:

```tsx
meta?: ReactNode

{meta ? (
  <div className="text-xs text-muted-foreground">{meta}</div>
) : null}
```

Add the static legend definition near the occupancy components:

```tsx
const OCCUPANCY_STATUS_LEGEND = [
  ["Present", "bg-background"],
  ["Out", "bg-muted-foreground/35 dark:bg-muted-foreground/45"],
  ["Inactive", "bg-muted/30 dark:bg-muted/20"],
] as const
```

Replace the `OccupancyBoard` string metadata with:

```tsx
meta={
  <div className="flex max-w-full flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
    <span className="whitespace-nowrap">Next 14 days</span>
    <div
      aria-label="Occupancy status legend"
      className="flex flex-wrap items-center justify-end gap-3"
      role="group"
    >
      {OCCUPANCY_STATUS_LEGEND.map(([label, swatchClassName]) => (
        <span className="flex items-center gap-1.5" key={label}>
          <span
            aria-hidden="true"
            className={cn(
              "size-2.5 rounded-[3px] border border-border",
              swatchClassName,
            )}
          />
          {label}
        </span>
      ))}
    </div>
  </div>
}
```

Delete the existing bottom legend `<div>` after the tenant rows.

- [ ] **Step 4: Run verification and verify GREEN**

Run: `npm test -- 'src/app/(app)/dashboard/dashboard-content.test.tsx' && npm run typecheck && npm run lint`

Expected: The dashboard tests pass and both static checks exit 0.

- [ ] **Step 5: Run the full suite**

Run: `npm test`

Expected: All tests pass with zero failures.
