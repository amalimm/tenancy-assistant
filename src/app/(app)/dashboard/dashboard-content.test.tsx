import { render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { UTILITY_TYPE, USER_ROLE } from "@db/schema"

import type { DashboardData } from "./data"

vi.mock("./actions", () => ({
  createAbsenceAction: vi.fn(),
  createHouseholdAction: vi.fn(),
  createTenantAction: vi.fn(),
  deleteAbsenceAction: vi.fn(),
  deleteBillingCycleAction: vi.fn(),
  deleteTenantAction: vi.fn(),
  markPaymentAction: vi.fn(),
  regenerateTenantPasswordAction: vi.fn(),
  runAllocationAction: vi.fn(),
  updateAbsenceAction: vi.fn(),
  uploadBillAction: vi.fn(),
}))

vi.mock("./dashboard-charts", () => ({
  DashboardMonthlyExpenseTrendChart: () => <div>Expense Trend Chart</div>,
  DashboardMonthlyUtilityStackChart: () => <div>Monthly Expense Chart</div>,
}))

vi.mock("@config/env", () => ({
  hasBlobConfig: true,
}))

import { DashboardOverview } from "./dashboard-content"

const dashboardData: DashboardData = {
  absences: [],
  allocationRuns: [],
  billingCycles: [
    {
      endDate: "2026-06-30",
      id: "cycle-june",
      name: "June Electricity",
      notes: null,
      startDate: "2026-06-01",
      totalAmountCents: 12_000,
      uploads: [],
      utilityProvider: "TNB",
      utilityType: UTILITY_TYPE.ELECTRICITY,
    },
    {
      endDate: "2026-07-31",
      id: "cycle-july",
      name: "July Water",
      notes: null,
      startDate: "2026-07-01",
      totalAmountCents: 8_000,
      uploads: [],
      utilityProvider: "Water Co",
      utilityType: UTILITY_TYPE.WATER,
    },
  ],
  currentTenantId: null,
  household: {
    address: null,
    id: "household-1",
    name: "Test Household",
  },
  tenants: [
    {
      calendarColor: "#2563eb",
      displayName: "Asha",
      email: "asha@example.com",
      id: "tenant-a",
      isLinked: true,
      notes: null,
      tenancyEndDate: null,
      tenancyStartDate: "2026-01-01",
    },
  ],
  user: {
    email: "admin@example.com",
    id: "user-1",
    name: "Admin",
    role: USER_ROLE.ADMIN,
  },
}

describe("DashboardOverview", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows a 30-day tenant calendar with a wider tenant column", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 13))

    render(<DashboardOverview data={dashboardData} />)

    expect(screen.getByText("Next 30 days")).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: "Asha, 11 Aug 2026: present",
      }),
    ).toBeInTheDocument()

    const calendarHeading = screen.getByRole("heading", {
      level: 2,
      name: "Tenant Calendar",
    })
    const calendarPanel = calendarHeading.closest("section")

    expect(calendarHeading).toBeInTheDocument()
    expect(calendarPanel).not.toBeNull()
    expect(within(calendarPanel!).getByText("Tenant").parentElement).toHaveStyle({
      gridTemplateColumns:
        "minmax(7rem,1.35fr) repeat(30, minmax(1.25rem,1fr))",
    })

    const occupancyLegend = within(calendarPanel!).getByRole("group", {
      name: "Occupancy status legend",
    })

    expect(calendarHeading.parentElement).toContainElement(occupancyLegend)
    expect(occupancyLegend).toHaveTextContent("Present")
    expect(occupancyLegend).toHaveTextContent("Out")
    expect(occupancyLegend).toHaveTextContent("Inactive")
    expect(
      screen.getByRole("heading", { level: 2, name: "Expenses" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 2, name: "Payment Queue" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 2, name: "Recent Bills" }),
    ).toBeInTheDocument()
  })

  it("groups expense charts under one expenses section without nested labels", () => {
    render(<DashboardOverview data={dashboardData} />)

    const expenses = screen.getByLabelText("Expenses")

    expect(within(expenses).queryByText("Monthly Expenses")).not.toBeInTheDocument()
    expect(within(expenses).queryByText("Expense Trend")).not.toBeInTheDocument()
    expect(within(expenses).getByText("Monthly Expense Chart")).toBeInTheDocument()
    expect(within(expenses).getByText("Expense Trend Chart")).toBeInTheDocument()
  })

  it("uses a distinct status palette for occupancy cells and the legend", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 13))

    const tenant = dashboardData.tenants[0]!

    render(
      <DashboardOverview
        data={{
          ...dashboardData,
          absences: [
            {
              calendarColor: tenant.calendarColor,
              displayName: tenant.displayName,
              endDate: "2026-07-15",
              id: "absence-1",
              reason: null,
              startDate: "2026-07-14",
              tenantId: tenant.id,
            },
          ],
          tenants: [{ ...tenant, tenancyEndDate: "2026-07-15" }],
        }}
      />,
    )

    expect(
      screen.getByRole("button", {
        name: "Asha, 13 Jul 2026: present",
      }),
    ).toHaveClass("border-border", "bg-muted/20")
    expect(
      screen.getByRole("button", {
        name: /Asha, 14 Jul 2026: out/,
      }),
    ).toHaveClass("border-muted-foreground/30", "bg-muted-foreground/35")
    expect(
      screen.getByRole("button", {
        name: "Asha, 15 Jul 2026: tenancy inactive",
      }),
    ).toHaveClass(
      "border-dashed",
      "border-muted-foreground/50",
      "bg-muted-foreground/60",
    )

    const legend = screen.getByRole("group", {
      name: "Occupancy status legend",
    })

    expect(within(legend).getByText("Present").firstElementChild).toHaveClass(
      "border-border",
      "bg-muted/20",
    )
    expect(within(legend).getByText("Out").firstElementChild).toHaveClass(
      "border-muted-foreground/30",
      "bg-muted-foreground/35",
    )
    expect(within(legend).getByText("Inactive").firstElementChild).toHaveClass(
      "border-dashed",
      "border-muted-foreground/50",
      "bg-muted-foreground/60",
    )
  })

  it("bounds dashboard panels inside the desktop viewport layout", () => {
    const { container } = render(<DashboardOverview data={dashboardData} />)
    const overview = container.firstElementChild

    expect(overview).toHaveClass("xl:h-[calc(100dvh-5rem)]")
    expect(overview).toHaveClass("xl:grid-rows-[auto_minmax(0,1fr)]")
    expect(overview).toHaveClass("xl:overflow-hidden")
  })

  it("shows a professional trend fallback when there is not enough data", () => {
    render(
      <DashboardOverview
        data={{
          ...dashboardData,
          billingCycles: [dashboardData.billingCycles[0]!],
        }}
      />,
    )

    const expenses = screen.getByLabelText("Expenses")

    expect(within(expenses).getByText("Not Enough Data")).toBeInTheDocument()
    expect(
      within(expenses).getByLabelText(
        "Not enough expense data for a trend chart",
      ),
    ).toBeInTheDocument()
    expect(
      within(expenses).queryByText("Need another month"),
    ).not.toBeInTheDocument()
  })

  it("uses a neutral sample line for the trend fallback", () => {
    render(
      <DashboardOverview
        data={{
          ...dashboardData,
          billingCycles: [dashboardData.billingCycles[0]!],
        }}
      />,
    )

    const fallbackChart = screen.getByLabelText(
      "Not enough expense data for a trend chart",
    )
    const trendPath = fallbackChart.querySelector(
      "path[data-fallback-trend-line]",
    )
    const pathValues =
      trendPath
        ?.getAttribute("d")
        ?.match(/-?\d+(?:\.\d+)?/g)
        ?.map(Number) ?? []
    const yValues = pathValues.filter((_, index) => index % 2 === 1)
    const startY = yValues[0]
    const endY = yValues.at(-1)
    const hasUpwardSegment = yValues.some(
      (value, index) => index > 0 && value < yValues[index - 1]!,
    )
    const hasDownwardSegment = yValues.some(
      (value, index) => index > 0 && value > yValues[index - 1]!,
    )

    expect(startY).toBeDefined()
    expect(endY).toBeDefined()
    expect(Math.abs(endY! - startY!)).toBeLessThanOrEqual(24)
    expect(hasUpwardSegment).toBe(true)
    expect(hasDownwardSegment).toBe(true)
    expect(trendPath).toHaveAttribute("stroke-width", "2")
  })

  it("shows recent bill periods with readable long date ranges", () => {
    render(<DashboardOverview data={dashboardData} />)

    const recentBills = screen
      .getByRole("heading", { level: 2, name: "Recent Bills" })
      .closest("section")

    expect(recentBills).not.toBeNull()
    expect(within(recentBills!).getByText(/1 Jul 2026 to 30 Jul 2026/u))
      .toBeInTheDocument()
    expect(
      within(recentBills!).queryByText(/01\/07\/2026-30\/07\/2026/u),
    ).not.toBeInTheDocument()
  })
})
