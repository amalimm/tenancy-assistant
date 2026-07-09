import { describe, expect, it } from "vitest"

import { UTILITY_TYPE } from "@db/schema"

import { getMonthlyExpenseChartData } from "./dashboard-expense-data"

const createBillingCycle = (overrides: {
  startDate: string
  totalAmountCents: number
  utilityType: (typeof UTILITY_TYPE)[keyof typeof UTILITY_TYPE]
}) => ({
  startDate: overrides.startDate,
  totalAmountCents: overrides.totalAmountCents,
  utilityType: overrides.utilityType,
})

describe("getMonthlyExpenseChartData", () => {
  it("groups household expenses by month and utility category", () => {
    const data = getMonthlyExpenseChartData([
      createBillingCycle({
        startDate: "2026-02-01",
        totalAmountCents: 12000,
        utilityType: UTILITY_TYPE.ELECTRICITY,
      }),
      createBillingCycle({
        startDate: "2026-01-15",
        totalAmountCents: 5000,
        utilityType: UTILITY_TYPE.WATER,
      }),
      createBillingCycle({
        startDate: "2026-02-20",
        totalAmountCents: 8000,
        utilityType: UTILITY_TYPE.WATER,
      }),
      createBillingCycle({
        startDate: "2026-02-25",
        totalAmountCents: 6000,
        utilityType: UTILITY_TYPE.ELECTRICITY,
      }),
    ])

    expect(data).toEqual([
      {
        electricity: 0,
        internet: 0,
        monthKey: "2026-01",
        monthLabel: "Jan 26",
        other: 0,
        total: 50,
        water: 50,
      },
      {
        electricity: 180,
        internet: 0,
        monthKey: "2026-02",
        monthLabel: "Feb 26",
        other: 0,
        total: 260,
        water: 80,
      },
    ])
  })

  it("keeps only the latest recorded months after aggregation", () => {
    const data = getMonthlyExpenseChartData(
      [
        createBillingCycle({
          startDate: "2026-01-01",
          totalAmountCents: 1000,
          utilityType: UTILITY_TYPE.ELECTRICITY,
        }),
        createBillingCycle({
          startDate: "2026-02-01",
          totalAmountCents: 2000,
          utilityType: UTILITY_TYPE.ELECTRICITY,
        }),
        createBillingCycle({
          startDate: "2026-03-01",
          totalAmountCents: 3000,
          utilityType: UTILITY_TYPE.ELECTRICITY,
        }),
      ],
      2,
    )

    expect(data.map((month) => month.monthKey)).toEqual([
      "2026-02",
      "2026-03",
    ])
  })
})
