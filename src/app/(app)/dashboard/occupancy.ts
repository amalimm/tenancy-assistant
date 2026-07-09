import { addLocalDays } from "@shared/lib/format"

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const OCCUPANCY_CELL_STATE = {
  INACTIVE: "inactive",
  OUT: "out",
  PRESENT: "present",
} as const

export type OccupancyCellState =
  (typeof OCCUPANCY_CELL_STATE)[keyof typeof OCCUPANCY_CELL_STATE]

export interface OccupancyTenantInput {
  calendarColor: string
  displayName: string
  id: string
  tenancyEndDate: string | null
  tenancyStartDate: string
}

export interface OccupancyAbsenceInput {
  endDate: string
  id: string
  reason: string | null
  startDate: string
  tenantId: string
}

export interface OccupancyDay {
  date: string
}

export interface OccupancyCell {
  absence: OccupancyAbsenceInput | null
  date: string
  state: OccupancyCellState
}

export interface OccupancyTenantRow {
  calendarColor: string
  cells: OccupancyCell[]
  displayName: string
  id: string
}

export interface OccupancyTotal {
  date: string
  out: number
  present: number
}

export interface OccupancyTodaySummary {
  out: number
  present: number
  totalActive: number
}

export interface OccupancyNextChange {
  date: string
  description: string
  tenantName: string
}

export interface OccupancyModel {
  days: OccupancyDay[]
  nextChange: OccupancyNextChange | null
  tenantRows: OccupancyTenantRow[]
  today: OccupancyTodaySummary
  totals: OccupancyTotal[]
}

export interface BuildOccupancyModelInput {
  absences: OccupancyAbsenceInput[]
  dayCount?: number
  startDate: string
  tenants: OccupancyTenantInput[]
}

const DEFAULT_OCCUPANCY_DAY_COUNT = 14

const isLocalDateOnOrBefore = (dateValue: string, comparisonDate: string) =>
  LOCAL_DATE_PATTERN.test(dateValue) && dateValue <= comparisonDate

const isLocalDateAfter = (dateValue: string | null, comparisonDate: string) =>
  dateValue === null ||
  (LOCAL_DATE_PATTERN.test(dateValue) && dateValue > comparisonDate)

const isTenantActiveOnDate = (
  tenant: OccupancyTenantInput,
  dateValue: string,
) =>
  isLocalDateOnOrBefore(tenant.tenancyStartDate, dateValue) &&
  isLocalDateAfter(tenant.tenancyEndDate, dateValue)

const isAbsenceActiveOnDate = (
  absence: OccupancyAbsenceInput,
  dateValue: string,
) =>
  isLocalDateOnOrBefore(absence.startDate, dateValue) &&
  isLocalDateAfter(absence.endDate, dateValue)

const getTenantAbsencesByTenantId = (absences: OccupancyAbsenceInput[]) => {
  const absencesByTenantId = new Map<string, OccupancyAbsenceInput[]>()
  const sortedAbsences = [...absences].sort((first, second) =>
    first.startDate.localeCompare(second.startDate),
  )

  for (const absence of sortedAbsences) {
    const tenantAbsences = absencesByTenantId.get(absence.tenantId) ?? []

    tenantAbsences.push(absence)
    absencesByTenantId.set(absence.tenantId, tenantAbsences)
  }

  return absencesByTenantId
}

const getCellForDate = ({
  absences,
  date,
  tenant,
}: {
  absences: OccupancyAbsenceInput[]
  date: string
  tenant: OccupancyTenantInput
}): OccupancyCell => {
  if (!isTenantActiveOnDate(tenant, date)) {
    return {
      absence: null,
      date,
      state: OCCUPANCY_CELL_STATE.INACTIVE,
    }
  }

  const activeAbsence =
    absences.find((absence) => isAbsenceActiveOnDate(absence, date)) ?? null

  if (activeAbsence) {
    return {
      absence: activeAbsence,
      date,
      state: OCCUPANCY_CELL_STATE.OUT,
    }
  }

  return {
    absence: null,
    date,
    state: OCCUPANCY_CELL_STATE.PRESENT,
  }
}

const getNextChange = (
  rows: OccupancyTenantRow[],
): OccupancyNextChange | null => {
  const changes: OccupancyNextChange[] = []

  for (const row of rows) {
    const firstCell = row.cells[0]

    if (!firstCell) {
      continue
    }

    for (const cell of row.cells.slice(1)) {
      if (cell.state !== firstCell.state) {
        changes.push({
          date: cell.date,
          description:
            cell.state === OCCUPANCY_CELL_STATE.OUT
              ? "goes out"
              : cell.state === OCCUPANCY_CELL_STATE.PRESENT
                ? "returns"
                : "tenancy inactive",
          tenantName: row.displayName,
        })
        break
      }
    }
  }

  return (
    changes.sort((first, second) => first.date.localeCompare(second.date))[0] ??
    null
  )
}

export const buildOccupancyModel = ({
  absences,
  dayCount = DEFAULT_OCCUPANCY_DAY_COUNT,
  startDate,
  tenants,
}: BuildOccupancyModelInput): OccupancyModel => {
  const days = Array.from({ length: dayCount }, (_, index) => ({
    date: addLocalDays(startDate, index),
  }))
  const absencesByTenantId = getTenantAbsencesByTenantId(absences)
  const tenantRows = tenants.map<OccupancyTenantRow>((tenant) => ({
    calendarColor: tenant.calendarColor,
    cells: days.map((day) =>
      getCellForDate({
        absences: absencesByTenantId.get(tenant.id) ?? [],
        date: day.date,
        tenant,
      }),
    ),
    displayName: tenant.displayName,
    id: tenant.id,
  }))
  const totals = days.map<OccupancyTotal>((day) => {
    let out = 0
    let present = 0

    for (const row of tenantRows) {
      const cell = row.cells.find((rowCell) => rowCell.date === day.date)

      if (cell?.state === OCCUPANCY_CELL_STATE.PRESENT) {
        present += 1
      }

      if (cell?.state === OCCUPANCY_CELL_STATE.OUT) {
        out += 1
      }
    }

    return {
      date: day.date,
      out,
      present,
    }
  })
  const todayTotals = totals[0] ?? { date: startDate, out: 0, present: 0 }

  return {
    days,
    nextChange: getNextChange(tenantRows),
    tenantRows,
    today: {
      out: todayTotals.out,
      present: todayTotals.present,
      totalActive: todayTotals.out + todayTotals.present,
    },
    totals,
  }
}
