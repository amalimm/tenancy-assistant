import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CircleDollarSign,
  FileText,
  Home,
  ReceiptText,
  Upload,
  Users,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
import { formatCurrency, formatDays } from "@shared/lib/format"

import {
  createAbsenceAction,
  createBillingCycleAction,
  createHouseholdAction,
  createTenantAction,
  deleteAbsenceAction,
  markPaymentAction,
  runAllocationAction,
  updateAbsenceAction,
  uploadBillAction,
} from "./actions"
import { getDashboardData, type DashboardData } from "./data"

const toAmountValue = (amountCents: number) => (amountCents / 100).toFixed(2)

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
            {isAdmin ? "Create your household" : "Waiting for tenant setup"}
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? "Create the shared house record before adding tenants and bills."
              : "An admin must create a tenant record using your Google email."}
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
      label: "At least one tenant account linked",
    },
    {
      complete: data.billingCycles.length > 0,
      label: "Billing cycle recorded",
    },
    {
      complete: Boolean(latestRun),
      label: "Allocation run generated",
    },
  ] as const

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{data.user.role}</Badge>
                <Badge variant="outline">{data.household.name}</Badge>
              </div>
              <h1 className="mt-3 text-2xl font-semibold">
                Household operations
              </h1>
              {data.household.address ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.household.address}
                </p>
              ) : null}
            </div>
            <div className="text-sm text-muted-foreground">
              {latestRun
                ? `Latest allocation: ${formatCurrency(latestRun.totalAmountCents)}`
                : "No allocation generated"}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              detail={`${linkedTenantCount} linked account${linkedTenantCount === 1 ? "" : "s"}`}
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
              detail="Need admin follow-up"
              label="Open payments"
              value={String(openPaymentCount)}
            />
          </div>
        </div>

        <aside className="rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="size-4" />
            <h2 className="text-sm font-semibold">Workflow health</h2>
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
                Month and week view for tenant absence ranges.
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
          <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
            {isAdmin ? (
              <div className="rounded-lg border bg-card">
                <div className="border-b px-5 py-4">
                  <h2 className="font-semibold">Create tenant</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Email must match the tenant Google account.
                  </p>
                </div>
                <form action={createTenantAction} className="grid gap-4 p-5">
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="tenancyStartDate">Start</Label>
                      <Input
                        id="tenancyStartDate"
                        name="tenancyStartDate"
                        type="date"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tenancyEndDate">End</Label>
                      <Input
                        id="tenancyEndDate"
                        name="tenancyEndDate"
                        type="date"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" />
                  </div>
                  <Button type="submit">
                    <Users />
                    Add tenant
                  </Button>
                </form>
              </div>
            ) : null}

            <div className="rounded-lg border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Tenant roster</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Account linkage, email, and tenancy period.
                </p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tenancy</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tenants.length === 0 ? (
                      <TableRow>
                        <TableCell
                          className="h-24 text-muted-foreground"
                          colSpan={4}
                        >
                          No tenants yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.tenants.map((tenant) => (
                        <TableRow key={tenant.id}>
                          <TableCell className="font-medium">
                            {tenant.displayName}
                          </TableCell>
                          <TableCell>{tenant.email}</TableCell>
                          <TableCell>
                            {tenant.tenancyStartDate}
                            {tenant.tenancyEndDate
                              ? ` to ${tenant.tenancyEndDate}`
                              : " onwards"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={tenant.isLinked ? "default" : "outline"}
                            >
                              {tenant.isLinked ? "Linked" : "Invited"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent className="mt-4" value="billing">
          <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
            {isAdmin ? (
              <div className="rounded-lg border bg-card">
                <div className="border-b px-5 py-4">
                  <h2 className="font-semibold">Create bill</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Amount is stored in cents for stable allocation.
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="billStart">Start</Label>
                      <Input id="billStart" name="startDate" type="date" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="billEnd">End</Label>
                      <Input id="billEnd" name="endDate" type="date" />
                    </div>
                  </div>
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
                  <AlertTitle>Bill uploads disabled</AlertTitle>
                  <AlertDescription>
                    Add `BLOB_READ_WRITE_TOKEN` to enable Vercel Blob uploads.
                  </AlertDescription>
                </Alert>
              ) : null}

              {data.billingCycles.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/20 p-8">
                  <h2 className="font-semibold">No bills recorded</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add one billing cycle before running an allocation.
                  </p>
                </div>
              ) : null}

              {data.billingCycles.map((cycle) => (
                <article className="rounded-lg border bg-card" key={cycle.id}>
                  <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="font-semibold">{cycle.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {cycle.startDate} to {cycle.endDate} ·{" "}
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
                            Run allocation
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
                            Upload bill
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
                              <p className="font-medium">Allocation run</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDays(run.totalPresentDays)} present days ·{" "}
                                {run.status}
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
                                          <select
                                            className="h-8 rounded-md border bg-background px-2 text-sm"
                                            defaultValue={line.paymentStatus}
                                            name="status"
                                          >
                                            <option value="unpaid">Unpaid</option>
                                            <option value="partial">Partial</option>
                                            <option value="paid">Paid</option>
                                          </select>
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
                                            Save
                                          </Button>
                                        </form>
                                      ) : (
                                        <Badge variant="outline">
                                          {line.paymentStatus}
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
