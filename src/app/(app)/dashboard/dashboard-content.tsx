import {
  CheckCircle2,
  CircleAlert,
  FileText,
  Home,
  Mail,
  ReceiptText,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react"
import type { Route } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
} from "@/components/ui/button-group"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { hasBlobConfig } from "@config/env"
import {
  AUDIT_ACTION,
  AUDIT_ENTITY,
  PAYMENT_STATUS,
  UTILITY_TYPE,
  type AuditAction,
  type AuditEntity,
  type UtilityType,
} from "@db/schema"
import { AbsenceCalendarPanel } from "@features/calendar/absence-calendar-panel"
import { CalendarHelpGuide } from "@features/calendar/calendar-help-guide"
import { TemporaryPasswordField } from "@features/household/temporary-password-field"
import { TenantPasswordResetForm } from "@features/household/tenant-password-reset-form"
import {
  addLocalDays,
  formatCurrency,
  formatDays,
  formatLocalDate,
  toLocalDateValue,
} from "@shared/lib/format"
import { DateRangeFields } from "@shared/ui/date-range-fields"
import { PendingSubmitButton } from "@shared/ui/pending-submit-button"

import {
  createAbsenceAction,
  createHouseholdAction,
  createTenantAction,
  deleteAbsenceAction,
  deleteBillingCycleAction,
  deleteTenantAction,
  markPaymentAction,
  regenerateTenantPasswordAction,
  runAllocationAction,
  updateAbsenceAction,
  uploadBillAction,
} from "./actions"
import {
  DashboardMonthlyExpenseTrendChart,
  DashboardMonthlyUtilityStackChart,
} from "./dashboard-charts"
import { CreateUtilityBillForm } from "./create-utility-bill-form"
import { getMonthlyExpenseChartData } from "./dashboard-expense-data"
import type {
  AuditLogFilters,
  DashboardAuditLog,
  DashboardData,
} from "./data"
import {
  buildOccupancyModel,
  OCCUPANCY_CELL_STATE,
  type OccupancyCell,
  type OccupancyTenantRow,
} from "./occupancy"

const toAmountValue = (amountCents: number) => (amountCents / 100).toFixed(2)

const PAYMENT_STATUS_LABEL = {
  [PAYMENT_STATUS.PAID]: "Paid",
  [PAYMENT_STATUS.PARTIAL]: "Partial",
  [PAYMENT_STATUS.UNPAID]: "Unpaid",
} as const

const UTILITY_TYPE_LABEL = {
  [UTILITY_TYPE.ELECTRICITY]: "Electricity",
  [UTILITY_TYPE.WATER]: "Water",
  [UTILITY_TYPE.INTERNET]: "Internet",
  [UTILITY_TYPE.OTHER]: "Other",
} as const

const AUDIT_ACTION_LABEL = {
  [AUDIT_ACTION.ABSENCE_CREATED]: "Calendar entry created",
  [AUDIT_ACTION.ABSENCE_DELETED]: "Calendar entry deleted",
  [AUDIT_ACTION.ABSENCE_UPDATED]: "Calendar entry updated",
  [AUDIT_ACTION.ALLOCATION_RUN]: "Allocation run",
  [AUDIT_ACTION.BILL_CREATED]: "Utility bill created",
  [AUDIT_ACTION.BILL_DELETED]: "Utility bill deleted",
  [AUDIT_ACTION.BILL_UPLOADED]: "Bill uploaded",
  [AUDIT_ACTION.HOUSEHOLD_CREATED]: "Household created",
  [AUDIT_ACTION.PAYMENT_UPDATED]: "Payment updated",
  [AUDIT_ACTION.TENANT_CREATED]: "Tenant created",
  [AUDIT_ACTION.TENANT_DELETED]: "Tenant deleted",
  [AUDIT_ACTION.TENANT_PASSWORD_RESET]: "Tenant password reset",
} as const

const AUDIT_ENTITY_LABEL = {
  [AUDIT_ENTITY.ABSENCE]: "Calendar",
  [AUDIT_ENTITY.ALLOCATION]: "Allocation",
  [AUDIT_ENTITY.BILL]: "Bill",
  [AUDIT_ENTITY.HOUSEHOLD]: "Household",
  [AUDIT_ENTITY.PAYMENT]: "Payment",
  [AUDIT_ENTITY.TENANT]: "Tenant",
} as const

const ADMIN_TAB = {
  AUDIT: "audit",
  TENANTS: "tenants",
} as const

type AdminTab = (typeof ADMIN_TAB)[keyof typeof ADMIN_TAB]

const ALL_FILTER_VALUE = "all"

const formatPaymentStatus = (status: string) => {
  if (status === PAYMENT_STATUS.PAID) {
    return PAYMENT_STATUS_LABEL[PAYMENT_STATUS.PAID]
  }

  if (status === PAYMENT_STATUS.PARTIAL) {
    return PAYMENT_STATUS_LABEL[PAYMENT_STATUS.PARTIAL]
  }

  if (status === PAYMENT_STATUS.UNPAID) {
    return PAYMENT_STATUS_LABEL[PAYMENT_STATUS.UNPAID]
  }

  return status
}

