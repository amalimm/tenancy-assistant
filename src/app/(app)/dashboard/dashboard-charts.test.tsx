import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

import { UTILITY_TYPE } from "@db/schema"

import type { MonthlyExpenseChartDatum } from "./dashboard-expense-data"

interface MockChartProps {
  allowEscapeViewBox?: {
    x?: boolean
    y?: boolean
  }
  children?: ReactNode
  cursor?: boolean
  isAnimationActive?: boolean | "auto"
  portal?: HTMLElement | null
  shared?: boolean
  wrapperStyle?: {
    pointerEvents?: string
  }
}

vi.mock("recharts", () => {
  const Primitive = ({ children }: MockChartProps) => <div>{children}</div>

  return {
    Bar: Primitive,
    BarChart: Primitive,
    CartesianGrid: Primitive,
    Line: Primitive,
    LineChart: Primitive,
    XAxis: Primitive,
    YAxis: Primitive,
  }
})

vi.mock("@/components/ui/chart", () => ({
  ChartContainer: ({ children }: MockChartProps) => (
    <div data-testid="chart-container">{children}</div>
  ),
  ChartTooltip: ({
    allowEscapeViewBox,
    cursor,
    isAnimationActive,
    portal,
    shared,
    wrapperStyle,
  }: MockChartProps) => (
    <div
      data-allow-escape-x={String(allowEscapeViewBox?.x)}
      data-allow-escape-y={String(allowEscapeViewBox?.y)}
      data-cursor={String(cursor)}
      data-is-animation-active={String(isAnimationActive)}
      data-portal-provided={String(portal !== undefined)}
      data-pointer-events={wrapperStyle?.pointerEvents}
      data-shared={String(shared)}
      data-testid="chart-tooltip"
    />
  ),
  ChartTooltipContent: () => <div data-testid="chart-tooltip-content" />,
}))

import {
  DashboardMonthlyExpenseTrendChart,
  DashboardMonthlyUtilityStackChart,
} from "./dashboard-charts"

const expenseData: MonthlyExpenseChartDatum[] = [
  {
    [UTILITY_TYPE.ELECTRICITY]: 120,
    [UTILITY_TYPE.INTERNET]: 80,
    [UTILITY_TYPE.OTHER]: 20,
    [UTILITY_TYPE.WATER]: 45,
    monthKey: "2026-06",
    monthLabel: "Jun 26",
    total: 265,
  },
  {
    [UTILITY_TYPE.ELECTRICITY]: 95,
    [UTILITY_TYPE.INTERNET]: 80,
    [UTILITY_TYPE.OTHER]: 28,
    [UTILITY_TYPE.WATER]: 52,
    monthKey: "2026-07",
    monthLabel: "Jul 26",
    total: 255,
  },
]

describe("dashboard charts", () => {
  it("keeps the horizontal expense tooltip responsive and outside chart clipping", () => {
    render(<DashboardMonthlyUtilityStackChart data={expenseData} />)

    const tooltip = screen.getByTestId("chart-tooltip")

    expect(tooltip).toHaveAttribute("data-is-animation-active", "false")
    expect(tooltip).toHaveAttribute("data-pointer-events", "none")
    expect(tooltip).toHaveAttribute("data-allow-escape-x", "true")
    expect(tooltip).toHaveAttribute("data-allow-escape-y", "true")
    expect(tooltip).toHaveAttribute("data-cursor", "false")
    expect(tooltip).toHaveAttribute("data-portal-provided", "false")
    expect(tooltip).toHaveAttribute("data-shared", "false")
  })

  it("uses the same instant tooltip behavior for the trend chart", () => {
    render(<DashboardMonthlyExpenseTrendChart data={expenseData} />)

    const tooltip = screen.getByTestId("chart-tooltip")

    expect(tooltip).toHaveAttribute("data-is-animation-active", "false")
    expect(tooltip).toHaveAttribute("data-pointer-events", "none")
  })
})
