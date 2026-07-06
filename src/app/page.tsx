import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CircleDollarSign,
  ReceiptText,
  Users,
} from "lucide-react"
import Link from "next/link"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { hasGoogleOAuthConfig } from "@config/env"
import { getSession } from "@features/auth/auth-server"
import { SignInButton } from "@features/auth/sign-in-button"
import { ThemeToggle } from "@shared/ui/theme-toggle"

const features = [
  {
    description: "Mark away days from the calendar or date fields.",
    icon: CalendarDays,
    title: "Away dates",
  },
  {
    description: "Split electricity bills by days at home.",
    icon: ReceiptText,
    title: "Fair bill splits",
  },
  {
    description: "Track unpaid, partial, and settled shares in one place.",
    icon: CircleDollarSign,
    title: "Payment tracking",
  },
  {
    description: "Set permissions for admins and tenants.",
    icon: Users,
    title: "Household roles",
  },
] as const

const previewTenants = [
  {
    amount: "RM 72.40",
    days: "24 days",
    name: "Maya",
    status: "Paid",
  },
  {
    amount: "RM 81.95",
    days: "27 days",
    name: "Daniel",
    status: "Partial",
  },
  {
    amount: "RM 63.10",
    days: "21 days",
    name: "Aina",
    status: "Unpaid",
  },
] as const

export default async function HomePage() {
  const session = await getSession()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            className="text-sm font-semibold tracking-wide"
            href="/"
          >
            Tenancy Assistant
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session ? (
              <Badge variant="outline">Signed in</Badge>
            ) : (
              <SignInButton disabled={!hasGoogleOAuthConfig} mode="sign-in" />
            )}
          </div>
        </header>

        {!hasGoogleOAuthConfig ? (
          <Alert className="mt-6 max-w-3xl">
            <CircleAlert className="size-4" />
            <AlertTitle>Sign-in unavailable</AlertTitle>
            <AlertDescription>
              Ask your household admin for access.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_440px]">
          <section className="max-w-2xl">
            <Badge variant="secondary">Shared-house billing</Badge>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.05] text-balance sm:text-6xl">
              Tenancy Assistant
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Track away dates, split bills, and settle payments.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {session ? (
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    Open dashboard
                    <ArrowRight />
                  </Link>
                </Button>
              ) : (
                <SignInButton disabled={!hasGoogleOAuthConfig} mode="sign-in" />
              )}
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon

                return (
                  <article className="flex gap-3" key={feature.title}>
                    <div className="mt-1 flex size-9 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <h2 className="font-semibold">{feature.title}</h2>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <aside
            className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
            id="house-view"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current cycle
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  July electricity
                </h2>
              </div>
              <Badge variant="outline">Ready to settle</Badge>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-y py-4">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="mt-1 font-mono text-lg font-semibold">RM 217.45</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Away days</p>
                <p className="mt-1 font-mono text-lg font-semibold">13</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Open</p>
                <p className="mt-1 font-mono text-lg font-semibold">2</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {previewTenants.map((tenant) => (
                <div
                  className="grid grid-cols-[1fr_auto] gap-3 rounded-lg bg-muted/40 px-3 py-3"
                  key={tenant.name}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{tenant.name}</p>
                      {tenant.status === "Paid" ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tenant.days} at home
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold">{tenant.amount}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tenant.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
