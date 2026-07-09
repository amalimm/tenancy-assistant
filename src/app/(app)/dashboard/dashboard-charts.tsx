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

export function DashboardMonthlyUtilityStackChart({
  data,
}: {
  data: MonthlyExpenseChartDatum[]
}) {
  const hasOneMonth = data.length === 1

  if (hasOneMonth) {
    return <MonthlyUtilitySingleMonthChart data={data[0]} />
  }

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

function MonthlyUtilitySingleMonthChart({
  data,
}: {
  data: MonthlyExpenseChartDatum | undefined
}) {
  if (!data) {
    return null
  }

  const items = [
    {
      amount: data.electricity,
      color: "var(--utility-electricity)",
      label: "Electricity",
    },
    {
      amount: data.water,
      color: "var(--utility-water)",
      label: "Water",
    },
    {
      amount: data.internet,
      color: "var(--utility-internet)",
      label: "Internet",
    },
    {
      amount: data.other,
      color: "var(--utility-other)",
      label: "Other",
    },
  ].filter((item) => item.amount > 0)

  return (
    <div className="grid h-full min-h-0 content-start gap-4 py-2">
      <div>
        <p className="text-xs text-muted-foreground">{data.monthLabel}</p>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
          {formatCurrency(data.total * 100)}
        </p>
      </div>

      <div className="flex h-5 overflow-hidden rounded-sm bg-muted">
        {items.map((item) => (
          <div
            aria-label={`${item.label}: ${formatTooltipAmount(item.amount)}`}
            className="min-w-1"
            key={item.label}
            style={{
              backgroundColor: item.color,
              width: `${(item.amount / data.total) * 100}%`,
            }}
            title={`${item.label}: ${formatTooltipAmount(item.amount)}`}
          />
        ))}
      </div>

      <div className="grid gap-2">
        {items.map((item) => (
          <div
            className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm"
            key={item.label}
          >
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="font-mono font-medium tabular-nums">
              {formatCurrency(item.amount * 100)}
            </span>
          </div>
        ))}
      </div>
    </div>
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
