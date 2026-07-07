"use server"

import { and, eq, inArray, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { put } from "@vercel/blob"
import { z } from "zod"

import { env, hasBlobConfig } from "@config/env"
import { db } from "@db/client"
import {
  absenceRange,
  AUDIT_ACTION,
  AUDIT_ENTITY,
  allocationLine,
  allocationRun,
  billUpload,
  billingCycle,
  household,
  payment,
  PAYMENT_STATUS,
  tenant,
  tenancyPeriod,
  UTILITY_TYPE,
  UTILITY_TYPE_VALUES,
  user,
  USER_ROLE,
  type UserRole,
} from "@db/schema"
import { recordAuditLog } from "@features/audit/audit-log"
import { calculateAllocation } from "@features/billing/allocation"
import {
  APP_ACTION,
  APP_SUBJECT,
  defineAbilityForRole,
  type AppAction,
  type AppSubject,
} from "@features/auth/permissions"
import { auth, requireRole, requireSession } from "@features/auth/auth-server"

const dateRangeSchema = z
  .object({
    endDate: z.string().min(10),
    startDate: z.string().min(10),
  })
  .refine((range) => range.endDate > range.startDate, {
    message: "End date must be after start date.",
    path: ["endDate"],
  })

const createHouseholdSchema = z.object({
  address: z.string().trim().optional(),
  name: z.string().trim().min(1),
})

const createTenantSchema = z.object({
  displayName: z.string().trim().min(1),
  email: z.string().trim().email(),
  householdId: z.string().min(1),
  notes: z.string().trim().optional(),
  temporaryPassword: z.string().min(10),
  tenancyEndDate: z.string().trim().optional(),
  tenancyStartDate: z.string().min(10),
})

const absenceSchema = dateRangeSchema.extend({
  reason: z.string().trim().optional(),
  tenantId: z.string().min(1),
})

const updateAbsenceSchema = dateRangeSchema.extend({
  absenceId: z.string().min(1),
})

const deleteAbsenceSchema = z.object({
  absenceId: z.string().min(1),
})

const deleteTenantSchema = z.object({
  tenantId: z.string().min(1),
})

const regenerateTenantPasswordSchema = z.object({
  temporaryPassword: z.string().min(10),
  tenantId: z.string().min(1),
})

const createBillingCycleSchema = dateRangeSchema.extend({
  householdId: z.string().min(1),
  name: z.string().trim().min(1),
  notes: z.string().trim().optional(),
  totalAmount: z.string().trim().min(1),
  utilityType: z.enum(UTILITY_TYPE_VALUES).default(UTILITY_TYPE.ELECTRICITY),
  utilityProvider: z.string().trim().min(1).default("SEB"),
})

const runAllocationSchema = z.object({
  billingCycleId: z.string().min(1),
})

const uploadBillSchema = z.object({
  billingCycleId: z.string().min(1),
})

const markPaymentSchema = z.object({
  amountPaid: z.string().trim().min(1),
  notes: z.string().trim().optional(),
  paymentId: z.string().min(1),
  status: z.enum([
    PAYMENT_STATUS.UNPAID,
    PAYMENT_STATUS.PARTIAL,
    PAYMENT_STATUS.PAID,
  ]),
})

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key)

  return typeof value === "string" ? value : ""
}

const parseAmountCents = (value: string) => {
  const amount = Number(value)

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Amount must be a non-negative number.")
  }

  return Math.round(amount * 100)
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const createId = () => crypto.randomUUID()

const revalidateDashboard = () => {
  revalidatePath("/dashboard")
}

const revalidateAdmin = () => {
  revalidateDashboard()
  revalidatePath("/dashboard/admin")
}

const revalidateCalendar = () => {
  revalidateDashboard()
  revalidatePath("/dashboard/calendar")
}

const revalidateUtilities = () => {
  revalidateDashboard()
  revalidatePath("/dashboard/utilities")
  revalidatePath("/dashboard/electricity")
}

