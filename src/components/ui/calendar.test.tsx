import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

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
