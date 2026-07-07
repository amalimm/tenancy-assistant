import { and, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm"

import { db } from "@db/client"
import {
  absenceRange,
  auditLog,
  allocationLine,
  allocationRun,
  AUDIT_ACTION_VALUES,
  AUDIT_ENTITY_VALUES,
  type AuditAction,
  type AuditEntity,
  billUpload,
  billingCycle,
  household,
  payment,
  tenant,
  tenancyPeriod,
  user,
  USER_ROLE,
  type UtilityType,
  type UserRole,
} from "@db/schema"
import { getTenantCalendarColor } from "@features/calendar/calendar-colors"

export interface DashboardUser {
  email: string
  id: string
  name: string
  role: UserRole
}

export interface DashboardHousehold {
  address: string | null
  id: string
  name: string
}

export interface DashboardTenant {
  calendarColor: string
  displayName: string
  email: string
  id: string
  isLinked: boolean
  notes: string | null
  tenancyEndDate: string | null
  tenancyStartDate: string
}

interface TenantPeriodView {
  endDate: string | null
  startDate: string
}

export interface DashboardAbsence {
  calendarColor: string
  displayName: string
  endDate: string
  id: string
  reason: string | null
  startDate: string
  tenantId: string
}

export interface DashboardBillingCycle {
  endDate: string
  id: string
  name: string
  notes: string | null
  startDate: string
  totalAmountCents: number
  utilityType: UtilityType
  utilityProvider: string
  uploads: DashboardBillUpload[]
}

export interface DashboardBillUpload {
  fileName: string
  fileUrl: string
  id: string
  sizeBytes: number | null
}

export interface DashboardAllocationLine {
  allocationRunId: string
  amountCents: number
  displayName: string
  id: string
  paymentAmountPaidCents: number
  paymentId: string | null
  paymentNotes: string | null
  paymentStatus: string
  presentDays: number
  tenantId: string
}

export interface DashboardAllocationRun {
  billingCycleId: string
  createdAt: Date
  id: string
  lines: DashboardAllocationLine[]
  status: string
  totalAmountCents: number
  totalPresentDays: number
}

export interface DashboardData {
  absences: DashboardAbsence[]
  allocationRuns: DashboardAllocationRun[]
  billingCycles: DashboardBillingCycle[]
  currentTenantId: string | null
  household: DashboardHousehold | null
  tenants: DashboardTenant[]
  user: DashboardUser
}

export interface DashboardAuditLog {
  action: AuditAction
  actorEmail: string
  createdAt: Date
  entityId: string | null
  entityType: AuditEntity
  id: string
  metadata: Record<string, unknown> | null
  targetLabel: string | null
}

export interface AuditLogFilters {
  action?: AuditAction
  actorEmail?: string
  dateFrom?: string
  dateTo?: string
  entityType?: AuditEntity
}

export interface SessionUserInput {
  email: string
  id: string
  name: string
}

const createEmptyDashboardCollections = () => ({
  absences: [],
  allocationRuns: [],
  billingCycles: [],
  currentTenantId: null,
  household: null,
  tenants: [],
})

const toLowerEmail = (email: string) => email.trim().toLowerCase()

export const toAuditActionFilter = (value: string) =>
  AUDIT_ACTION_VALUES.includes(value as AuditAction)
    ? (value as AuditAction)
    : undefined

export const toAuditEntityFilter = (value: string) =>
  AUDIT_ENTITY_VALUES.includes(value as AuditEntity)
    ? (value as AuditEntity)
    : undefined

const parseAuditMetadata = (metadata: string | null) => {
  if (!metadata) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(metadata)

    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

const toStartOfDay = (dateValue: string) => new Date(`${dateValue}T00:00:00`)

const toEndOfDay = (dateValue: string) => new Date(`${dateValue}T23:59:59`)

const linkTenantRecordForUser = async (input: SessionUserInput) => {
  const normalizedEmail = toLowerEmail(input.email)
  const [existingTenant] = await db
    .select()
    .from(tenant)
    .where(eq(tenant.email, normalizedEmail))
    .limit(1)

  if (!existingTenant) {
    return null
  }

  if (!existingTenant.userId) {
    await db
      .update(tenant)
      .set({ userId: input.id, updatedAt: new Date() })
      .where(
        and(eq(tenant.id, existingTenant.id), isNull(tenant.userId)),
      )
  }

  await db
    .update(user)
    .set({
      activeHouseholdId: existingTenant.householdId,
      updatedAt: new Date(),
    })
    .where(eq(user.id, input.id))

  return {
    householdId: existingTenant.householdId,
    tenantId: existingTenant.id,
  }
}

const getCurrentUser = async (sessionUser: SessionUserInput) => {
  const [currentUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1)

  if (!currentUser) {
    return null
  }

  return currentUser
}

const getTenantPeriodsByTenantId = async (tenantIds: string[]) => {
  if (tenantIds.length === 0) {
    return new Map<string, TenantPeriodView>()
  }

  const periods = await db
    .select()
    .from(tenancyPeriod)
    .where(inArray(tenancyPeriod.tenantId, tenantIds))
  const periodByTenantId = new Map<string, TenantPeriodView>()

  for (const period of periods) {
    periodByTenantId.set(period.tenantId, {
      endDate: period.endDate,
      startDate: period.startDate,
    })
  }

  return periodByTenantId
}

const loadAbsences = async (tenantRows: (typeof tenant.$inferSelect)[]) => {
  const tenantIds = tenantRows.map((tenantRow) => tenantRow.id)

  if (tenantIds.length === 0) {
    return []
  }

  const absenceRows = await db
    .select()
    .from(absenceRange)
    .where(inArray(absenceRange.tenantId, tenantIds))
  const tenantNameById = new Map(
    tenantRows.map((tenantRow) => [tenantRow.id, tenantRow.displayName]),
  )
  const tenantColorById = new Map(
    tenantRows.map((tenantRow) => [
      tenantRow.id,
      getTenantCalendarColor(tenantRow.id, tenantRow.calendarColor),
    ]),
  )

  return absenceRows.map<DashboardAbsence>((absence) => ({
    calendarColor:
      tenantColorById.get(absence.tenantId) ??
      getTenantCalendarColor(absence.tenantId, null),
    displayName: tenantNameById.get(absence.tenantId) ?? "Tenant",
    endDate: absence.endDate,
    id: absence.id,
    reason: absence.reason,
    startDate: absence.startDate,
    tenantId: absence.tenantId,
  }))
}

const loadAllocationRuns = async (
  cycleRows: (typeof billingCycle.$inferSelect)[],
  tenantRows: (typeof tenant.$inferSelect)[],
) => {
  const cycleIds = cycleRows.map((cycle) => cycle.id)

  if (cycleIds.length === 0) {
    return []
  }

  const runRows = await db
    .select()
    .from(allocationRun)
    .where(inArray(allocationRun.billingCycleId, cycleIds))
    .orderBy(desc(allocationRun.createdAt))
  const runIds = runRows.map((run) => run.id)

  if (runIds.length === 0) {
    return []
  }

  const lineRows = await db
    .select()
    .from(allocationLine)
    .where(inArray(allocationLine.allocationRunId, runIds))
  const lineIds = lineRows.map((line) => line.id)
  const paymentRows =
    lineIds.length > 0
      ? await db.select().from(payment).where(inArray(payment.allocationLineId, lineIds))
      : []
  const paymentByLineId = new Map(
    paymentRows.map((paymentRow) => [paymentRow.allocationLineId, paymentRow]),
  )
  const tenantNameById = new Map(
    tenantRows.map((tenantRow) => [tenantRow.id, tenantRow.displayName]),
  )
  const linesByRunId = new Map<string, DashboardAllocationLine[]>()

  for (const line of lineRows) {
    const paymentRow = paymentByLineId.get(line.id)
    const lineView: DashboardAllocationLine = {
      allocationRunId: line.allocationRunId,
      amountCents: line.amountCents,
      displayName: tenantNameById.get(line.tenantId) ?? "Tenant",
      id: line.id,
      paymentAmountPaidCents: paymentRow?.amountPaidCents ?? 0,
      paymentId: paymentRow?.id ?? null,
      paymentNotes: paymentRow?.notes ?? null,
      paymentStatus: paymentRow?.status ?? "unpaid",
      presentDays: line.presentDays,
      tenantId: line.tenantId,
    }
    const existingLines = linesByRunId.get(line.allocationRunId) ?? []

    existingLines.push(lineView)
    linesByRunId.set(line.allocationRunId, existingLines)
  }

  return runRows.map<DashboardAllocationRun>((run) => ({
    billingCycleId: run.billingCycleId,
    createdAt: run.createdAt,
    id: run.id,
    lines: linesByRunId.get(run.id) ?? [],
    status: run.status,
    totalAmountCents: run.totalAmountCents,
    totalPresentDays: run.totalPresentDays,
  }))
}

const loadUploadsByCycleId = async (cycleIds: string[]) => {
  if (cycleIds.length === 0) {
    return new Map<string, DashboardBillUpload[]>()
  }

  const uploadRows = await db
    .select()
    .from(billUpload)
    .where(inArray(billUpload.billingCycleId, cycleIds))
  const uploadsByCycleId = new Map<string, DashboardBillUpload[]>()

  for (const upload of uploadRows) {
    const existingUploads = uploadsByCycleId.get(upload.billingCycleId) ?? []

    existingUploads.push({
      fileName: upload.fileName,
      fileUrl: upload.fileUrl,
      id: upload.id,
      sizeBytes: upload.sizeBytes,
    })
    uploadsByCycleId.set(upload.billingCycleId, existingUploads)
  }

  return uploadsByCycleId
}

export const getDashboardData = async (
  sessionUser: SessionUserInput,
): Promise<DashboardData> => {
  const currentUser = await getCurrentUser(sessionUser)

  if (!currentUser) {
    return {
      ...createEmptyDashboardCollections(),
      user: {
        email: sessionUser.email,
        id: sessionUser.id,
        name: sessionUser.name,
        role: USER_ROLE.TENANT,
      },
    }
  }

  let householdId = currentUser.activeHouseholdId
  let currentTenantId: string | null = null

  if (currentUser.role === USER_ROLE.TENANT) {
    const link = await linkTenantRecordForUser(sessionUser)

    householdId = link?.householdId ?? householdId
    currentTenantId = link?.tenantId ?? null
  }

  if (!householdId) {
    return {
      ...createEmptyDashboardCollections(),
      user: {
        email: currentUser.email,
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      },
    }
  }

  const [householdRow] = await db
    .select()
    .from(household)
    .where(eq(household.id, householdId))
    .limit(1)

  if (!householdRow) {
    return {
      ...createEmptyDashboardCollections(),
      user: {
        email: currentUser.email,
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      },
    }
  }

  const tenantRows = await db
    .select()
    .from(tenant)
    .where(eq(tenant.householdId, householdId))
    .orderBy(tenant.displayName)
  const tenantIds = tenantRows.map((tenantRow) => tenantRow.id)
  const periodEndByTenantId = await getTenantPeriodsByTenantId(tenantIds)
  const tenants = tenantRows.map<DashboardTenant>((tenantRow) => ({
    calendarColor: getTenantCalendarColor(tenantRow.id, tenantRow.calendarColor),
    displayName: tenantRow.displayName,
    email: tenantRow.email,
    id: tenantRow.id,
    isLinked: Boolean(tenantRow.userId),
    notes: tenantRow.notes,
    tenancyEndDate: periodEndByTenantId.get(tenantRow.id)?.endDate ?? null,
    tenancyStartDate:
      periodEndByTenantId.get(tenantRow.id)?.startDate ?? "Not set",
  }))
  const cycleRows = await db
    .select()
    .from(billingCycle)
    .where(eq(billingCycle.householdId, householdId))
    .orderBy(desc(billingCycle.startDate))
  const uploadsByCycleId = await loadUploadsByCycleId(
    cycleRows.map((cycle) => cycle.id),
  )

  return {
    absences: await loadAbsences(tenantRows),
    allocationRuns: await loadAllocationRuns(cycleRows, tenantRows),
    billingCycles: cycleRows.map<DashboardBillingCycle>((cycle) => ({
      endDate: cycle.endDate,
      id: cycle.id,
      name: cycle.name,
      notes: cycle.notes,
      startDate: cycle.startDate,
      totalAmountCents: cycle.totalAmountCents,
      uploads: uploadsByCycleId.get(cycle.id) ?? [],
      utilityType: cycle.utilityType,
      utilityProvider: cycle.utilityProvider,
    })),
    currentTenantId,
    household: {
      address: householdRow.address,
      id: householdRow.id,
      name: householdRow.name,
    },
    tenants,
    user: {
      email: currentUser.email,
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    },
  }
}

export const getAuditLogData = async (
  householdId: string,
  filters: AuditLogFilters,
): Promise<DashboardAuditLog[]> => {
  const conditions = [eq(auditLog.householdId, householdId)]

  if (filters.action) {
    conditions.push(eq(auditLog.action, filters.action))
  }

  if (filters.entityType) {
    conditions.push(eq(auditLog.entityType, filters.entityType))
  }

  if (filters.actorEmail) {
    conditions.push(eq(auditLog.actorEmail, toLowerEmail(filters.actorEmail)))
  }

  if (filters.dateFrom) {
    conditions.push(gte(auditLog.createdAt, toStartOfDay(filters.dateFrom)))
  }

  if (filters.dateTo) {
    conditions.push(lte(auditLog.createdAt, toEndOfDay(filters.dateTo)))
  }

  const rows = await db
    .select()
    .from(auditLog)
    .where(and(...conditions))
    .orderBy(desc(auditLog.createdAt))
    .limit(100)

  return rows.map<DashboardAuditLog>((row) => ({
    action: row.action,
    actorEmail: row.actorEmail,
    createdAt: row.createdAt,
    entityId: row.entityId,
    entityType: row.entityType,
    id: row.id,
    metadata: parseAuditMetadata(row.metadata),
    targetLabel: row.targetLabel,
  }))
}
