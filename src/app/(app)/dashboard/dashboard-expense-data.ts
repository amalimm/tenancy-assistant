import { UTILITY_TYPE, type UtilityType } from "@db/schema"
import { formatLocalDate } from "@shared/lib/format"

export interface MonthlyExpenseBillingCycle {
  startDate: string
  totalAmountCents: number
  utilityType: UtilityType
}

export interface MonthlyExpenseChartDatum {
  electricity: number
  internet: number
  monthKey: string
  monthLabel: string
  other: number
  total: number
  water: number
}

const MONTH_KEY_LENGTH = 7

const createEmptyMonthDatum = (monthKey: string): MonthlyExpenseChartDatum => ({
  electricity: 0,
  internet: 0,
  monthKey,
  monthLabel: formatMonthLabel(monthKey),
  other: 0,
  total: 0,
  water: 0,
})

const formatMonthLabel = (monthKey: string) => {
  const localDateLabel = formatLocalDate(`${monthKey}-01`)
  const match = localDateLabel.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/)

  if (!match?.[2] || !match[3]) {
    return monthKey
  }

  return `${match[2]} ${match[3].slice(-2)}`
}

export const getMonthlyExpenseChartData = (
  cycles: MonthlyExpenseBillingCycle[],
  monthLimit = 6,
): MonthlyExpenseChartDatum[] => {
  const monthByKey = new Map<string, MonthlyExpenseChartDatum>()

  for (const cycle of cycles) {
    const monthKey = cycle.startDate.slice(0, MONTH_KEY_LENGTH)
    const datum = monthByKey.get(monthKey) ?? createEmptyMonthDatum(monthKey)
    const amount = cycle.totalAmountCents / 100

    if (cycle.utilityType === UTILITY_TYPE.ELECTRICITY) {
      datum.electricity += amount
    } else if (cycle.utilityType === UTILITY_TYPE.WATER) {
      datum.water += amount
    } else if (cycle.utilityType === UTILITY_TYPE.INTERNET) {
      datum.internet += amount
    } else {
      datum.other += amount
    }

    datum.total += amount
    monthByKey.set(monthKey, datum)
  }

  return [...monthByKey.values()]
    .sort((first, second) => first.monthKey.localeCompare(second.monthKey))
    .slice(-monthLimit)
}
