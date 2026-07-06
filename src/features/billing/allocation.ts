export interface LocalDateRange {
  endDate: string
  startDate: string
}

export interface TenantAllocationInput {
  absenceRanges: LocalDateRange[]
  displayName: string
  tenantId: string
  tenancyEndDate: string | null
  tenancyStartDate: string
}

export interface AllocationInput {
  cycleEndDate: string
  cycleStartDate: string
  tenants: TenantAllocationInput[]
  totalAmountCents: number
}

export interface TenantAllocationResult {
  amountCents: number
  displayName: string
  presentDays: number
  tenantId: string
}

export interface AllocationResult {
  lines: TenantAllocationResult[]
  totalAmountCents: number
  totalPresentDays: number
}

interface DateRange {
  endDay: number
  startDay: number
}

interface RawAllocationLine {
  displayName: string
  floorAmountCents: number
  fraction: number
  presentDays: number
  tenantId: string
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

const toUtcDay = (date: string) => {
  const [year, month, day] = date.split("-").map(Number)

  if (!year || !month || !day) {
    throw new Error(`Invalid local date: ${date}`)
  }

  return Date.UTC(year, month - 1, day) / MS_PER_DAY
}

const toDateRange = (range: LocalDateRange): DateRange => {
  const startDay = toUtcDay(range.startDate)
  const endDay = toUtcDay(range.endDate)

  if (endDay <= startDay) {
    throw new Error("Date range end must be after start.")
  }

  return { endDay, startDay }
}

const intersectRanges = (
  first: DateRange,
  second: DateRange,
): DateRange | null => {
  const startDay = Math.max(first.startDay, second.startDay)
  const endDay = Math.min(first.endDay, second.endDay)

  if (endDay <= startDay) {
    return null
  }

  return { endDay, startDay }
}

const countRangeDays = (range: DateRange) => range.endDay - range.startDay

const mergeRanges = (ranges: DateRange[]) => {
  const sortedRanges = [...ranges].sort((first, second) => {
    if (first.startDay === second.startDay) {
      return first.endDay - second.endDay
    }

    return first.startDay - second.startDay
  })

  const mergedRanges: DateRange[] = []

  for (const range of sortedRanges) {
    const lastRange = mergedRanges.at(-1)

    if (!lastRange || range.startDay > lastRange.endDay) {
      mergedRanges.push({ ...range })
      continue
    }

    lastRange.endDay = Math.max(lastRange.endDay, range.endDay)
  }

  return mergedRanges
}

const calculatePresentDays = (
  cycleRange: DateRange,
  tenant: TenantAllocationInput,
) => {
  const tenancyRange = toDateRange({
    startDate: tenant.tenancyStartDate,
    endDate: tenant.tenancyEndDate ?? "9999-12-31",
  })
  const activeRange = intersectRanges(cycleRange, tenancyRange)

  if (!activeRange) {
    return 0
  }

  const absenceRanges = tenant.absenceRanges
    .map(toDateRange)
    .map((range) => intersectRanges(activeRange, range))
    .filter((range): range is DateRange => Boolean(range))
  const absentDays = mergeRanges(absenceRanges).reduce(
    (sum, range) => sum + countRangeDays(range),
    0,
  )

  return Math.max(countRangeDays(activeRange) - absentDays, 0)
}

const toRawLine = (
  tenant: TenantAllocationInput,
  presentDays: number,
  totalPresentDays: number,
  totalAmountCents: number,
): RawAllocationLine => {
  const rawAmount = (totalAmountCents * presentDays) / totalPresentDays
  const floorAmountCents = Math.floor(rawAmount)

  return {
    displayName: tenant.displayName,
    floorAmountCents,
    fraction: rawAmount - floorAmountCents,
    presentDays,
    tenantId: tenant.tenantId,
  }
}

const distributeRoundingResidual = (
  rawLines: RawAllocationLine[],
  totalAmountCents: number,
) => {
  const floorTotal = rawLines.reduce(
    (sum, line) => sum + line.floorAmountCents,
    0,
  )
  let residualCents = totalAmountCents - floorTotal
  const residualOrder = [...rawLines].sort((first, second) => {
    if (second.fraction === first.fraction) {
      return first.tenantId.localeCompare(second.tenantId)
    }

    return second.fraction - first.fraction
  })
  const bonusByTenantId = new Map<string, number>()

  for (const line of residualOrder) {
    if (residualCents <= 0) {
      break
    }

    bonusByTenantId.set(line.tenantId, 1)
    residualCents -= 1
  }

  return rawLines.map<TenantAllocationResult>((line) => ({
    amountCents: line.floorAmountCents + (bonusByTenantId.get(line.tenantId) ?? 0),
    displayName: line.displayName,
    presentDays: line.presentDays,
    tenantId: line.tenantId,
  }))
}

export const calculateAllocation = (input: AllocationInput): AllocationResult => {
  if (input.totalAmountCents < 0) {
    throw new Error("Total amount cannot be negative.")
  }

  const cycleRange = toDateRange({
    startDate: input.cycleStartDate,
    endDate: input.cycleEndDate,
  })
  const tenantsWithPresentDays = input.tenants.map((tenant) => ({
    tenant,
    presentDays: calculatePresentDays(cycleRange, tenant),
  }))
  const totalPresentDays = tenantsWithPresentDays.reduce(
    (sum, item) => sum + item.presentDays,
    0,
  )

  if (totalPresentDays <= 0) {
    throw new Error("At least one tenant must be present during the cycle.")
  }

  const rawLines = tenantsWithPresentDays.map((item) =>
    toRawLine(
      item.tenant,
      item.presentDays,
      totalPresentDays,
      input.totalAmountCents,
    ),
  )

  return {
    lines: distributeRoundingResidual(rawLines, input.totalAmountCents),
    totalAmountCents: input.totalAmountCents,
    totalPresentDays,
  }
}