const formatRunStatus = (status: string) =>
  status === "final" ? "Final" : status

const formatDateRange = (startDate: string, endDate: string | null) =>
  `${formatLocalDate(startDate)} to ${
    endDate ? formatLocalDate(addLocalDays(endDate, -1)) : "present"
  }`

const getTenantInitials = (displayName: string) => {
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase())
    .join("")

  return initials || "T"
}

type DashboardAllocationLineView =
  DashboardData["allocationRuns"][number]["lines"][number]

type DashboardAllocationRunView = DashboardData["allocationRuns"][number]

interface PaymentSummary {
  collectionRate: number
  openLines: DashboardAllocationLineView[]
  openPaymentCount: number
  outstandingCents: number
  paidCents: number
  totalCents: number
}

const DASHBOARD_LIST_LIMIT = 4
const DASHBOARD_CHART_MONTH_LIMIT = 6

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const isLocalDateOnOrBefore = (dateValue: string, comparisonDate: string) =>
  LOCAL_DATE_PATTERN.test(dateValue) && dateValue <= comparisonDate

const isLocalDateAfter = (dateValue: string | null, comparisonDate: string) =>
  dateValue === null ||
  (LOCAL_DATE_PATTERN.test(dateValue) && dateValue > comparisonDate)

const formatUtilityType = (utilityType: UtilityType) =>
  UTILITY_TYPE_LABEL[utilityType]

const formatOpenShareCount = (count: number) =>
  count === 1 ? "1 open share" : `${count} open shares`

const formatCompactDateLabel = (dateValue: string) =>
  formatLocalDate(dateValue).replace(/\s\d{4}$/, "")

const getLatestAllocationRunsByCycle = (data: DashboardData) => {
  const runByCycleId = new Map<string, DashboardAllocationRunView>()

  for (const run of data.allocationRuns) {
    const existingRun = runByCycleId.get(run.billingCycleId)

    if (!existingRun || run.createdAt > existingRun.createdAt) {
      runByCycleId.set(run.billingCycleId, run)
    }
  }

  return [...runByCycleId.values()].sort(
    (first, second) => second.createdAt.getTime() - first.createdAt.getTime(),
  )
}

const getPaymentSummary = (data: DashboardData): PaymentSummary => {
  const lines = getLatestAllocationRunsByCycle(data).flatMap((run) => run.lines)
  const openLines: DashboardAllocationLineView[] = []
  let paidCents = 0
  let totalCents = 0
  let outstandingCents = 0

  for (const line of lines) {
    const linePaidCents = Math.min(
      line.paymentAmountPaidCents,
      line.amountCents,
    )
    const lineOutstandingCents = Math.max(
      line.amountCents - linePaidCents,
      0,
    )

    totalCents += line.amountCents
    paidCents += linePaidCents
    outstandingCents += lineOutstandingCents

    if (lineOutstandingCents > 0) {
      openLines.push(line)
    }
  }

  return {
    collectionRate:
      totalCents === 0 ? 0 : Math.round((paidCents / totalCents) * 100),
    openLines,
    openPaymentCount: openLines.length,
    outstandingCents,
    paidCents,
    totalCents,
  }
}

const getOpenPaymentCount = (data: DashboardData) =>
  getPaymentSummary(data).openPaymentCount

const getCurrentAbsences = (data: DashboardData, today: string) => {
  const absenceByTenantId = new Map<string, DashboardData["absences"][number]>()
  const activeAbsences = [...data.absences]
    .filter(
      (absence) =>
        isLocalDateOnOrBefore(absence.startDate, today) &&
        isLocalDateAfter(absence.endDate, today) &&
        data.tenants.some(
          (tenant) =>
            tenant.id === absence.tenantId &&
            isLocalDateOnOrBefore(tenant.tenancyStartDate, today) &&
            isLocalDateAfter(tenant.tenancyEndDate, today),
        ),
    )
    .sort((first, second) => first.endDate.localeCompare(second.endDate))

  for (const absence of activeAbsences) {
    if (!absenceByTenantId.has(absence.tenantId)) {
      absenceByTenantId.set(absence.tenantId, absence)
    }
  }

  return [...absenceByTenantId.values()]
}

const getUpcomingAbsences = (data: DashboardData, today: string) =>
  [...data.absences]
    .filter(
      (absence) =>
        LOCAL_DATE_PATTERN.test(absence.startDate) &&
        absence.startDate > today &&
        isLocalDateAfter(absence.endDate, today) &&
        data.tenants.some(
          (tenant) =>
            tenant.id === absence.tenantId &&
            isLocalDateOnOrBefore(tenant.tenancyStartDate, absence.startDate) &&
            isLocalDateAfter(tenant.tenancyEndDate, absence.startDate),
        ),
    )
    .sort((first, second) => first.startDate.localeCompare(second.startDate))

