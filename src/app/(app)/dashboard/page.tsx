import {
  CheckCircle2,
  CircleAlert,
  CircleDollarSign,
  FileText,
  Home,
  Mail,
  ReceiptText,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { hasBlobConfig } from "@config/env"
import { PAYMENT_STATUS, USER_ROLE } from "@db/schema"
import { requireSession } from "@features/auth/auth-server"
import { AbsenceCalendarPanel } from "@features/calendar/absence-calendar-panel"
import { CalendarHelpGuide } from "@features/calendar/calendar-help-guide"
import { DashboardTabs } from "@features/dashboard/dashboard-tabs"
import { TemporaryPasswordField } from "@features/household/temporary-password-field"
import { TenantPasswordResetForm } from "@features/household/tenant-password-reset-form"
import {
  addLocalDays,
  formatCurrency,
  formatDays,
  formatLocalDate,
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
import { getDashboardData, type DashboardData } from "./data"

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

const getOpenPaymentCount = (data: DashboardData) =>
  data.allocationRuns
    .flatMap((run) => run.lines)
    .filter((line) => line.paymentStatus !== PAYMENT_STATUS.PAID).length

const getLatestAllocationRun = (data: DashboardData) =>
  [...data.allocationRuns].sort(
    (first, second) => second.createdAt.getTime() - first.createdAt.getTime(),
  )[0] ?? null

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
    <div className="motion-lift rounded-lg border bg-card px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

function WorkflowItem({
  complete,
  label,
}: {
  complete: boolean
  label: string
}) {
  const Icon = complete ? CheckCircle2 : CircleAlert

  return (
    <div className="motion-lift flex items-center gap-3 rounded-md border bg-background px-3 py-2">
      <Icon
        className={
          complete ? "size-4 text-emerald-600" : "size-4 text-muted-foreground"
        }
      />
      <span className="text-sm">{label}</span>
    </div>
  )
}

function HouseholdSetupCard({ isAdmin }: { isAdmin: boolean }) {
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
                      <div className="flex justify-end gap-2">
                        <TenantPasswordResetForm
                          action={regenerateTenantPasswordAction}
                          tenantId={tenant.id}
                          tenantName={tenant.displayName}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              aria-label={`Remove ${tenant.displayName}`}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20"
                              size="icon-sm"
                              variant="ghost"
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
                      </div>
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

export default async function DashboardPage() {
  const session = await requireSession()
  const data = await getDashboardData({
    email: session.user.email,
    id: session.user.id,
    name: session.user.name,
  })
  const isAdmin = data.user.role === USER_ROLE.ADMIN

  if (!data.household) {
    return <HouseholdSetupCard isAdmin={isAdmin} />
  }

  const latestRun = getLatestAllocationRun(data)
  const openPaymentCount = getOpenPaymentCount(data)
  const loginReadyTenantCount = data.tenants.filter(
    (tenant) => tenant.isLinked,
  ).length
  const billUploadCount = data.billingCycles.reduce(
    (count, cycle) => count + cycle.uploads.length,
    0,
  )
  const setupItems = [
    {
      complete: data.tenants.length > 0,
      label: "Tenant roster created",
    },
    {
      complete: loginReadyTenantCount > 0,
      label: "Tenant logins created",
    },
    {
      complete: data.billingCycles.length > 0,
      label: "Billing cycle recorded",
    },
    {
      complete: Boolean(latestRun),
      label: "Bill split calculated",
    },
  ] as const

  return (
    <div className="motion-stagger mx-auto grid w-full max-w-7xl gap-5 px-4 py-5">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="motion-fade-up rounded-lg border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{USER_ROLE_LABEL[data.user.role]}</Badge>
                <Badge variant="outline">{data.household.name}</Badge>
              </div>
              <h1 className="mt-3 text-2xl font-semibold">
                Household dashboard
              </h1>
              {data.household.address ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.household.address}
                </p>
              ) : null}
            </div>
            <div className="text-sm text-muted-foreground">
              {latestRun
                ? `Latest bill split: ${formatCurrency(latestRun.totalAmountCents)}`
                : "No bill split yet"}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              detail={`${loginReadyTenantCount} tenant login${loginReadyTenantCount === 1 ? "" : "s"} ready`}
              label="Tenants"
              value={String(data.tenants.length)}
            />
            <MetricTile
              detail="Recorded away periods"
              label="Away ranges"
              value={String(data.absences.length)}
            />
            <MetricTile
              detail="Electricity cycles"
              label="Bills"
              value={String(data.billingCycles.length)}
            />
            <MetricTile
              detail="Awaiting settlement"
              label="Open payments"
              value={String(openPaymentCount)}
            />
          </div>
        </div>

        <aside className="motion-fade-up rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="size-4" />
            <h2 className="text-sm font-semibold">Setup progress</h2>
          </div>
          <div className="mt-3 grid gap-2">
            {setupItems.map((item) => (
              <WorkflowItem
                complete={item.complete}
                key={item.label}
                label={item.label}
              />
            ))}
          </div>
        </aside>
      </section>

      <DashboardTabs
        calendar={
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
        }
        tenants={
          <section
            className={
              isAdmin ? "grid gap-4 lg:grid-cols-[360px_1fr]" : "grid gap-4"
            }
          >
            {isAdmin ? (
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
            ) : null}

            <TenantRoster
              isAdmin={isAdmin}
              loginReadyTenantCount={loginReadyTenantCount}
              tenants={data.tenants}
            />
          </section>
        }
        billing={
          <section
            className={
              isAdmin
                ? "grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]"
                : "grid gap-4"
            }
          >
            {isAdmin ? (
              <div className="motion-fade-up rounded-lg border bg-card lg:sticky lg:top-20 lg:self-start">
                <div className="border-b px-5 py-4">
                  <h2 className="font-semibold">Create bill</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add the bill period and amount.
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
              <section className="motion-fade-up rounded-lg border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">Billing overview</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Cycles, payments, and attachments.
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
                <Empty className="motion-fade-up min-h-[260px] bg-card">
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
                  className="motion-fade-up rounded-lg border bg-card"
                  key={cycle.id}
                >
                  <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="font-semibold">{cycle.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateRange(cycle.startDate, cycle.endDate)} ·{" "}
                        {cycle.utilityProvider}
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
        }
      />
    </div>
  )
}
