import { describe, expect, it } from "vitest"

import { getCalendarRangeUpdate, toDateOnly } from "./calendar-range-update"

describe("calendar range update helpers", () => {
  it("normalizes FullCalendar date strings for drag and resize saves", () => {
    expect(
      getCalendarRangeUpdate({
        endStr: "2026-07-19T00:00:00+08:00",
        id: "absence-1",
        startStr: "2026-07-15T00:00:00+08:00",
      }),
    ).toEqual({
      absenceId: "absence-1",
      endDate: "2026-07-19",
      startDate: "2026-07-15",
    })
  })

  it("rejects incomplete range updates so the calendar can revert", () => {
    expect(
      getCalendarRangeUpdate({
        endStr: "",
        id: "absence-1",
        startStr: "2026-07-15",
      }),
    ).toBeNull()
  })

  it("rejects ranges where the exclusive end is not after the start", () => {
    expect(
      getCalendarRangeUpdate({
        endStr: "2026-07-15",
        id: "absence-1",
        startStr: "2026-07-15",
      }),
    ).toBeNull()
  })

  it("keeps date-only values unchanged", () => {
    expect(toDateOnly("2026-07-15")).toBe("2026-07-15")
  })
})
