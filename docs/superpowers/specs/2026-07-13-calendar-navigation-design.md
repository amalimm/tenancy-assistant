# Calendar Navigation Design

## Goal

Restore the shared date picker to the current shadcn `radix-nova` calendar
structure and make month navigation remain under the pointer during repeated
clicks.

## Root Cause

The existing wrapper predates the installed DayPicker 10 and shadcn 4
components. It stretches the calendar to the popover width, positions an
outlined navigation bar across that width, and renders a variable number of
week rows. In an upward-opening popover, a month-height change moves the top of
the calendar and therefore moves the navigation controls.

## Design

- Base the shared `Calendar` class names and custom day button on the current
  shadcn `radix-nova` registry component.
- Use a content-width calendar with native ghost navigation buttons positioned
  beside the caption.
- Preserve the existing `default` and `compact` density modes. Compact mode is
  still required by the two-month utility bill picker.
- Pass `fixedWeeks` from the shared date-range picker so all of its popover
  calendars render six week rows and keep their navigation controls stationary.
- Preserve existing range selection, inclusive/exclusive date conversion, and
  form field behavior.

## Verification

- Add component tests before implementation for native-sized ghost navigation
  controls, retained compact sizing, and fixed-week picker wiring.
- Run the focused tests, the full Vitest suite, type checking, and linting.
- Verify on `http://localhost:4000` that clicking directly on either chevron
  navigates and that repeated navigation does not move the control.
