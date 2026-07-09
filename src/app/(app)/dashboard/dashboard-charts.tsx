"use client"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency } from "@shared/lib/format"

export interface DashboardCollectionChartDatum {
  due: number
  label: string
  paid: number
}

const collectionChartConfig = {
  paid: {
    color: "var(--chart-2)",
    label: "Paid",
  },
  due: {
    color: "var(--chart-1)",
    label: "Due",
  },
} satisfies ChartConfig

const formatTooltipAmount = (value: unknown) => {
  const amount = Number(value)

  return Number.isFinite(amount) ? formatCurrency(amount * 100) : String(value)
}

const formatCollectionLabel = (name: unknown) => {
  if (name === "paid") {
    return collectionChartConfig.paid.label
  }

  if (name === "due") {
    return collectionChartConfig.due.label
  }

  return String(name)
}

export function DashboardCollectionChart({
  data,
}: {
  data: DashboardCollectionChartDatum[]
}) {
  return (
    <ChartContainer
      className="aspect-auto h-24 w-full"
      config={collectionChartConfig}
      initialDimension={{ height: 96, width: 360 }}
    >
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ bottom: 28, left: 0, right: 0, top: 28 }}
      >
        <XAxis hide type="number" />
        <YAxis dataKey="label" hide type="category" />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex min-w-32 items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {formatCollectionLabel(name)}
                  </span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {formatTooltipAmount(value)}
                  </span>
                </div>
              )}
              hideLabel
            />
          }
        />
        <Bar
          dataKey="paid"
          fill="var(--color-paid)"
          radius={[6, 0, 0, 6]}
          stackId="collection"
        />
        <Bar
          dataKey="due"
          fill="var(--color-due)"
          radius={[0, 6, 6, 0]}
          stackId="collection"
        />
      </BarChart>
    </ChartContainer>
  )
}