const getRecentBillingCycles = (data: DashboardData, limit = 6) =>
  [...data.billingCycles]
    .sort((first, second) => second.startDate.localeCompare(first.startDate))
    .slice(0, limit)

const formatAuditAction = (action: AuditAction) => AUDIT_ACTION_LABEL[action]

const formatAuditEntity = (entity: AuditEntity) => AUDIT_ENTITY_LABEL[entity]

const formatAuditMetadata = (metadata: Record<string, unknown> | null) => {
  if (!metadata) {
    return "No metadata"
  }

  const entries = Object.entries(metadata)

  if (entries.length === 0) {
    return "No metadata"
  }

  return entries
    .map(([key, value]) => {
      const formattedValue = Array.isArray(value)
        ? value.join(", ")
        : String(value)

      return `${key}: ${formattedValue}`
    })
    .join(" · ")
}

function MetricTile({
  label,
  value,
  detail,
}: {
  detail: string
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border bg-background px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 break-words font-mono text-2xl font-semibold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

function DashboardPanel({
  children,
  className,
  meta,
  title,
}: {
  children: ReactNode
  className?: string | undefined
  meta?: string | undefined
  title: string
}) {
  return (
    <section
      className={cn("flex min-h-0 flex-col rounded-md border bg-card p-3", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {meta ? (
          <span className="text-xs text-muted-foreground">{meta}</span>
        ) : null}
      </div>
      <div className="mt-3 min-h-0 flex-1">{children}</div>
    </section>
  )
}

function DashboardKpi({
  detail,
  label,
  value,
}: {
  detail: string
  label: string
  value: string
}) {
  return (
    <div className="min-w-0 bg-background px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold leading-none tabular-nums">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

const getOccupancyCellLabel = ({
  cell,
  tenantName,
}: {
  cell: OccupancyCell
  tenantName: string
}) => {
  const dateLabel = formatLocalDate(cell.date)

  if (cell.state === OCCUPANCY_CELL_STATE.INACTIVE) {
    return `${tenantName}, ${dateLabel}: tenancy inactive`
  }

  if (cell.state === OCCUPANCY_CELL_STATE.PRESENT) {
    return `${tenantName}, ${dateLabel}: present`
  }

  if (!cell.absence) {
    return `${tenantName}, ${dateLabel}: out`
  }

  const reason = cell.absence.reason ? `. ${cell.absence.reason}` : ""

  return `${tenantName}, ${dateLabel}: out from ${formatDateRange(
    cell.absence.startDate,
    cell.absence.endDate,
  )}${reason}`
}

function OccupancyStatusCell({
  cell,
  tenantName,
}: {
  cell: OccupancyCell
  tenantName: string
}) {
  const label = getOccupancyCellLabel({ cell, tenantName })

  return (
    <button
      aria-label={label}
      className={cn(
        "h-6 min-w-0 rounded-[3px] border transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        cell.state === OCCUPANCY_CELL_STATE.PRESENT &&
          "border-border bg-background hover:border-foreground/30",
        cell.state === OCCUPANCY_CELL_STATE.OUT &&
          "border-muted-foreground/30 bg-muted-foreground/35 hover:bg-muted-foreground/40 dark:border-muted-foreground/40 dark:bg-muted-foreground/45 dark:hover:bg-muted-foreground/55",
        cell.state === OCCUPANCY_CELL_STATE.INACTIVE &&
          "border-dashed border-border bg-muted/50 opacity-80 dark:bg-muted/40",
      )}
      title={label}
      type="button"
    />
  )
}

function OccupancyTenantGridRow({ row }: { row: OccupancyTenantRow }) {
  return (
    <div className="grid grid-cols-[minmax(6rem,1.35fr)_repeat(14,minmax(0,1fr))] items-center gap-0.5 border-t px-2 py-1 first:border-t-0">
      <div className="flex min-w-0 items-center gap-1.5 pr-2">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: row.calendarColor }}
        />
        <span className="truncate text-xs font-medium">{row.displayName}</span>
      </div>
      {row.cells.map((cell) => (
        <OccupancyStatusCell
          cell={cell}
          key={cell.date}
          tenantName={row.displayName}
        />
      ))}
    </div>
  )
}

function OccupancyBoard({
  className,
  model,
}: {
  className?: string | undefined
  model: ReturnType<typeof buildOccupancyModel>
}) {
  return (
    <DashboardPanel
      className={className}
      meta="Next 14 days"
      title="Tenant calendar"
    >
      {model.tenantRows.length > 0 ? (
        <div className="h-full min-h-0 overflow-auto rounded-md border">
          <div className="min-w-[680px]">
            <div className="sticky top-0 z-[1] grid grid-cols-[minmax(6rem,1.35fr)_repeat(14,minmax(0,1fr))] items-end gap-0.5 bg-muted/80 px-2 py-1.5 backdrop-blur">
              <div className="pr-2 text-xs font-medium text-muted-foreground">
                Tenant
              </div>
              {model.days.map((day) => (
                <div
                  className="text-center font-mono text-[0.58rem] leading-tight text-muted-foreground tabular-nums"
                  key={day.date}
                >
                  {formatCompactDateLabel(day.date)
                    .split(" ")
                    .map((datePart) => (
                      <span className="block" key={datePart}>
                        {datePart}
                      </span>
                    ))}
                </div>
              ))}
            </div>
            <div>
              {model.tenantRows.map((row) => (
                <OccupancyTenantGridRow key={row.id} row={row} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-px border-t bg-border text-xs">
              {[
                ["Present", "bg-background"],
                ["Out", "bg-muted-foreground/35 dark:bg-muted-foreground/45"],
                ["Inactive", "bg-muted/50 dark:bg-muted/40"],
              ].map(([label, swatchClassName]) => (
                <div
                  className="flex items-center gap-2 bg-background px-2 py-1.5 text-muted-foreground"
                  key={label}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-3 rounded-[3px] border border-border",
                      swatchClassName,
                    )}
                  />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Empty className="min-h-[300px]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserPlus className="text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No tenants to show</EmptyTitle>
            <EmptyDescription>
              Add tenants to see household presence over the next 14 days.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </DashboardPanel>
  )
}

export function DashboardRouteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-3 px-4 py-3">
      {children}
    </div>
  )
}

export function HouseholdSetupCard({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {isAdmin ? "Create your household" : "Waiting for household access"}
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? "Add the shared house, then tenants and bills."
              : "Ask an admin to add your tenant record."}
          </CardDescription>
        </CardHeader>
        {isAdmin ? (
          <CardContent>
            <form action={createHouseholdAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Household name</Label>
                <Input id="name" name="name" placeholder="BDC shared house" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" placeholder="Optional" />
              </div>
              <PendingSubmitButton pendingLabel="Creating...">
                <Home />
                Create household
              </PendingSubmitButton>
            </form>
          </CardContent>
        ) : null}
      </Card>
    </div>
  )
}

function TenantLoginBadge({ hasLogin }: { hasLogin: boolean }) {
  const Icon = hasLogin ? CheckCircle2 : CircleAlert

  return (
    <Badge className="gap-1" variant={hasLogin ? "secondary" : "outline"}>
      <Icon />
      {hasLogin ? "Login ready" : "Needs password"}
    </Badge>
  )
}

function TenantRoster({
  isAdmin,
  loginReadyTenantCount,
  tenants,
}: {
  isAdmin: boolean
  loginReadyTenantCount: number
  tenants: DashboardData["tenants"]
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <div>
          <CardTitle>Tenant roster</CardTitle>
          <CardDescription>
            Tenancy dates, email, and status.
          </CardDescription>
        </div>
        <CardAction>
          <Badge variant="outline">
            {tenants.length === 0
              ? "0 tenants"
              : `${loginReadyTenantCount}/${tenants.length} logins ready`}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent
        className={tenants.length === 0 ? "flex min-h-0 flex-1 p-0" : "p-0"}
      >
        {tenants.length === 0 ? (
          <div className="flex flex-1 p-4">
            <Empty className="flex-1">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserPlus className="text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>No tenants added</EmptyTitle>
                <EmptyDescription>
                  Add tenants with their email and tenancy dates.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <Table className="min-w-[760px]">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 px-4 text-muted-foreground">
                  Tenant
                </TableHead>
                <TableHead className="h-11 px-4 text-muted-foreground">
                  Email
                </TableHead>
                <TableHead className="h-11 px-4 text-muted-foreground">
                  Tenancy
                </TableHead>
                <TableHead className="h-11 px-4 text-muted-foreground">
                  Status
                </TableHead>
                {isAdmin ? (
                  <TableHead className="h-11 px-4 text-right text-muted-foreground">
                    Actions
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-secondary font-mono text-xs font-semibold text-secondary-foreground">
                        {getTenantInitials(tenant.displayName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">{tenant.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          Tenant record
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    <div className="flex min-w-0 items-center gap-2">
                      <Mail className="size-4 shrink-0" />
                      <span className="truncate">{tenant.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {formatDateRange(
                      tenant.tenancyStartDate,
                      tenant.tenancyEndDate,
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <TenantLoginBadge hasLogin={tenant.isLinked} />
                  </TableCell>
                  {isAdmin ? (
                    <TableCell className="px-4 py-3 text-right">
                      <form
                        action={deleteTenantAction}
                        className="hidden"
                        id={`delete-tenant-${tenant.id}`}
                      >
                        <input
                          name="tenantId"
                          type="hidden"
                          value={tenant.id}
                        />
                      </form>
                      <ButtonGroup className="ml-auto">
                        <TenantPasswordResetForm
                          action={regenerateTenantPasswordAction}
                          tenantId={tenant.id}
                          tenantName={tenant.displayName}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              aria-label={`Remove ${tenant.displayName}`}
                              className="text-destructive hover:text-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20"
                              size="icon-sm"
                              variant="outline"
                            >
                              <Trash2 />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove {tenant.displayName}?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes the tenant, calendar dates, and bill
                                splits. The sign-in account stays.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                                form={`delete-tenant-${tenant.id}`}
                                type="submit"
                              >
                                Remove tenant
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </ButtonGroup>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardOverview({ data }: { data: DashboardData }) {
  const today = toLocalDateValue(new Date())
  const currentAbsences = getCurrentAbsences(data, today)
  const occupancyModel = buildOccupancyModel({
    absences: data.absences,
    startDate: today,
    tenants: data.tenants,
  })
  const paymentSummary = getPaymentSummary(data)
  const recentCycles = getRecentBillingCycles(data)
  const upcomingAbsences = getUpcomingAbsences(data, today)
  const monthlyExpenseData = getMonthlyExpenseChartData(
    data.billingCycles,
    DASHBOARD_CHART_MONTH_LIMIT,
  )
  const visibleOpenLines = paymentSummary.openLines.slice(
    0,
    DASHBOARD_LIST_LIMIT,
  )
  const visibleRecentCycles = recentCycles.slice(0, DASHBOARD_LIST_LIMIT)
  const nextAbsence = upcomingAbsences[0] ?? null
  const latestExpenseMonth = monthlyExpenseData.at(-1) ?? null
  const previousExpenseMonth = monthlyExpenseData.at(-2) ?? null
  const expenseDelta =
    latestExpenseMonth && previousExpenseMonth
      ? latestExpenseMonth.total - previousExpenseMonth.total
      : null
  const presentDetail =
    occupancyModel.today.totalActive === 1
      ? "1 active tenant"
      : `${occupancyModel.today.totalActive} active tenants`
  const outDetail =
    occupancyModel.today.out === 0
      ? "No one out"
      : currentAbsences
          .map((absence) => absence.displayName)
          .slice(0, 2)
          .join(", ")
  const upcomingDetail = nextAbsence
    ? `${nextAbsence.displayName} · ${formatCompactDateLabel(nextAbsence.startDate)}`
    : "No upcoming entries"
  const paymentDetail =
    paymentSummary.totalCents === 0
      ? "No allocations"
      : paymentSummary.openPaymentCount === 0
        ? "All shares paid"
        : formatOpenShareCount(paymentSummary.openPaymentCount)
  const monthlyExpenseMeta = latestExpenseMonth
    ? `${latestExpenseMonth.monthLabel} · ${formatCurrency(latestExpenseMonth.total * 100)}`
    : undefined
  const expenseTrendMeta =
    expenseDelta === null
      ? monthlyExpenseData.length > 0
        ? `${monthlyExpenseData.length} ${monthlyExpenseData.length === 1 ? "month" : "months"}`
        : undefined
      : expenseDelta === 0
        ? "No change"
        : `${expenseDelta > 0 ? "+" : ""}${formatCurrency(expenseDelta * 100)} vs previous`
  return (
    <div className="grid gap-3 xl:h-[calc(100dvh-5rem)] xl:grid-rows-[auto_minmax(0,1fr)] xl:overflow-hidden">
      <section className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2 xl:grid-cols-4">
        <DashboardKpi
          detail={presentDetail}
          label="At home"
          value={`${occupancyModel.today.present}/${occupancyModel.today.totalActive}`}
        />
        <DashboardKpi
          detail={outDetail}
          label="Out today"
          value={String(occupancyModel.today.out)}
        />
        <DashboardKpi
          detail={upcomingDetail}
          label="Upcoming away"
          value={String(upcomingAbsences.length)}
        />
        <DashboardKpi
          detail={paymentDetail}
          label="Open payments"
          value={String(paymentSummary.openPaymentCount)}
        />
      </section>

      <section className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,7fr)_minmax(20rem,3fr)]">
        <div className="grid min-h-0 gap-3 xl:grid-rows-[minmax(0,0.92fr)_minmax(0,1fr)]">
          <DashboardPanel
            className="min-h-[18rem] xl:min-h-0"
            meta={monthlyExpenseMeta}
            title="Monthly expenses"
          >
            {monthlyExpenseData.length > 0 ? (
              <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-2">
                <DashboardMonthlyUtilityStackChart data={monthlyExpenseData} />
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {[
                    ["Electricity", "var(--utility-electricity)"],
                    ["Water", "var(--utility-water)"],
                    ["Internet", "var(--utility-internet)"],
                    ["Other", "var(--utility-other)"],
                  ].map(([label, color]) => (
                    <span className="flex items-center gap-1.5" key={label}>
                      <span
                        aria-hidden="true"
                        className="size-2 rounded-[2px]"
                        style={{ backgroundColor: color }}
                      />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <Empty className="min-h-[220px]">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ReceiptText className="text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>No utility bills</EmptyTitle>
                  <EmptyDescription>
                    Add bills to compare monthly utility spend.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </DashboardPanel>

          <OccupancyBoard
            className="min-h-[18rem] xl:min-h-0"
            model={occupancyModel}
          />
        </div>

        <div className="grid min-h-0 gap-3 xl:grid-rows-[10rem_9rem_minmax(0,1fr)]">
          <DashboardPanel meta={expenseTrendMeta} title="Expense trend">
            {monthlyExpenseData.length > 1 ? (
              <DashboardMonthlyExpenseTrendChart data={monthlyExpenseData} />
            ) : (
              <Empty className="min-h-[120px]">
                <EmptyHeader>
                  <EmptyTitle>Need another month</EmptyTitle>
                  <EmptyDescription>
                    Add more bills to see whether spend is rising.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </DashboardPanel>

          <DashboardPanel
            meta={
              paymentSummary.totalCents > 0
                ? `${paymentSummary.collectionRate}% paid`
                : undefined
            }
            title="Payment queue"
          >
            <div className="grid grid-cols-3 gap-3 border-b pb-3">
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="mt-1 truncate font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(paymentSummary.paidCents)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due</p>
                <p className="mt-1 truncate font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(paymentSummary.outstandingCents)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Open</p>
                <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
                  {paymentSummary.openPaymentCount}
                </p>
              </div>
            </div>

            <div className="mt-2 h-full min-h-0 overflow-auto divide-y">
              {visibleOpenLines.length > 0 ? (
                visibleOpenLines.map((line) => {
                  const lineOutstandingCents = Math.max(
                    line.amountCents - line.paymentAmountPaidCents,
                    0,
                  )

                  return (
                    <div
                      className="flex items-center justify-between gap-3 py-2"
                      key={line.id}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {line.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPaymentStatus(line.paymentStatus)}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-medium tabular-nums">
                        {formatCurrency(lineOutstandingCents)}
                      </span>
                    </div>
                  )
                })
              ) : (
                <p className="py-2 text-xs text-muted-foreground">
                  {paymentSummary.totalCents === 0
                    ? "No payment lines."
                    : "All shares paid."}
                </p>
              )}
            </div>
          </DashboardPanel>

          <DashboardPanel
            meta={
              data.billingCycles.length > 0
                ? `${data.billingCycles.length} total`
                : undefined
            }
            title="Recent bills"
          >
            <div className="h-full min-h-0 overflow-auto divide-y">
              {visibleRecentCycles.length > 0 ? (
                visibleRecentCycles.map((cycle) => (
                  <div
                    className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    key={cycle.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {cycle.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatUtilityType(cycle.utilityType)} ·{" "}
                        {formatDateRange(cycle.startDate, cycle.endDate)}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-medium tabular-nums">
                      {formatCurrency(cycle.totalAmountCents)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No bills recorded.
                </p>
              )}
            </div>
          </DashboardPanel>
        </div>
      </section>
    </div>
  )
}

export function DashboardCalendar({
  data,
  isAdmin,
}: {
  data: DashboardData
  isAdmin: boolean
}) {
  return (
    <section className="rounded-lg border bg-card">
      <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold">Calendar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select dates and review calendar entries.
          </p>
        </div>
        <CalendarHelpGuide />
      </div>
      <div className="p-5">
        <AbsenceCalendarPanel
          absences={data.absences}
          canManageAll={isAdmin}
          createAbsenceAction={createAbsenceAction}
          currentTenantId={data.currentTenantId}
          deleteAbsenceAction={deleteAbsenceAction}
          tenants={data.tenants.map((tenant) => ({
            calendarColor: tenant.calendarColor,
            displayName: tenant.displayName,
            id: tenant.id,
          }))}
          updateAbsenceAction={updateAbsenceAction}
        />
      </div>
    </section>
  )
}

function AuditLogPanel({
  auditFilters,
  auditLogs,
}: {
  auditFilters: AuditLogFilters
  auditLogs: DashboardAuditLog[]
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <div>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>
            Filter operational changes across tenants, calendar entries, and
            utilities.
          </CardDescription>
        </div>
        <CardAction>
          <Badge variant="outline">{auditLogs.length} events</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4 p-5">
        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
          <input name="tab" type="hidden" value={ADMIN_TAB.AUDIT} />
          <Select
            defaultValue={auditFilters.action ?? ALL_FILTER_VALUE}
            name="action"
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All actions</SelectItem>
              {Object.entries(AUDIT_ACTION_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            defaultValue={auditFilters.entityType ?? ALL_FILTER_VALUE}
            name="entityType"
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All entities</SelectItem>
              {Object.entries(AUDIT_ENTITY_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            defaultValue={auditFilters.actorEmail ?? ""}
            name="actorEmail"
            placeholder="Actor email"
            type="email"
          />
          <Input
            defaultValue={auditFilters.dateFrom ?? ""}
            name="dateFrom"
            type="date"
          />
          <Input
            defaultValue={auditFilters.dateTo ?? ""}
            name="dateTo"
            type="date"
          />
          <div className="flex gap-2">
            <PendingSubmitButton pendingLabel="Filtering...">
              Filter
            </PendingSubmitButton>
            <Button asChild variant="outline">
              <Link href={"/dashboard/admin?tab=audit" as Route}>Reset</Link>
            </Button>
          </div>
        </form>

        {auditLogs.length === 0 ? (
          <Empty className="min-h-[220px]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText className="text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No audit events</EmptyTitle>
              <EmptyDescription>
                Change filters or perform an app action to create audit records.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatLocalDate(
                        event.createdAt.toISOString().slice(0, 10),
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <span>{formatAuditAction(event.action)}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatAuditEntity(event.entityType)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{event.targetLabel ?? event.entityId}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.actorEmail}
                    </TableCell>
                    <TableCell className="max-w-md text-xs text-muted-foreground">
                      {formatAuditMetadata(event.metadata)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardAdmin({
  auditFilters,
  auditLogs,
  data,
  defaultTab = ADMIN_TAB.TENANTS,
}: {
  auditFilters: AuditLogFilters
  auditLogs: DashboardAuditLog[]
  data: DashboardData
  defaultTab?: AdminTab
}) {
  const loginReadyTenantCount = data.tenants.filter(
    (tenant) => tenant.isLinked,
  ).length

  if (!data.household) {
    return null
  }

  return (
    <div className="grid gap-4">
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value={ADMIN_TAB.TENANTS}>Tenants</TabsTrigger>
          <TabsTrigger value={ADMIN_TAB.AUDIT}>Audit Log</TabsTrigger>
        </TabsList>
        <TabsContent value={ADMIN_TAB.TENANTS}>
          <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <Card className="gap-0 py-0">
              <CardHeader className="border-b py-4">
                <CardTitle>Create tenant</CardTitle>
                <CardDescription>
                  Add a tenant and generate their temporary password.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <form action={createTenantAction} className="grid gap-4">
                  <input
                    name="householdId"
                    type="hidden"
                    value={data.household.id}
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="displayName">Name</Label>
                    <Input id="displayName" name="displayName" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Tenant email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                  <TemporaryPasswordField
                    description="Share this with the tenant after creating the account."
                    id="temporaryPassword"
                    name="temporaryPassword"
                  />
                  <DateRangeFields
                    allowOpenRange
                    endName="tenancyEndDate"
                    id="tenancyPeriod"
                    label="Tenancy period"
                    placeholder="Select move-in date"
                    startName="tenancyStartDate"
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" />
                  </div>
                  <PendingSubmitButton pendingLabel="Adding...">
                    <UserPlus />
                    Add tenant
                  </PendingSubmitButton>
                </form>
              </CardContent>
            </Card>

            <TenantRoster
              isAdmin
              loginReadyTenantCount={loginReadyTenantCount}
              tenants={data.tenants}
            />
          </section>
        </TabsContent>
        <TabsContent value={ADMIN_TAB.AUDIT}>
          <AuditLogPanel
            auditFilters={auditFilters}
            auditLogs={auditLogs}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function DashboardUtilities({
  data,
  isAdmin,
}: {
  data: DashboardData
  isAdmin: boolean
}) {
  const openPaymentCount = getOpenPaymentCount(data)
  const billUploadCount = data.billingCycles.reduce(
    (count, cycle) => count + cycle.uploads.length,
    0,
  )

  if (!data.household) {
    return null
  }

  return (
    <section
      className={
        isAdmin
          ? "grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]"
          : "grid gap-4"
      }
    >
      {isAdmin ? (
        <div className="rounded-lg border bg-card lg:sticky lg:top-20 lg:self-start">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Create utility bill</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select the utility, period, and amount.
            </p>
          </div>
          <CreateUtilityBillForm householdId={data.household.id} />
        </div>
      ) : null}

      <div className="grid content-start gap-4">
        <section className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-semibold">Utilities</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Bills, allocations, payments, and attachments.
              </p>
            </div>
            <Badge
              className="w-fit"
              variant={hasBlobConfig ? "secondary" : "outline"}
            >
              {hasBlobConfig ? "Uploads ready" : "Uploads off"}
            </Badge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetricTile
              detail="Recorded cycles"
              label="Bills"
              value={String(data.billingCycles.length)}
            />
            <MetricTile
              detail="Awaiting settlement"
              label="Open payments"
              value={String(openPaymentCount)}
            />
            <MetricTile
              detail={hasBlobConfig ? "Attached files" : "Not configured"}
              label="Uploads"
              value={String(billUploadCount)}
            />
          </div>

        </section>

        {data.billingCycles.length === 0 ? (
          <Empty className="min-h-[260px] bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptText className="text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No bills yet</EmptyTitle>
              <EmptyDescription>
                Create a bill to calculate shares.
              </EmptyDescription>
            </EmptyHeader>
            {isAdmin ? (
              <EmptyContent>
                <Badge variant="outline">Use the form to start</Badge>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : null}

        {data.billingCycles.map((cycle) => (
          <article
            className="rounded-lg border bg-card"
            key={cycle.id}
          >
            <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-semibold">{cycle.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateRange(cycle.startDate, cycle.endDate)} ·{" "}
                  {formatUtilityType(cycle.utilityType)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="w-fit">
                  {formatCurrency(cycle.totalAmountCents)}
                </Badge>
                {isAdmin ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        aria-label={`Delete ${cycle.name}`}
                        className="text-destructive hover:text-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20"
                        size="icon-sm"
                        variant="outline"
                      >
                        <Trash2 />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this bill?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes its splits, payments, and uploads.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <form action={deleteBillingCycleAction}>
                          <input
                            name="billingCycleId"
                            type="hidden"
                            value={cycle.id}
                          />
                          <Button type="submit" variant="destructive">
                            Delete bill
                          </Button>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 p-5">
              {isAdmin ? (
                <div className="flex flex-wrap gap-3">
                  <form action={runAllocationAction}>
                    <input
                      name="billingCycleId"
                      type="hidden"
                      value={cycle.id}
                    />
                    <PendingSubmitButton pendingLabel="Calculating..." size="sm">
                      Calculate shares
                    </PendingSubmitButton>
                  </form>
                  {hasBlobConfig ? (
                    <form
                      action={uploadBillAction}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input
                        name="billingCycleId"
                        type="hidden"
                        value={cycle.id}
                      />
                      <Input className="max-w-64" name="billFile" type="file" />
                      <PendingSubmitButton
                        pendingLabel="Attaching..."
                        size="sm"
                      >
                        <Upload />
                        Attach bill
                      </PendingSubmitButton>
                    </form>
                  ) : null}
                </div>
              ) : null}

              {cycle.uploads.length > 0 ? (
                <div className="rounded-md border bg-muted/20 p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4" />
                    <p className="text-sm font-medium">Uploaded bills</p>
                  </div>
                  <div className="mt-2 grid gap-2">
                    {cycle.uploads.map((upload) => (
                      <a
                        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        href={upload.downloadHref}
                        key={upload.id}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {upload.fileName}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {data.allocationRuns
                .filter((run) => run.billingCycleId === cycle.id)
                .map((run) => (
                  <div className="rounded-md border" key={run.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-medium">Bill split</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDays(run.totalPresentDays)} present days ·{" "}
                          {formatRunStatus(run.status)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {formatCurrency(run.totalAmountCents)}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Days</TableHead>
                            <TableHead>Share</TableHead>
                            <TableHead>Payment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {run.lines.map((line) => (
                            <TableRow key={line.id}>
                              <TableCell>{line.displayName}</TableCell>
                              <TableCell>
                                {formatDays(line.presentDays)}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(line.amountCents)}
                              </TableCell>
                              <TableCell>
                                {isAdmin && line.paymentId ? (
                                  <form
                                    action={markPaymentAction}
                                    className="flex flex-wrap gap-2"
                                  >
                                    <input
                                      name="paymentId"
                                      type="hidden"
                                      value={line.paymentId}
                                    />
                                    <Select
                                      defaultValue={line.paymentStatus}
                                      name="status"
                                    >
                                      <SelectTrigger className="w-28">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value={PAYMENT_STATUS.UNPAID}>
                                          {PAYMENT_STATUS_LABEL.unpaid}
                                        </SelectItem>
                                        <SelectItem value={PAYMENT_STATUS.PARTIAL}>
                                          {PAYMENT_STATUS_LABEL.partial}
                                        </SelectItem>
                                        <SelectItem value={PAYMENT_STATUS.PAID}>
                                          {PAYMENT_STATUS_LABEL.paid}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      className="w-24"
                                      defaultValue={toAmountValue(
                                        line.paymentAmountPaidCents,
                                      )}
                                      inputMode="decimal"
                                      name="amountPaid"
                                    />
                                    <Input
                                      className="w-32"
                                      defaultValue={line.paymentNotes ?? ""}
                                      name="notes"
                                      placeholder="Note"
                                    />
                                    <PendingSubmitButton
                                      pendingLabel="Updating..."
                                      size="sm"
                                    >
                                      Update
                                    </PendingSubmitButton>
                                  </form>
                                ) : (
                                  <Badge variant="outline">
                                    {formatPaymentStatus(line.paymentStatus)}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
