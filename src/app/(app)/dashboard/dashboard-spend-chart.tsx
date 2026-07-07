"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency } from "@shared/lib/format"

export interface DashboardSpendChartDatum {
  amount: number
  label: string
  utility: string
}

const chartConfig = {
  amount: {
    color: "var(--chart-2)",
    label: "Amount",
  },
} satisfies ChartConfig

const formatTooltipAmount = (value: unknown) => {
  const amount = Number(value)

  return Number.isFinite(amount) ? formatCurrency(amount * 100) : String(value)
}

export function DashboardSpendChart({
  data,
}: {
  data: DashboardSpendChartDatum[]
}) {
  return (
    <ChartContainer
      className="h-[220px] w-full"
      config={chartConfig}
      initialDimension={{ height: 220, width: 560 }}
    >
      <BarChart accessibilityLayer data={data} margin={{ left: 0, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="label"
          minTickGap={12}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          axisLine={false}
          tickFormatter={(value) => formatCurrency(Number(value) * 100)}
          tickLine={false}
          tickMargin={8}
          width={70}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <div className="flex min-w-32 items-center justify-between gap-4">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {formatTooltipAmount(value)}
                  </span>
                </div>
              )}
              hideLabel
            />
          }
        />
        <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
