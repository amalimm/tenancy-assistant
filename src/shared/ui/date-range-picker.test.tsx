import { fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { DateRangePicker } from "./date-range-picker"

describe("DateRangePicker", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders six week rows so month navigation remains stationary", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 13))

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

    const grid = screen.getByRole("grid")
    expect(within(grid).getAllByRole("row")).toHaveLength(6)
  })
})
