"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { UTILITY_TYPE } from "@db/schema"
import { formatCurrency } from "@shared/lib/format"

import type { MonthlyExpenseChartDatum } from "./dashboard-expense-data"

const dashboardTooltipProps = {
  allowEscapeViewBox: { x: true, y: true },
  isAnimationActive: false,
  wrapperStyle: { pointerEvents: "none" },
} as const

const utilityExpenseChartConfig = {
  [UTILITY_TYPE.ELECTRICITY]: {
    color: "var(--utility-electricity)",
    label: "Electricity",
  },
  [UTILITY_TYPE.WATER]: {
    color: "var(--utility-water)",
    label: "Water",
  },
  [UTILITY_TYPE.INTERNET]: {
    color: "var(--utility-internet)",
    label: "Internet",
  },
  [UTILITY_TYPE.OTHER]: {
    color: "var(--utility-other)",
    label: "Other",
  },
} satisfies ChartConfig

const expenseTrendChartConfig = {
  total: {
    color: "var(--chart-3)",
    label: "Total",
  },
} satisfies ChartConfig

const formatTooltipAmount = (value: unknown) => {
  const amount = Number(value)

  return Number.isFinite(amount) ? formatCurrency(amount * 100) : String(value)
}

const formatAxisAmount = (value: unknown) => {
  const amount = Number(value)

  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-MY", {
        currency: "MYR",
        maximumFractionDigits: 0,
        notation: "compact",
        style: "currency",
      }).format(amount)
    : ""
}

const monthlyExpenseCategories = [
  {
    color: "var(--utility-electricity)",
    key: UTILITY_TYPE.ELECTRICITY,
    label: "Electricity",
  },
  {
    color: "var(--utility-water)",
    key: UTILITY_TYPE.WATER,
    label: "Water",
  },
  {
    color: "var(--utility-internet)",
    key: UTILITY_TYPE.INTERNET,
    label: "Internet",
  },
  {
    color: "var(--utility-other)",
    key: UTILITY_TYPE.OTHER,
    label: "Other",
  },
] as const

const isMonthlyExpenseChartDatum = (
  value: unknown,
): value is MonthlyExpenseChartDatum => {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.monthLabel === "string" &&
    typeof record.total === "number" &&
    monthlyExpenseCategories.every(
      (category) => typeof record[category.key] === "number",
    )
  )
}

function MonthlyExpenseTooltip({
  active,
  payload,
}: Partial<TooltipContentProps<number, string>>) {
  const rowCandidate: unknown = payload?.[0]?.payload
  const row = isMonthlyExpenseChartDatum(rowCandidate) ? rowCandidate : null

  if (!active || !row) {
    return null
  }

  return (
    <div className="min-w-52 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <div className="flex items-start justify-between gap-4 border-b pb-2">
        <div>
          <p className="font-medium">{row.monthLabel}</p>
        </div>
        <span className="font-mono text-sm font-bold text-foreground tabular-nums">
          {formatTooltipAmount(row.total)}
        </span>
      </div>
      <div className="mt-2 grid gap-1.5">
        {monthlyExpenseCategories.map((category) => {
          const amount = row[category.key]

          return (
            <div
              className="grid grid-cols-[1fr_auto] items-center gap-4"
              key={category.key}
            >
              <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-[2px]"
                  style={{ backgroundColor: category.color }}
                />
                <span className="truncate">{category.label}</span>
              </span>
              <span className="font-mono font-medium text-foreground tabular-nums">
                {formatTooltipAmount(amount)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function DashboardMonthlyUtilityStackChart({
  data,
}: {
  data: MonthlyExpenseChartDatum[]
}) {
  return (
    <ChartContainer
      className="aspect-auto h-48 min-h-0 w-full xl:h-full"
      config={utilityExpenseChartConfig}
      initialDimension={{ height: 192, width: 720 }}
    >
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ bottom: 4, left: 0, right: 12, top: 4 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis
          axisLine={false}
          tickFormatter={formatAxisAmount}
          tickLine={false}
          tickMargin={8}
          type="number"
        />
        <YAxis
          axisLine={false}
          dataKey="monthLabel"
          tickLine={false}
          tickMargin={8}
          type="category"
          width={54}
        />
        <ChartTooltip
          {...dashboardTooltipProps}
          content={<MonthlyExpenseTooltip />}
          cursor={false}
        />
        <Bar
          barSize={28}
          dataKey={UTILITY_TYPE.ELECTRICITY}
          fill="var(--color-electricity)"
          radius={[4, 0, 0, 4]}
          stackId="monthly-expense"
        />
        <Bar
          barSize={28}
          dataKey={UTILITY_TYPE.WATER}
          fill="var(--color-water)"
          stackId="monthly-expense"
        />
        <Bar
          barSize={28}
          dataKey={UTILITY_TYPE.INTERNET}
          fill="var(--color-internet)"
          stackId="monthly-expense"
        />
        <Bar
          barSize={28}
          dataKey={UTILITY_TYPE.OTHER}
          fill="var(--color-other)"
          radius={[0, 4, 4, 0]}
          stackId="monthly-expense"
        />
      </BarChart>
    </ChartContainer>
  )
}

export function DashboardMonthlyExpenseTrendChart({
  data,
}: {
  data: MonthlyExpenseChartDatum[]
}) {
  return (
    <ChartContainer
      className="aspect-auto h-40 w-full xl:h-full"
      config={expenseTrendChartConfig}
      initialDimension={{ height: 160, width: 920 }}
    >
      <LineChart
        accessibilityLayer
        data={data}
        margin={{ bottom: 0, left: 0, right: 8, top: 8 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="monthLabel"
          minTickGap={12}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis hide />
        <ChartTooltip
          {...dashboardTooltipProps}
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <span className="font-mono font-medium text-foreground tabular-nums">
                  {formatTooltipAmount(value)}
                </span>
              )}
              hideLabel
            />
          }
          cursor={false}
        />
        <Line
          activeDot={{ r: 4 }}
          dataKey="total"
          dot={{ r: 2 }}
          stroke="var(--color-total)"
          strokeWidth={2}
          type="monotone"
        />
      </LineChart>
    </ChartContainer>
  )
}