const assertTenantEmail = (email: string) => {
  if (env.adminEmails.includes(email)) {
    throw new Error("Admin emails must use Google sign-in, not tenant login.")
  }
}

const getCurrentUserRole = async (userId: string): Promise<UserRole> => {
  const [currentUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  return currentUser?.role ?? USER_ROLE.TENANT
}

const requireAbility = (
  role: UserRole,
  action: AppAction,
  subject: AppSubject,
) => {
  const ability = defineAbilityForRole(role)

  if (!ability.can(action, subject)) {
    throw new Error("You do not have permission to perform this action.")
  }
}

const getLinkedTenantId = async (userId: string, email: string) => {
  const [linkedTenant] = await db
    .select()
    .from(tenant)
    .where(eq(tenant.userId, userId))
    .limit(1)

  if (linkedTenant) {
    return linkedTenant.id
  }

  const [emailTenant] = await db
    .select()
    .from(tenant)
    .where(and(eq(tenant.email, normalizeEmail(email)), isNull(tenant.userId)))
    .limit(1)

  if (!emailTenant) {
    return null
  }

  await db
    .update(tenant)
    .set({ userId, updatedAt: new Date() })
    .where(eq(tenant.id, emailTenant.id))

  return emailTenant.id
}

const assertWritableAbsenceTenant = async (tenantId: string) => {
  const session = await requireSession()
  const role = await getCurrentUserRole(session.user.id)

  requireAbility(role, APP_ACTION.CREATE, APP_SUBJECT.ABSENCE)

  if (role === USER_ROLE.ADMIN) {
    return session
  }

  const linkedTenantId = await getLinkedTenantId(
    session.user.id,
    session.user.email,
  )

  if (linkedTenantId !== tenantId) {
    throw new Error("Tenants can only manage their own calendar entries.")
  }

  return session
}

const setTenantPassword = async (userId: string, temporaryPassword: string) => {
  await auth.api.setUserPassword({
    body: {
      newPassword: temporaryPassword,
      userId,
    },
    headers: await headers(),
  })
}

const ensureTenantLogin = async ({
  displayName,
  email,
  householdId,
  temporaryPassword,
}: {
  displayName: string
  email: string
  householdId: string
  temporaryPassword: string
}) => {
  assertTenantEmail(email)

  const [existingUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1)

  if (existingUser) {
    await setTenantPassword(existingUser.id, temporaryPassword)
    await db
      .update(user)
      .set({
        activeHouseholdId: householdId,
        role: USER_ROLE.TENANT,
        updatedAt: new Date(),
      })
      .where(eq(user.id, existingUser.id))

    return existingUser.id
  }

  const createdUser = await auth.api.createUser({
    body: {
      data: {
        activeHouseholdId: householdId,
      },
      email,
      name: displayName,
      password: temporaryPassword,
    },
    headers: await headers(),
  })

  await db
    .update(user)
    .set({
      activeHouseholdId: householdId,
      role: USER_ROLE.TENANT,
      updatedAt: new Date(),
    })
    .where(eq(user.id, createdUser.user.id))

  return createdUser.user.id
}

export const createHouseholdAction = async (formData: FormData) => {
  const session = await requireRole([USER_ROLE.ADMIN])
  const parsed = createHouseholdSchema.parse({
    address: getString(formData, "address"),
    name: getString(formData, "name"),
  })
  const householdId = createId()

  await db.insert(household).values({
    address: parsed.address,
    createdByUserId: session.user.id,
    id: householdId,
    name: parsed.name,
  })
  await db
    .update(user)
    .set({ activeHouseholdId: householdId, updatedAt: new Date() })
    .where(eq(user.id, session.user.id))
  await recordAuditLog({
    action: AUDIT_ACTION.HOUSEHOLD_CREATED,
    actorEmail: session.user.email,
    actorUserId: session.user.id,
    entityId: householdId,
    entityType: AUDIT_ENTITY.HOUSEHOLD,
    householdId,
    metadata: {
      hasAddress: Boolean(parsed.address),
    },
    targetLabel: parsed.name,
  })

  revalidateAdmin()
}

export const createTenantAction = async (formData: FormData) => {
  const session = await requireRole([USER_ROLE.ADMIN])
  const parsed = createTenantSchema.parse({
    displayName: getString(formData, "displayName"),
    email: getString(formData, "email"),
    householdId: getString(formData, "householdId"),
    notes: getString(formData, "notes"),
    temporaryPassword: getString(formData, "temporaryPassword"),
    tenancyEndDate: getString(formData, "tenancyEndDate"),
    tenancyStartDate: getString(formData, "tenancyStartDate"),
  })
  const tenantId = createId()
  const normalizedEmail = normalizeEmail(parsed.email)
  const [existingTenant] = await db
    .select()
    .from(tenant)
    .where(
      and(
        eq(tenant.householdId, parsed.householdId),
        eq(tenant.email, normalizedEmail),
      ),
    )
    .limit(1)

  if (existingTenant) {
    throw new Error("A tenant with this email already exists.")
  }

  const userId = await ensureTenantLogin({
    displayName: parsed.displayName,
    email: normalizedEmail,
    householdId: parsed.householdId,
    temporaryPassword: parsed.temporaryPassword,
  })

  await db.insert(tenant).values({
    displayName: parsed.displayName,
    email: normalizedEmail,
    householdId: parsed.householdId,
    id: tenantId,
    notes: parsed.notes,
    userId,
  })
  await db.insert(tenancyPeriod).values({
    endDate: parsed.tenancyEndDate || null,
    id: createId(),
    startDate: parsed.tenancyStartDate,
    tenantId,
  })
  await recordAuditLog({
    action: AUDIT_ACTION.TENANT_CREATED,
    actorEmail: session.user.email,
    actorUserId: session.user.id,
    entityId: tenantId,
    entityType: AUDIT_ENTITY.TENANT,
    householdId: parsed.householdId,
    metadata: {
      email: normalizedEmail,
      hasNotes: Boolean(parsed.notes),
      tenancyEndDate: parsed.tenancyEndDate || null,
      tenancyStartDate: parsed.tenancyStartDate,
    },
    targetLabel: parsed.displayName,
  })

  revalidateAdmin()
}

export const regenerateTenantPasswordAction = async (formData: FormData) => {
  const session = await requireRole([USER_ROLE.ADMIN])
  const parsed = regenerateTenantPasswordSchema.parse({
    temporaryPassword: getString(formData, "temporaryPassword"),
    tenantId: getString(formData, "tenantId"),
  })
  const [existingTenant] = await db
    .select()
    .from(tenant)
    .where(eq(tenant.id, parsed.tenantId))
    .limit(1)

  if (!existingTenant) {
    throw new Error("Tenant not found.")
  }

  if (
    session.user.activeHouseholdId &&
    existingTenant.householdId !== session.user.activeHouseholdId
  ) {
    throw new Error("Tenant does not belong to the active household.")
  }

  const userId = await ensureTenantLogin({
    displayName: existingTenant.displayName,
    email: normalizeEmail(existingTenant.email),
    householdId: existingTenant.householdId,
    temporaryPassword: parsed.temporaryPassword,
  })

  await db
    .update(tenant)
    .set({ userId, updatedAt: new Date() })
    .where(eq(tenant.id, existingTenant.id))
  await recordAuditLog({
    action: AUDIT_ACTION.TENANT_PASSWORD_RESET,
    actorEmail: session.user.email,
    actorUserId: session.user.id,
    entityId: existingTenant.id,
    entityType: AUDIT_ENTITY.TENANT,
    householdId: existingTenant.householdId,
    metadata: {
      email: normalizeEmail(existingTenant.email),
    },
    targetLabel: existingTenant.displayName,
  })

  revalidateAdmin()
}

export const deleteTenantAction = async (formData: FormData) => {
  const session = await requireRole([USER_ROLE.ADMIN])
  requireAbility(session.user.role, APP_ACTION.DELETE, APP_SUBJECT.TENANT)
  const parsed = deleteTenantSchema.parse({
    tenantId: getString(formData, "tenantId"),
  })
  const [existingTenant] = await db
    .select()
    .from(tenant)
    .where(eq(tenant.id, parsed.tenantId))
    .limit(1)

  if (!existingTenant) {
    throw new Error("Tenant not found.")
  }

  if (
    session.user.activeHouseholdId &&
    existingTenant.householdId !== session.user.activeHouseholdId
  ) {
    throw new Error("Tenant does not belong to the active household.")
  }

  if (existingTenant.userId) {
    await db
      .update(user)
      .set({ activeHouseholdId: null, updatedAt: new Date() })
      .where(eq(user.id, existingTenant.userId))
  }

  await db.delete(tenant).where(eq(tenant.id, parsed.tenantId))
  await recordAuditLog({
    action: AUDIT_ACTION.TENANT_DELETED,
    actorEmail: session.user.email,
    actorUserId: session.user.id,
    entityId: existingTenant.id,
    entityType: AUDIT_ENTITY.TENANT,
    householdId: existingTenant.householdId,
    metadata: {
      email: normalizeEmail(existingTenant.email),
      hadLinkedUser: Boolean(existingTenant.userId),
    },
    targetLabel: existingTenant.displayName,
  })

  revalidateAdmin()
}

export const createAbsenceAction = async (formData: FormData) => {
  const parsed = absenceSchema.parse({
    endDate: getString(formData, "endDate"),
    reason: getString(formData, "reason"),
    startDate: getString(formData, "startDate"),
    tenantId: getString(formData, "tenantId"),
  })
  const session = await assertWritableAbsenceTenant(parsed.tenantId)
  const [targetTenant] = await db
    .select()
    .from(tenant)
    .where(eq(tenant.id, parsed.tenantId))
    .limit(1)

  if (!targetTenant) {
    throw new Error("Tenant not found.")
  }
  const absenceId = createId()

  await db.insert(absenceRange).values({
    createdByUserId: session.user.id,
    endDate: parsed.endDate,
    id: absenceId,
    reason: parsed.reason,
    startDate: parsed.startDate,
    tenantId: parsed.tenantId,
  })
  await recordAuditLog({
    action: AUDIT_ACTION.ABSENCE_CREATED,
    actorEmail: session.user.email,
    actorUserId: session.user.id,
    entityId: absenceId,
    entityType: AUDIT_ENTITY.ABSENCE,
    householdId: targetTenant.householdId,
    metadata: {
      endDate: parsed.endDate,
      reason: parsed.reason || null,
      startDate: parsed.startDate,
      tenantId: parsed.tenantId,
    },
    targetLabel: targetTenant.displayName,
  })

  revalidateCalendar()
}

export const updateAbsenceAction = async (formData: FormData) => {
  const parsed = updateAbsenceSchema.parse({
    absenceId: getString(formData, "absenceId"),
    endDate: getString(formData, "endDate"),
    startDate: getString(formData, "startDate"),
  })
  const [existingAbsence] = await db
    .select()
    .from(absenceRange)
    .where(eq(absenceRange.id, parsed.absenceId))
    .limit(1)

  if (!existingAbsence) {
    throw new Error("Calendar entry not found.")
  }

  const session = await assertWritableAbsenceTenant(existingAbsence.tenantId)
  const [targetTenant] = await db
    .select()
    .from(tenant)
    .where(eq(tenant.id, existingAbsence.tenantId))
    .limit(1)

  if (!targetTenant) {
    throw new Error("Tenant not found.")
  }

  await db
    .update(absenceRange)
    .set({
      endDate: parsed.endDate,
      startDate: parsed.startDate,
      updatedAt: new Date(),
    })
    .where(eq(absenceRange.id, parsed.absenceId))
  await recordAuditLog({
    action: AUDIT_ACTION.ABSENCE_UPDATED,
    actorEmail: session.user.email,
    actorUserId: session.user.id,
    entityId: existingAbsence.id,
    entityType: AUDIT_ENTITY.ABSENCE,
    householdId: targetTenant.householdId,
    metadata: {
      endDate: parsed.endDate,
      previousEndDate: existingAbsence.endDate,
      previousStartDate: existingAbsence.startDate,
      startDate: parsed.startDate,
      tenantId: existingAbsence.tenantId,
    },
    targetLabel: targetTenant.displayName,
  })

  revalidateCalendar()
}

export const deleteAbsenceAction = async (formData: FormData) => {
  const parsed = deleteAbsenceSchema.parse({
    absenceId: getString(formData, "absenceId"),
  })
  const [existingAbsence] = await db
    .select()
    .from(absenceRange)
    .where(eq(absenceRange.id, parsed.absenceId))
    .limit(1)

  if (!existingAbsence) {
    throw new Error("Calendar entry not found.")
  }

  const session = await assertWritableAbsenceTenant(existingAbsence.tenantId)
  const [targetTenant] = await db
    .select()
    .from(tenant)
    .where(eq(tenant.id, existingAbsence.tenantId))
    .limit(1)

  if (!targetTenant) {
    throw new Error("Tenant not found.")
  }

  await db.delete(absenceRange).where(eq(absenceRange.id, parsed.absenceId))
  await recordAuditLog({
    action: AUDIT_ACTION.ABSENCE_DELETED,
    actorEmail: session.user.email,
    actorUserId: session.user.id,
    entityId: existingAbsence.id,
    entityType: AUDIT_ENTITY.ABSENCE,
    householdId: targetTenant.householdId,
    metadata: {
      endDate: existingAbsence.endDate,
      startDate: existingAbsence.startDate,
      tenantId: existingAbsence.tenantId,
    },
    targetLabel: targetTenant.displayName,
  })

  revalidateCalendar()
}

export const createBillingCycleAction = async (formData: FormData) => {
  const session = await requireRole([USER_ROLE.ADMIN])
  const parsed = createBillingCycleSchema.parse({
    endDate: getString(formData, "endDate"),
    householdId: getString(formData, "householdId"),
    name: getString(formData, "name"),
    notes: getString(formData, "notes"),
    startDate: getString(formData, "startDate"),
    totalAmount: getString(formData, "totalAmount"),
    utilityType: getString(formData, "utilityType") || UTILITY_TYPE.ELECTRICITY,
    utilityProvider: getString(formData, "utilityProvider") || "SEB",
  })
  const billingCycleId = createId()
  const totalAmountCents = parseAmountCents(parsed.totalAmount)

  await db.insert(billingCycle).values({
    endDate: parsed.endDate,
    householdId: parsed.householdId,
    id: billingCycleId,
    name: parsed.name,
    notes: parsed.notes,
    startDate: parsed.startDate,
    totalAmountCents,
    utilityType: parsed.utilityType,
    utilityProvider: parsed.utilityProvider,
  })
  await recordAuditLog({
    action: AUDIT_ACTION.BILL_CREATED,
    actorEmail: session.user.email,
    actorUserId: session.user.id,
    entityId: billingCycleId,
    entityType: AUDIT_ENTITY.BILL,
    householdId: parsed.householdId,
    metadata: {
      endDate: parsed.endDate,
      startDate: parsed.startDate,
      totalAmountCents,
      utilityProvider: parsed.utilityProvider,
      utilityType: parsed.utilityType,
    },
    targetLabel: parsed.name,
  })

  revalidateUtilities()
}

export const runAllocationAction = async (formData: FormData) => {
  const session = await requireRole([USER_ROLE.ADMIN])
  const parsed = runAllocationSchema.parse({
    billingCycleId: getString(formData, "billingCycleId"),
  })
  const [cycle] = await db
    .select()
    .from(billingCycle)
    .where(eq(billingCycle.id, parsed.billingCycleId))
    .limit(1)

  if (!cycle) {
    throw new Error("Billing cycle not found.")
  }

  const tenantRows = await db
    .select()
    .from(tenant)
    .where(eq(tenant.householdId, cycle.householdId))
  const tenantIds = tenantRows.map((tenantRow) => tenantRow.id)
  const periodRows =
    tenantIds.length > 0
      ? await db
          .select()
          .from(tenancyPeriod)
          .where(inArray(tenancyPeriod.tenantId, tenantIds))
      : []
  const absenceRows =
    tenantIds.length > 0
      ? await db
          .select()
          .from(absenceRange)
          .where(inArray(absenceRange.tenantId, tenantIds))
      : []
  const periodsByTenantId = new Map(
    periodRows.map((period) => [period.tenantId, period]),
  )
  const absencesByTenantId = new Map<string, typeof absenceRows>()

  for (const absence of absenceRows) {
    const existingAbsences = absencesByTenantId.get(absence.tenantId) ?? []

    existingAbsences.push(absence)
    absencesByTenantId.set(absence.tenantId, existingAbsences)
  }

  const allocation = calculateAllocation({
    cycleEndDate: cycle.endDate,
    cycleStartDate: cycle.startDate,
    tenants: tenantRows.map((tenantRow) => {
      const period = periodsByTenantId.get(tenantRow.id)

      if (!period) {
        throw new Error(`Missing tenancy period for ${tenantRow.displayName}.`)
      }

      return {
        absenceRanges: (absencesByTenantId.get(tenantRow.id) ?? []).map(
          (absence) => ({
            endDate: absence.endDate,
            startDate: absence.startDate,
          }),
        ),
        displayName: tenantRow.displayName,
        tenantId: tenantRow.id,
        tenancyEndDate: period.endDate,
        tenancyStartDate: period.startDate,
      }
    }),
    totalAmountCents: cycle.totalAmountCents,
  })
  const allocationRunId = createId()

  await db.insert(allocationRun).values({
    billingCycleId: cycle.id,
    createdByUserId: session.user.id,
    id: allocationRunId,
    status: "final",
    totalAmountCents: allocation.totalAmountCents,
    totalPresentDays: allocation.totalPresentDays,
  })

  for (const line of allocation.lines) {
    const allocationLineId = createId()

    await db.insert(allocationLine).values({
      allocationRunId,
      amountCents: line.amountCents,
      id: allocationLineId,
      presentDays: line.presentDays,
      tenantId: line.tenantId,
    })
    await db.insert(payment).values({
      allocationLineId,
      amountPaidCents: 0,
      id: createId(),
      status: PAYMENT_STATUS.UNPAID,
    })
  }
  await recordAuditLog({
    action: AUDIT_ACTION.ALLOCATION_RUN,
    actorEmail: session.user.email,
    actorUserId: session.user.id,
    entityId: allocationRunId,
    entityType: AUDIT_ENTITY.ALLOCATION,
    householdId: cycle.householdId,
    metadata: {
      billingCycleId: cycle.id,
      lineCount: allocation.lines.length,
      totalAmountCents: allocation.totalAmountCents,
      totalPresentDays: allocation.totalPresentDays,
    },
    targetLabel: cycle.name,
  })

  revalidateUtilities()
}

export const uploadBillAction = async (formData: FormData) => {
  const session = await requireRole([USER_ROLE.ADMIN])
  const parsed = uploadBillSchema.parse({
    billingCycleId: getString(formData, "billingCycleId"),
  })
  const fileValue = formData.get("billFile")
  const [cycle] = await db
    .select()
    .from(billingCycle)
    .where(eq(billingCycle.id, parsed.billingCycleId))
    .limit(1)

  if (!cycle) {
    throw new Error("Billing cycle not found.")
  }

  if (!hasBlobConfig) {
    throw new Error("Vercel Blob is not configured.")
  }

  if (!(fileValue instanceof File) || fileValue.size === 0) {
    throw new Error("Choose a bill file to upload.")
  }

  const blob = await put(`bills/${parsed.billingCycleId}/${fileValue.name}`, fileValue, {
    access: "public",
    addRandomSuffix: true,
  })
  const uploadId = createId()

  await db.insert(billUpload).values({
    billingCycleId: parsed.billingCycleId,
    contentType: fileValue.type || null,
    fileName: fileValue.name,
    fileUrl: blob.url,
    id: uploadId,
    sizeBytes: fileValue.size,
    uploadedByUserId: session.user.id,
  })
  await recordAuditLog({
    action: AUDIT_ACTION.BILL_UPLOADED,
    actorEmail: session.user.email,
    actorUserId: session.user.id,
    entityId: uploadId,
    entityType: AUDIT_ENTITY.BILL,
    householdId: cycle.householdId,
    metadata: {
      billingCycleId: cycle.id,
      contentType: fileValue.type || null,
      fileName: fileValue.name,
      sizeBytes: fileValue.size,
    },
    targetLabel: cycle.name,
  })

  revalidateUtilities()
}

export const markPaymentAction = async (formData: FormData) => {
  const session = await requireRole([USER_ROLE.ADMIN])
  const parsed = markPaymentSchema.parse({
    amountPaid: getString(formData, "amountPaid"),
    notes: getString(formData, "notes"),
    paymentId: getString(formData, "paymentId"),
    status: getString(formData, "status"),
  })
  const [existingPayment] = await db
    .select()
    .from(payment)
    .where(eq(payment.id, parsed.paymentId))
    .limit(1)

  if (!existingPayment) {
    throw new Error("Payment not found.")
  }

  const [line] = await db
    .select()
    .from(allocationLine)
    .where(eq(allocationLine.id, existingPayment.allocationLineId))
    .limit(1)

  if (!line) {
    throw new Error("Allocation line not found.")
  }

  const [run] = await db
    .select()
    .from(allocationRun)
    .where(eq(allocationRun.id, line.allocationRunId))
    .limit(1)

  if (!run) {
    throw new Error("Allocation run not found.")
  }

  const [cycle] = await db
    .select()
    .from(billingCycle)
    .where(eq(billingCycle.id, run.billingCycleId))
    .limit(1)

  if (!cycle) {
    throw new Error("Billing cycle not found.")
  }
  const amountPaidCents = parseAmountCents(parsed.amountPaid)

  await db
    .update(payment)
    .set({
      amountPaidCents,
      notes: parsed.notes,
      paidAt: parsed.status === PAYMENT_STATUS.PAID ? new Date() : null,
      status: parsed.status,
      updatedAt: new Date(),
    })
    .where(eq(payment.id, parsed.paymentId))
  await recordAuditLog({
    action: AUDIT_ACTION.PAYMENT_UPDATED,
    actorEmail: session.user.email,
    actorUserId: session.user.id,
    entityId: parsed.paymentId,
    entityType: AUDIT_ENTITY.PAYMENT,
    householdId: cycle.householdId,
    metadata: {
      amountPaidCents,
      billingCycleId: cycle.id,
      previousAmountPaidCents: existingPayment.amountPaidCents,
      previousStatus: existingPayment.status,
      status: parsed.status,
      tenantId: line.tenantId,
    },
    targetLabel: cycle.name,
  })

  revalidateUtilities()
}
