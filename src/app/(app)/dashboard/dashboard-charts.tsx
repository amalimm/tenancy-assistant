"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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

const utilityExpenseChartConfig = {
  [UTILITY_TYPE.ELECTRICITY]: {
    color: "var(--chart-5)",
    label: "Electricity",
  },
  [UTILITY_TYPE.WATER]: {
    color: "var(--chart-3)",
    label: "Water",
  },
  [UTILITY_TYPE.INTERNET]: {
    color: "var(--chart-2)",
    label: "Internet",
  },
  [UTILITY_TYPE.OTHER]: {
    color: "var(--chart-1)",
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

export function DashboardMonthlyUtilityStackChart({
  data,
}: {
  data: MonthlyExpenseChartDatum[]
}) {
  return (
    <ChartContainer
      className="aspect-auto h-52 w-full"
      config={utilityExpenseChartConfig}
      initialDimension={{ height: 208, width: 560 }}
    >
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ bottom: 4, left: 0, right: 12, top: 4 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis hide type="number" />
        <YAxis
          axisLine={false}
          dataKey="monthLabel"
          tickLine={false}
          tickMargin={8}
          type="category"
          width={54}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex min-w-36 items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {
                      utilityExpenseChartConfig[
                        name as keyof typeof utilityExpenseChartConfig
                      ]?.label
                    }
                  </span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {formatTooltipAmount(value)}
                  </span>
                </div>
              )}
              labelFormatter={(_, payload) => {
                const row = payload[0]?.payload as
                  | MonthlyExpenseChartDatum
                  | undefined

                return row ? `${row.monthLabel} · ${formatTooltipAmount(row.total)}` : ""
              }}
            />
          }
          cursor={false}
        />
        <Bar
          dataKey={UTILITY_TYPE.ELECTRICITY}
          fill="var(--color-electricity)"
          radius={[4, 0, 0, 4]}
          stackId="monthly-expense"
        />
        <Bar
          dataKey={UTILITY_TYPE.WATER}
          fill="var(--color-water)"
          stackId="monthly-expense"
        />
        <Bar
          dataKey={UTILITY_TYPE.INTERNET}
          fill="var(--color-internet)"
          stackId="monthly-expense"
        />
        <Bar
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
      className="aspect-auto h-40 w-full"
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
