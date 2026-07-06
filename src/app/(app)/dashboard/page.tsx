import {
  CalendarDays,
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
  Users,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { PAYMENT_STATUS, USER_ROLE } from "@db/schema"
import { requireSession } from "@features/auth/auth-server"
import { AbsenceCalendarPanel } from "@features/calendar/absence-calendar-panel"
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
    <div className="rounded-lg border bg-card px-4 py-3">
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
    <div className="flex items-center gap-3 rounded-md border bg-background px-3 py-2">
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
              ? "Start by adding the shared house. Then add tenants and bills."
              : "An admin needs to add your tenant record with your sign-in email."}
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

function TenantStatusBadge({ isLinked }: { isLinked: boolean }) {
  const Icon = isLinked ? CheckCircle2 : CircleAlert

  return (
    <Badge className="gap-1" variant={isLinked ? "secondary" : "outline"}>
      <Icon />
      {isLinked ? "Signed in" : "Needs sign-in"}
    </Badge>
  )
}

function TenantRoster({
  isAdmin,
  linkedTenantCount,
  tenants,
}: {
  isAdmin: boolean
  linkedTenantCount: number
  tenants: DashboardData["tenants"]
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <div>
          <CardTitle>Tenant roster</CardTitle>
          <CardDescription>
            Active tenancy dates, contact email, and account status.
          </CardDescription>
        </div>
        <CardAction>
          <Badge variant="outline">
            {tenants.length === 0
              ? "0 tenants"
              : `${linkedTenantCount}/${tenants.length} signed in`}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        {tenants.length === 0 ? (
          <div className="p-4">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserPlus className="text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>No tenants added</EmptyTitle>
                <EmptyDescription>
                  Add each tenant with their Google email and tenancy period.
                  New records stay in Needs sign-in until the tenant signs in.
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
                    <TenantStatusBadge isLinked={tenant.isLinked} />
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            aria-label={`Remove ${tenant.displayName}`}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 />
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove {tenant.displayName}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This removes the tenant record, away ranges, and
                              bill split lines connected to them. Their sign-in
                              account is not deleted.
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
  const linkedTenantCount = data.tenants.filter((tenant) => tenant.isLinked).length
  const setupItems = [
    {
      complete: data.tenants.length > 0,
      label: "Tenant roster created",
    },
    {
      complete: linkedTenantCount > 0,
      label: "At least one tenant has signed in",
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
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border bg-card p-5">
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
              detail={`${linkedTenantCount} signed-in account${linkedTenantCount === 1 ? "" : "s"}`}
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

        <aside className="rounded-lg border bg-muted/20 p-4">
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

      <Tabs defaultValue="calendar">
        <TabsList className="grid w-full grid-cols-3 md:w-fit">
          <TabsTrigger value="calendar">
            <CalendarDays />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="tenants">
            <Users />
            Tenants
          </TabsTrigger>
          <TabsTrigger value="billing">
            <ReceiptText />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4" value="calendar">
          <section className="rounded-lg border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Away calendar</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Mark dates away and review current house absences.
              </p>
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
        </TabsContent>

        <TabsContent className="mt-4" value="tenants">
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
                    Add a tenant with the email they use to sign in.
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
                      <Label htmlFor="email">Google email</Label>
                      <Input id="email" name="email" type="email" />
                    </div>
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
                      <Users />
                      Add tenant
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : null}

            <TenantRoster
              isAdmin={isAdmin}
              linkedTenantCount={linkedTenantCount}
              tenants={data.tenants}
            />
          </section>
        </TabsContent>

        <TabsContent className="mt-4" value="billing">
          <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
            {isAdmin ? (
              <div className="rounded-lg border bg-card">
                <div className="border-b px-5 py-4">
                  <h2 className="font-semibold">Create bill</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add the bill period and total amount.
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

            <div className="grid gap-4">
              {!hasBlobConfig && isAdmin ? (
                <Alert>
                  <Upload className="size-4" />
                  <AlertTitle>Bill uploads unavailable</AlertTitle>
                  <AlertDescription>
                    Bill PDF uploads are not available for this workspace yet.
                  </AlertDescription>
                </Alert>
              ) : null}

              {data.billingCycles.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/20 p-8">
                  <h2 className="font-semibold">No bills recorded</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create a bill to split costs by present days.
                  </p>
                </div>
              ) : null}

              {data.billingCycles.map((cycle) => (
                <article className="rounded-lg border bg-card" key={cycle.id}>
                  <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="font-semibold">{cycle.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateRange(cycle.startDate, cycle.endDate)} ·{" "}
                        {cycle.utilityProvider}
                      </p>
                    </div>
                    <Badge className="w-fit">{formatCurrency(cycle.totalAmountCents)}</Badge>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
