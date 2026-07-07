import {
  CalendarPlus,
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
import { hasBlobConfig } from "@config/env"
import {
  AUDIT_ACTION,
  AUDIT_ENTITY,
  PAYMENT_STATUS,
  USER_ROLE,
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

import {
  createAbsenceAction,
  createBillingCycleAction,
  createHouseholdAction,
  createTenantAction,
  deleteAbsenceAction,
  deleteTenantAction,
  markPaymentAction,
  regenerateTenantPasswordAction,
  runAllocationAction,
  updateAbsenceAction,
  uploadBillAction,
} from "./actions"
import {
  DashboardCollectionChart,
  type DashboardCollectionChartDatum,
  DashboardOccupancyChart,
  type DashboardOccupancyChartDatum,
} from "./dashboard-charts"
import type {
  AuditLogFilters,
  DashboardAuditLog,
  DashboardData,
} from "./data"

const toAmountValue = (amountCents: number) => (amountCents / 100).toFixed(2)

const USER_ROLE_LABEL = {
  [USER_ROLE.ADMIN]: "Admin",
  [USER_ROLE.TENANT]: "Tenant",
} as const

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
  [AUDIT_ACTION.ABSENCE_CREATED]: "Away range created",
  [AUDIT_ACTION.ABSENCE_DELETED]: "Away range deleted",
  [AUDIT_ACTION.ABSENCE_UPDATED]: "Away range updated",
  [AUDIT_ACTION.ALLOCATION_RUN]: "Allocation run",
  [AUDIT_ACTION.BILL_CREATED]: "Utility bill created",
  [AUDIT_ACTION.BILL_UPLOADED]: "Bill uploaded",
  [AUDIT_ACTION.HOUSEHOLD_CREATED]: "Household created",
  [AUDIT_ACTION.PAYMENT_UPDATED]: "Payment updated",
  [AUDIT_ACTION.TENANT_CREATED]: "Tenant created",
  [AUDIT_ACTION.TENANT_DELETED]: "Tenant deleted",
  [AUDIT_ACTION.TENANT_PASSWORD_RESET]: "Tenant password reset",
} as const

const AUDIT_ENTITY_LABEL = {
  [AUDIT_ENTITY.ABSENCE]: "Away",
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

const OCCUPANCY_TIMELINE_DAYS = 14

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

const getLatestAllocationRun = (data: DashboardData) =>
  getLatestAllocationRunsByCycle(data)[0] ?? null

const getActiveTenants = (data: DashboardData, today: string) =>
  data.tenants.filter(
    (tenant) =>
      isLocalDateOnOrBefore(tenant.tenancyStartDate, today) &&
      isLocalDateAfter(tenant.tenancyEndDate, today),
  )

const isTenantActiveOnDate = (
  data: DashboardData,
  tenantId: string,
  dateValue: string,
) => getActiveTenants(data, dateValue).some((tenant) => tenant.id === tenantId)

const getCurrentAbsences = (data: DashboardData, today: string) =>
  [...data.absences]
    .filter(
      (absence) =>
        isLocalDateOnOrBefore(absence.startDate, today) &&
        isLocalDateAfter(absence.endDate, today) &&
        isTenantActiveOnDate(data, absence.tenantId, today),
    )
    .sort((first, second) => first.endDate.localeCompare(second.endDate))

const getUpcomingAbsences = (data: DashboardData, today: string) =>
  [...data.absences]
    .filter(
      (absence) =>
        LOCAL_DATE_PATTERN.test(absence.startDate) &&
        absence.startDate > today &&
        isLocalDateAfter(absence.endDate, today) &&
        isTenantActiveOnDate(data, absence.tenantId, absence.startDate),
    )
    .sort((first, second) => first.startDate.localeCompare(second.startDate))

const getRecentBillingCycles = (data: DashboardData, limit = 6) =>
  [...data.billingCycles]
    .sort((first, second) => second.startDate.localeCompare(first.startDate))
    .slice(0, limit)

const getAwayTenantIdsOnDate = (data: DashboardData, dateValue: string) => {
  const tenantIds = new Set<string>()

  for (const absence of data.absences) {
    if (
      isLocalDateOnOrBefore(absence.startDate, dateValue) &&
      isLocalDateAfter(absence.endDate, dateValue) &&
      isTenantActiveOnDate(data, absence.tenantId, dateValue)
    ) {
      tenantIds.add(absence.tenantId)
    }
  }

  return tenantIds
}

const getOccupancyTimelineData = (
  data: DashboardData,
  today: string,
): DashboardOccupancyChartDatum[] =>
  Array.from({ length: OCCUPANCY_TIMELINE_DAYS }, (_, index) => {
    const dateValue = addLocalDays(today, index)
    const activeTenantCount = getActiveTenants(data, dateValue).length
    const awayTenantCount = getAwayTenantIdsOnDate(data, dateValue).size

    return {
      away: awayTenantCount,
      date: dateValue,
      label: formatCompactDateLabel(dateValue),
      present: Math.max(activeTenantCount - awayTenantCount, 0),
    }
  })

const getCollectionChartData = (
  summary: PaymentSummary,
): DashboardCollectionChartDatum[] => [
  {
    due: summary.outstandingCents / 100,
    label: "Collection",
    paid: summary.paidCents / 100,
  },
]

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
  meta,
  title,
}: {
  children: ReactNode
  meta?: string | undefined
  title: string
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {meta ? (
          <span className="text-xs text-muted-foreground">{meta}</span>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
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
    <div className="bg-background px-4 py-4 sm:px-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold leading-none tabular-nums">
        {value}
      </p>
      <p className="mt-2 truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

function DashboardActionToolbar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <ButtonGroup className="flex-wrap justify-start lg:justify-end">
      {isAdmin ? (
        <>
          <Button asChild size="sm" variant="outline">
            <Link href={"/dashboard/admin" as Route}>
              <UserPlus />
              Tenant
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={"/dashboard/utilities" as Route}>
              <ReceiptText />
              Bill
            </Link>
          </Button>
        </>
      ) : null}
      <Button asChild size="sm" variant="outline">
        <Link href={"/dashboard/away" as Route}>
          <CalendarPlus />
          Away
        </Link>
      </Button>
    </ButtonGroup>
  )
}

export function DashboardRouteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5">
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
              <Button type="submit">
                <Home />
                Create household
              </Button>
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
                                This removes the tenant, away dates, and bill
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
  const isAdmin = data.user.role === USER_ROLE.ADMIN
  const activeTenants = getActiveTenants(data, today)
  const currentAbsences = getCurrentAbsences(data, today)
  const latestRun = getLatestAllocationRun(data)
  const paymentSummary = getPaymentSummary(data)
  const recentCycles = getRecentBillingCycles(data)
  const upcomingAbsences = getUpcomingAbsences(data, today)
  const presentTenantCount = Math.max(
    activeTenants.length - currentAbsences.length,
    0,
  )
  const occupancyTimelineData = getOccupancyTimelineData(data, today)
  const collectionChartData = getCollectionChartData(paymentSummary)
  const visibleOpenLines = paymentSummary.openLines.slice(
    0,
    DASHBOARD_LIST_LIMIT,
  )
  const visibleCurrentAbsences = currentAbsences.slice(0, DASHBOARD_LIST_LIMIT)
  const visibleUpcomingAbsences = upcomingAbsences.slice(
    0,
    DASHBOARD_LIST_LIMIT,
  )
  const visibleRecentCycles = recentCycles.slice(0, DASHBOARD_LIST_LIMIT)
  const nextAbsence = upcomingAbsences[0] ?? null
  const presentDetail =
    activeTenants.length === 1
      ? "1 active tenant"
      : `${activeTenants.length} active tenants`
  const awayDetail =
    currentAbsences.length === 0
      ? "No one away"
      : currentAbsences
          .map((absence) => absence.displayName)
          .slice(0, 2)
          .join(", ")
  const upcomingDetail = nextAbsence
    ? `${nextAbsence.displayName} · ${formatCompactDateLabel(nextAbsence.startDate)}`
    : "No scheduled away"
  const paymentDetail =
    paymentSummary.totalCents === 0
      ? "No allocations"
      : paymentSummary.openPaymentCount === 0
        ? "All shares paid"
        : formatOpenShareCount(paymentSummary.openPaymentCount)
  return (
    <div className="grid gap-5">
      <header className="grid gap-4 border-b pb-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{USER_ROLE_LABEL[data.user.role]}</Badge>
            <span className="text-xs text-muted-foreground">
              {formatLocalDate(today)}
            </span>
          </div>
          <h1 className="mt-3 truncate text-3xl font-semibold leading-tight">
            {data.household?.name ?? "Dashboard"}
          </h1>
          {data.household?.address ? (
            <p className="mt-1 max-w-2xl truncate text-sm text-muted-foreground">
              {data.household.address}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 lg:justify-items-end">
          <DashboardActionToolbar isAdmin={isAdmin} />
          <div className="text-sm lg:text-right">
            <p className="text-xs text-muted-foreground">Latest split</p>
            <p className="mt-1 font-mono font-medium tabular-nums">
              {latestRun ? formatCurrency(latestRun.totalAmountCents) : "None"}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 xl:grid-cols-4">
        <DashboardKpi
          detail={presentDetail}
          label="Present"
          value={`${presentTenantCount}/${activeTenants.length}`}
        />
        <DashboardKpi
          detail={awayDetail}
          label="Away now"
          value={String(currentAbsences.length)}
        />
        <DashboardKpi
          detail={upcomingDetail}
          label="Upcoming away"
          value={String(upcomingAbsences.length)}
        />
        <DashboardKpi
          detail={paymentDetail}
          label="Open shares"
          value={String(paymentSummary.openPaymentCount)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DashboardPanel meta="Next 14 days" title="Occupancy timeline">
          {activeTenants.length > 0 ? (
            <DashboardOccupancyChart data={occupancyTimelineData} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No active tenancies.
            </p>
          )}
        </DashboardPanel>

        <DashboardPanel meta={formatLocalDate(today)} title="Today">
          <div className="grid grid-cols-2 gap-4 border-b pb-4">
            <div>
              <p className="text-xs text-muted-foreground">Present</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                {presentTenantCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Away</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                {currentAbsences.length}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">Away now</h3>
              <span className="text-xs text-muted-foreground">
                {currentAbsences.length}
              </span>
            </div>
            <div className="mt-2 divide-y">
              {visibleCurrentAbsences.length > 0 ? (
                visibleCurrentAbsences.map((absence) => (
                  <div className="py-2" key={absence.id}>
                    <p className="truncate text-sm font-medium">
                      {absence.displayName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Until{" "}
                      {formatCompactDateLabel(
                        addLocalDays(absence.endDate, -1),
                      )}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-2 text-sm text-muted-foreground">None.</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">Next away</h3>
              <span className="text-xs text-muted-foreground">
                {upcomingAbsences.length}
              </span>
            </div>
            <div className="mt-2 divide-y">
              {visibleUpcomingAbsences.length > 0 ? (
                visibleUpcomingAbsences.map((absence) => (
                  <div className="py-2" key={absence.id}>
                    <p className="truncate text-sm font-medium">
                      {absence.displayName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateRange(absence.startDate, absence.endDate)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-2 text-sm text-muted-foreground">None.</p>
              )}
            </div>
          </div>
        </DashboardPanel>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <DashboardPanel
          meta={
            paymentSummary.totalCents > 0
              ? `${paymentSummary.collectionRate}% paid`
              : undefined
          }
          title="Collections"
        >
          {paymentSummary.totalCents > 0 ? (
            <DashboardCollectionChart data={collectionChartData} />
          ) : (
            <p className="text-sm text-muted-foreground">No allocations.</p>
          )}

          <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="mt-1 font-mono font-semibold tabular-nums">
                {formatCurrency(paymentSummary.paidCents)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Due</p>
              <p className="mt-1 font-mono font-semibold tabular-nums">
                {formatCurrency(paymentSummary.outstandingCents)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open</p>
              <p className="mt-1 font-mono font-semibold tabular-nums">
                {paymentSummary.openPaymentCount}
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y">
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
              <p className="py-2 text-sm text-muted-foreground">
                {paymentSummary.totalCents === 0
                  ? "No allocations."
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
          <div className="divide-y">
            {visibleRecentCycles.length > 0 ? (
              visibleRecentCycles.map((cycle) => (
                <div
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  key={cycle.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{cycle.name}</p>
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
              <p className="text-sm text-muted-foreground">No bills recorded.</p>
            )}
          </div>
        </DashboardPanel>
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
          <h2 className="font-semibold">Away calendar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mark away dates and review current absences.
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
            Filter operational changes across tenants, away ranges, and
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
            <Button type="submit">Filter</Button>
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
      <section className="rounded-lg border bg-card p-5">
        <Badge variant="secondary">Admin</Badge>
        <h1 className="mt-3 text-2xl font-semibold">Admin hub</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          Manage tenants and review the operational audit trail for this
          household.
        </p>
      </section>

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
                  <Button type="submit">
                    <UserPlus />
                    Add tenant
                  </Button>
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
          <form action={createBillingCycleAction} className="grid gap-4 p-5">
            <input
              name="householdId"
              type="hidden"
              value={data.household.id}
            />
            <div className="grid gap-2">
              <Label htmlFor="billName">Bill name</Label>
              <Input
                id="billName"
                name="name"
                placeholder="January 2026 electricity"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="utilityType">Utility type</Label>
              <Select defaultValue={UTILITY_TYPE.ELECTRICITY} name="utilityType">
                <SelectTrigger className="w-full" id="utilityType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(UTILITY_TYPE_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DateRangeFields
              endName="endDate"
              id="billPeriod"
              label="Bill period"
              placeholder="Select bill dates"
              startName="startDate"
            />
            <div className="grid gap-2">
              <Label htmlFor="totalAmount">Total amount</Label>
              <Input
                id="totalAmount"
                inputMode="decimal"
                name="totalAmount"
                placeholder="300.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="utilityProvider">Provider</Label>
              <Input
                defaultValue="SEB"
                id="utilityProvider"
                name="utilityProvider"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="billNotes">Notes</Label>
              <Textarea id="billNotes" name="notes" />
            </div>
            <Button type="submit">
              <ReceiptText />
              Save bill
            </Button>
          </form>
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

          {!hasBlobConfig && isAdmin ? (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-dashed bg-muted/20 p-3">
              <Upload className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Uploads are off</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure bill storage to attach files.
                </p>
              </div>
            </div>
          ) : null}
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
                  {formatUtilityType(cycle.utilityType)} · {cycle.utilityProvider}
                </p>
              </div>
              <Badge className="w-fit">
                {formatCurrency(cycle.totalAmountCents)}
              </Badge>
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
                    <Button size="sm" type="submit">
                      Calculate shares
                    </Button>
                  </form>
                  <form
                    action={uploadBillAction}
                    className="flex flex-wrap items-center gap-2"
                    encType="multipart/form-data"
                  >
                    <input
                      name="billingCycleId"
                      type="hidden"
                      value={cycle.id}
                    />
                    <Input
                      className="max-w-64"
                      disabled={!hasBlobConfig}
                      name="billFile"
                      type="file"
                    />
                    <Button disabled={!hasBlobConfig} size="sm" type="submit">
                      <Upload />
                      Attach bill
                    </Button>
                  </form>
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
                        href={upload.fileUrl}
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
                                    <Button size="sm" type="submit">
                                      Update
                                    </Button>
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
