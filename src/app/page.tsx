import { ArrowRight, CheckCircle2, KeyRound, ReceiptText } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { hasGoogleOAuthConfig } from "@config/env"
import { getSession } from "@features/auth/auth-server"
import { SignInButton } from "@features/auth/sign-in-button"
import { TenantSignInForm } from "@features/auth/tenant-sign-in-form"
import { ThemeToggle } from "@shared/ui/theme-toggle"

const previewRows = [
  {
    amount: "RM 84.20",
    detail: "28 days present",
    name: "Alicia Tan",
    status: "Settled",
  },
  {
    amount: "RM 61.35",
    detail: "19 days present",
    name: "Ben Rahman",
    status: "Partial",
  },
  {
    amount: "RM 72.90",
    detail: "24 days present",
    name: "Mei Chen",
    status: "Open",
  },
] as const

export default async function HomePage() {
  const session = await getSession()

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,color-mix(in_oklch,var(--foreground)_5%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_5%,transparent)_1px,transparent_1px)] bg-[size:44px_44px] opacity-60"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--muted)_75%,transparent),transparent_68%)]"
      />

      <section className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            className="group flex items-center gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            href="/"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-foreground font-mono text-xs font-semibold text-background transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5">
              TA
            </span>
            <span className="leading-none">
              <span className="block text-sm font-semibold">
                Tenancy Assistant
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Household billing
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {session ? (
              <Button asChild variant="outline">
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRight />
                </Link>
              </Button>
            ) : null}
            <ThemeToggle />
          </div>
        </header>

        <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(440px,1fr)] lg:py-14">
          <section className="max-w-2xl">
            <Badge className="rounded-md" variant="outline">
              Private shared-house workspace
            </Badge>
            <h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-[0.96] text-balance sm:text-6xl lg:text-7xl">
              Tenancy Assistant
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground sm:text-lg">
              Track who was home, split bills by real occupancy, and keep
              tenant payments out of messy group chats.
            </p>

            <div className="mt-8 rounded-[2rem] bg-foreground/5 p-2 ring-1 ring-foreground/10">
              <div className="rounded-[1.5rem] bg-card p-5 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--background)_90%,transparent)] sm:p-6">
                {session ? (
                  <div className="grid gap-4">
                    <div>
                      <h2 className="text-base font-semibold">
                        You are signed in
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Continue to your household dashboard.
                      </p>
                    </div>
                    <Button asChild className="h-11 rounded-xl">
                      <Link href="/dashboard">
                        Open dashboard
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-5">
                    <TenantSignInForm />
                    <div className="grid gap-3 border-t pt-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <KeyRound className="size-3.5" />
                        Admin access uses Google SSO
                      </div>
                      <SignInButton
                        className="h-10 w-fit rounded-xl"
                        disabled={!hasGoogleOAuthConfig}
                        mode="sign-in"
                        variant="outline"
                      />
                      {!hasGoogleOAuthConfig ? (
                        <p className="text-xs leading-5 text-muted-foreground">
                          Google SSO is not configured for admins in this
                          environment.
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="rounded-[2.25rem] bg-foreground/5 p-2 ring-1 ring-foreground/10">
            <div className="overflow-hidden rounded-[1.75rem] bg-foreground text-background shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <div className="flex items-start justify-between gap-4 border-b border-background/10 p-6">
                <div>
                  <div className="flex items-center gap-2 text-xs text-background/60">
                    <ReceiptText className="size-4" />
                    July electricity
                  </div>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.01em]">
                    RM 218.45
                  </h2>
                </div>
                <Badge className="bg-background text-foreground">
                  Final split
                </Badge>
              </div>

              <div className="grid grid-cols-3 border-b border-background/10">
                {[
                  ["Away days", "17"],
                  ["Tenants", "3"],
                  ["Open", "1"],
                ].map(([label, value]) => (
                  <div className="p-5" key={label}>
                    <p className="text-xs text-background/55">{label}</p>
                    <p className="mt-2 font-mono text-2xl font-semibold">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 p-4 sm:p-5">
                {previewRows.map((tenant) => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-2xl bg-background/[0.07] px-4 py-3 ring-1 ring-background/10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5"
                    key={tenant.name}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {tenant.name}
                        </p>
                        {tenant.status === "Settled" ? (
                          <CheckCircle2 className="size-4 text-emerald-300" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-background/55">
                        {tenant.detail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold">
                        {tenant.amount}
                      </p>
                      <p className="mt-1 text-xs text-background/55">
                        {tenant.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
