import { relations, sql } from "drizzle-orm"
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

export const USER_ROLE = {
  ADMIN: "admin",
  TENANT: "tenant",
} as const

export const USER_ROLE_VALUES = [USER_ROLE.ADMIN, USER_ROLE.TENANT] as const

export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PARTIAL: "partial",
  PAID: "paid",
} as const

export const PAYMENT_STATUS_VALUES = [
  PAYMENT_STATUS.UNPAID,
  PAYMENT_STATUS.PARTIAL,
  PAYMENT_STATUS.PAID,
] as const

export const ALLOCATION_STATUS = {
  DRAFT: "draft",
  FINAL: "final",
} as const

export const ALLOCATION_STATUS_VALUES = [
  ALLOCATION_STATUS.DRAFT,
  ALLOCATION_STATUS.FINAL,
] as const

export const UTILITY_TYPE = {
  ELECTRICITY: "electricity",
  INTERNET: "internet",
  OTHER: "other",
  WATER: "water",
} as const

export const UTILITY_TYPE_VALUES = [
  UTILITY_TYPE.ELECTRICITY,
  UTILITY_TYPE.WATER,
  UTILITY_TYPE.INTERNET,
  UTILITY_TYPE.OTHER,
] as const

export const AUDIT_ACTION = {
  ABSENCE_CREATED: "absence.created",
  ABSENCE_DELETED: "absence.deleted",
  ABSENCE_UPDATED: "absence.updated",
  ALLOCATION_RUN: "allocation.run",
  BILL_CREATED: "bill.created",
  BILL_DELETED: "bill.deleted",
  BILL_UPLOADED: "bill.uploaded",
  HOUSEHOLD_CREATED: "household.created",
  PAYMENT_UPDATED: "payment.updated",
  TENANT_CREATED: "tenant.created",
  TENANT_DELETED: "tenant.deleted",
  TENANT_PASSWORD_RESET: "tenant.password_reset",
} as const

export const AUDIT_ACTION_VALUES = [
  AUDIT_ACTION.HOUSEHOLD_CREATED,
  AUDIT_ACTION.TENANT_CREATED,
  AUDIT_ACTION.TENANT_DELETED,
  AUDIT_ACTION.TENANT_PASSWORD_RESET,
  AUDIT_ACTION.ABSENCE_CREATED,
  AUDIT_ACTION.ABSENCE_UPDATED,
  AUDIT_ACTION.ABSENCE_DELETED,
  AUDIT_ACTION.BILL_CREATED,
  AUDIT_ACTION.BILL_DELETED,
  AUDIT_ACTION.BILL_UPLOADED,
  AUDIT_ACTION.ALLOCATION_RUN,
  AUDIT_ACTION.PAYMENT_UPDATED,
] as const

export const AUDIT_ENTITY = {
  ABSENCE: "absence",
  ALLOCATION: "allocation",
  BILL: "bill",
  HOUSEHOLD: "household",
  PAYMENT: "payment",
  TENANT: "tenant",
} as const

export const AUDIT_ENTITY_VALUES = [
  AUDIT_ENTITY.HOUSEHOLD,
  AUDIT_ENTITY.TENANT,
  AUDIT_ENTITY.ABSENCE,
  AUDIT_ENTITY.BILL,
  AUDIT_ENTITY.ALLOCATION,
  AUDIT_ENTITY.PAYMENT,
] as const

export type UserRole = (typeof USER_ROLE_VALUES)[number]
export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number]
export type AllocationStatus = (typeof ALLOCATION_STATUS_VALUES)[number]
export type UtilityType = (typeof UTILITY_TYPE_VALUES)[number]
export type AuditAction = (typeof AUDIT_ACTION_VALUES)[number]
export type AuditEntity = (typeof AUDIT_ENTITY_VALUES)[number]

const createdAt = integer("created_at", { mode: "timestamp_ms" })
  .notNull()
  .default(sql`(unixepoch('subsec') * 1000)`)

const updatedAt = integer("updated_at", { mode: "timestamp_ms" })
  .notNull()
  .default(sql`(unixepoch('subsec') * 1000)`)

export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    image: text("image"),
    role: text("role", { enum: USER_ROLE_VALUES }).notNull().default("tenant"),
    banned: integer("banned", { mode: "boolean" }).notNull().default(false),
    banReason: text("ban_reason"),
    banExpires: integer("ban_expires", { mode: "timestamp_ms" }),
    activeHouseholdId: text("active_household_id"),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("user_email_idx").on(table.email),
    index("user_active_household_idx").on(table.activeHouseholdId),
  ],
)

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt,
    updatedAt,
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_idx").on(table.token),
    index("session_user_id_idx").on(table.userId),
  ],
)

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt,
    updatedAt,
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
)

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
)

export const household = sqliteTable("household", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id),
  createdAt,
  updatedAt,
})

