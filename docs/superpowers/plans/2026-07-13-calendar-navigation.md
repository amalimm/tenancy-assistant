# Calendar Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore native shadcn calendar navigation and keep its controls stationary while changing months.

**Architecture:** Replace the legacy DayPicker class map with the current shadcn `radix-nova` component structure, while retaining the project-specific density prop used by the utility bill form. Keep fixed-height behavior at the shared date-range-picker boundary because every calendar rendered there is inside a repositionable popover.

**Tech Stack:** React 19, TypeScript 5, shadcn 4 `radix-nova`, React DayPicker 10, Tailwind CSS 4, Vitest, React Testing Library

## Global Constraints

- Work directly on `main`.
- Preserve `default` and `compact` calendar density modes.
- Preserve range selection and the existing inclusive/exclusive date conversion.
- Use current shadcn ghost navigation styling and a content-width calendar.
- Render six weeks in date-range-picker popovers so navigation controls do not move.

---

### Task 1: Capture Calendar Navigation Regressions

**Files:**
- Create: `src/components/ui/calendar.test.tsx`
- Create: `src/shared/ui/date-range-picker.test.tsx`

**Interfaces:**
- Consumes: `Calendar`, `DateRangePicker`
- Produces: Regression coverage for native navigation hit targets and fixed popover height

- [ ] **Step 1: Write the failing native-navigation test**

```tsx
import { fireEvent, render, screen } from "@testing-library/react"

import { Calendar } from "./calendar"

describe("Calendar", () => {
  it("uses native content-width ghost navigation and handles chevron clicks", () => {
    const { container } = render(
      <Calendar defaultMonth={new Date(2026, 1, 1)} mode="single" />,
    )

    expect(container.querySelector('[data-slot="calendar"]')).toHaveClass(
      "w-fit",
    )

    const nextButton = screen.getByRole("button", { name: /next month/i })
    expect(nextButton).toHaveClass("hover:bg-muted")

    const chevron = nextButton.querySelector("svg")
    expect(chevron).not.toBeNull()
    fireEvent.click(chevron!)

    expect(screen.getByText("March 2026")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Write the failing fixed-height picker test**

```tsx
import { fireEvent, render, screen, within } from "@testing-library/react"

import { DateRangePicker } from "./date-range-picker"

describe("DateRangePicker", () => {
  it("renders six week rows so month navigation remains stationary", async () => {
    render(
      <DateRangePicker
        endDate=""
        onRangeChange={() => undefined}
        placeholder="Select move-in date"
        startDate=""
      />,
    )

    fireEvent.click(
      screen.getByRole("button", { name: /select move-in date/i }),
    )

    const grid = await screen.findByRole("grid")
    expect(within(grid).getAllByRole("row")).toHaveLength(7)
  })
})
```

- [ ] **Step 3: Run tests and verify RED**

Run: `npm test -- src/components/ui/calendar.test.tsx src/shared/ui/date-range-picker.test.tsx`

Expected: FAIL because the current calendar has no `data-slot="calendar"`, uses outline navigation, and the picker does not request fixed weeks.

---

### Task 2: Adopt Native Shadcn Calendar Structure

**Files:**
- Modify: `src/components/ui/calendar.tsx`

**Interfaces:**
- Consumes: `DayPicker`, `getDefaultClassNames`, `DayButton`, `Locale`, project `Button`
- Produces: `Calendar`, `CalendarDayButton`, `CALENDAR_DENSITY`, `CalendarDensity`

- [ ] **Step 1: Replace the legacy wrapper with the native structure**

Replace `src/components/ui/calendar.tsx` with:

```tsx
"use client"

import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const CALENDAR_DENSITY = {
  COMPACT: "compact",
  DEFAULT: "default",
} as const

type CalendarDensity = (typeof CALENDAR_DENSITY)[keyof typeof CALENDAR_DENSITY]

function Calendar({
  buttonVariant = "ghost",
  captionLayout = "label",
  className,
  classNames,
  components,
  density = CALENDAR_DENSITY.DEFAULT,
  formatters,
  locale,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  density?: CalendarDensity
}) {
  const defaultClassNames = getDefaultClassNames()
  const isCompact = density === CALENDAR_DENSITY.COMPACT

  return (
    <DayPicker
      captionLayout={captionLayout}
      className={cn(
        "group/calendar bg-background p-2 [--cell-radius:var(--radius-md)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        isCompact
          ? "[--cell-size:--spacing(6)]"
          : "[--cell-size:--spacing(7)]",
        className,
      )}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          isCompact && "flex-row gap-3",
          defaultClassNames.months,
        ),
        month: cn(
          "flex w-full flex-col gap-4",
          isCompact && "gap-2",
          defaultClassNames.month,
        ),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative rounded-(--cell-radius)",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "absolute inset-0 bg-popover opacity-0",
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          "font-medium select-none",
          captionLayout === "label"
            ? "text-sm"
            : "flex items-center gap-1 rounded-(--cell-radius) text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
          defaultClassNames.caption_label,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        day: cn(
          "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
          defaultClassNames.day,
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
          defaultClassNames.range_start,
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
          defaultClassNames.range_end,
        ),
        today: cn(
          "rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...rootProps }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...rootProps}
          />
        ),
        Chevron: ({ className, orientation, ...chevronProps }) => {
          const ChevronIcon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : ChevronDown

          return (
            <ChevronIcon
              className={cn("size-4", className)}
              {...chevronProps}
            />
          )
        },
        DayButton: (dayButtonProps) => (
          <CalendarDayButton locale={locale} {...dayButtonProps} />
        ),
        ...components,
      }}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      locale={locale}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  locale,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className,
      )}
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-range-start={modifiers.range_start}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      ref={ref}
      size="icon"
      variant="ghost"
      {...props}
    />
  )
}

export {
  Calendar,
  CalendarDayButton,
  CALENDAR_DENSITY,
  type CalendarDensity,
}
```

- [ ] **Step 2: Run the calendar test and verify GREEN**

Run: `npm test -- src/components/ui/calendar.test.tsx`

Expected: PASS with direct clicks on the chevron changing February 2026 to March 2026.

---

### Task 3: Stabilize Date-Range Popovers

**Files:**
- Modify: `src/shared/ui/date-range-picker.tsx`

**Interfaces:**
- Consumes: shared `Calendar`
- Produces: A six-week range calendar inside every date-range popover

- [ ] **Step 1: Request fixed weeks from the picker boundary**

```tsx
<Calendar
  {...(calendarDensity ? { density: calendarDensity } : {})}
  fixedWeeks
  mode="range"
  numberOfMonths={numberOfMonths}
  onSelect={handleSelect}
  resetOnSelect
  selected={selectedRange}
/>
```

- [ ] **Step 2: Run focused tests and verify GREEN**

Run: `npm test -- src/components/ui/calendar.test.tsx src/shared/ui/date-range-picker.test.tsx`

Expected: PASS; the picker grid contains one weekday header plus six week rows.

- [ ] **Step 3: Run repository verification**

Run: `npm test && npm run typecheck && npm run lint && npm run build`

Expected: All commands exit 0 with no errors.

- [ ] **Step 4: Verify the running UI**

Open `http://localhost:4000`, navigate to the tenant creation form, open the move-in picker, click directly on each chevron, and repeatedly navigate across months with different natural week counts.

Expected: The calendar matches native shadcn proportions, both chevrons respond across their complete hit area, and neither navigation control moves between clicks.