export const tenant = sqliteTable(
  "tenant",
  {
    id: text("id").primaryKey(),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    displayName: text("display_name").notNull(),
    email: text("email").notNull(),
    calendarColor: text("calendar_color"),
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("tenant_household_idx").on(table.householdId),
    uniqueIndex("tenant_household_email_idx").on(
      table.householdId,
      table.email,
    ),
  ],
)

export const tenancyPeriod = sqliteTable(
  "tenancy_period",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    startDate: text("start_date").notNull(),
    endDate: text("end_date"),
    createdAt,
    updatedAt,
  },
  (table) => [index("tenancy_period_tenant_idx").on(table.tenantId)],
)

export const billingCycle = sqliteTable(
  "billing_cycle",
  {
    id: text("id").primaryKey(),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    totalAmountCents: integer("total_amount_cents").notNull(),
    utilityType: text("utility_type", { enum: UTILITY_TYPE_VALUES })
      .notNull()
      .default(UTILITY_TYPE.ELECTRICITY),
    utilityProvider: text("utility_provider").notNull().default("SEB"),
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
  (table) => [index("billing_cycle_household_idx").on(table.householdId)],
)

export const billUpload = sqliteTable(
  "bill_upload",
  {
    id: text("id").primaryKey(),
    billingCycleId: text("billing_cycle_id")
      .notNull()
      .references(() => billingCycle.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url").notNull(),
    contentType: text("content_type"),
    sizeBytes: integer("size_bytes"),
    uploadedByUserId: text("uploaded_by_user_id")
      .notNull()
      .references(() => user.id),
    createdAt,
    updatedAt,
  },
  (table) => [index("bill_upload_cycle_idx").on(table.billingCycleId)],
)

export const absenceRange = sqliteTable(
  "absence_range",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    reason: text("reason"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    createdAt,
    updatedAt,
  },
  (table) => [index("absence_range_tenant_idx").on(table.tenantId)],
)

export const allocationRun = sqliteTable(
  "allocation_run",
  {
    id: text("id").primaryKey(),
    billingCycleId: text("billing_cycle_id")
      .notNull()
      .references(() => billingCycle.id, { onDelete: "cascade" }),
    status: text("status", { enum: ALLOCATION_STATUS_VALUES })
      .notNull()
      .default("draft"),
    totalPresentDays: real("total_present_days").notNull(),
    totalAmountCents: integer("total_amount_cents").notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    createdAt,
    updatedAt,
  },
  (table) => [index("allocation_run_cycle_idx").on(table.billingCycleId)],
)

export const allocationLine = sqliteTable(
  "allocation_line",
  {
    id: text("id").primaryKey(),
    allocationRunId: text("allocation_run_id")
      .notNull()
      .references(() => allocationRun.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    presentDays: real("present_days").notNull(),
    amountCents: integer("amount_cents").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("allocation_line_run_idx").on(table.allocationRunId),
    uniqueIndex("allocation_line_run_tenant_idx").on(
      table.allocationRunId,
      table.tenantId,
    ),
  ],
)

export const payment = sqliteTable(
  "payment",
  {
    id: text("id").primaryKey(),
    allocationLineId: text("allocation_line_id")
      .notNull()
      .references(() => allocationLine.id, { onDelete: "cascade" }),
    status: text("status", { enum: PAYMENT_STATUS_VALUES })
      .notNull()
      .default("unpaid"),
    amountPaidCents: integer("amount_paid_cents").notNull().default(0),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("payment_allocation_line_idx").on(table.allocationLineId)],
)

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => user.id),
    actorEmail: text("actor_email").notNull(),
    action: text("action", { enum: AUDIT_ACTION_VALUES }).notNull(),
    entityType: text("entity_type", { enum: AUDIT_ENTITY_VALUES }).notNull(),
    entityId: text("entity_id"),
    targetLabel: text("target_label"),
    metadata: text("metadata"),
    createdAt,
  },
  (table) => [
    index("audit_log_household_idx").on(table.householdId),
    index("audit_log_action_idx").on(table.action),
    index("audit_log_entity_idx").on(table.entityType),
    index("audit_log_actor_idx").on(table.actorEmail),
    index("audit_log_created_at_idx").on(table.createdAt),
  ],
)

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
}))

export const householdRelations = relations(household, ({ many, one }) => ({
  creator: one(user, {
    fields: [household.createdByUserId],
    references: [user.id],
  }),
  tenants: many(tenant),
  billingCycles: many(billingCycle),
  auditLogs: many(auditLog),
}))

export const tenantRelations = relations(tenant, ({ many, one }) => ({
  household: one(household, {
    fields: [tenant.householdId],
    references: [household.id],
  }),
  user: one(user, {
    fields: [tenant.userId],
    references: [user.id],
  }),
  tenancyPeriods: many(tenancyPeriod),
  absenceRanges: many(absenceRange),
  allocationLines: many(allocationLine),
}))

export const billingCycleRelations = relations(
  billingCycle,
  ({ many, one }) => ({
    household: one(household, {
      fields: [billingCycle.householdId],
      references: [household.id],
    }),
    uploads: many(billUpload),
    allocationRuns: many(allocationRun),
  }),
)
