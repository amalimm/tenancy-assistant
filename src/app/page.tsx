import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { demoLogin, hasGoogleOAuthConfig } from "@config/env"
import { getSession } from "@features/auth/auth-server"
import { DemoSignInButton } from "@features/auth/demo-sign-in-button"
import { ThemeToggle } from "@shared/ui/theme-toggle"
import { HomeAuthTabs } from "./home-auth-tabs"

export default async function HomePage() {
  const session = await getSession()

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <section className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            href="/"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-foreground font-mono text-xs font-semibold text-background">
              TA
            </span>
            <span className="min-w-0 leading-none">
              <span className="block truncate text-sm font-semibold">
                Tenancy Assistant
              </span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                Household billing
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {session ? (
              <Button asChild variant="outline">
                <Link href="/dashboard">
                  Login
                  <ArrowRight />
                </Link>
              </Button>
            ) : null}
            <ThemeToggle />
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] lg:py-14">
          <section className="max-w-xl">
            <p className="text-sm font-medium text-muted-foreground">
              Private shared-house workspace
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.98] text-balance sm:text-6xl">
              Tenancy Assistant
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-muted-foreground">
              Track calendar dates, split electricity by occupancy, and keep
              tenant balances clear.
            </p>
          </section>

          <section
            aria-label={session ? "Continue to dashboard" : "Sign in"}
            className="mx-auto w-full max-w-md rounded-xl border bg-card p-5 sm:p-6 lg:mx-0"
          >
            {session ? (
              <div className="grid gap-4">
                <div>
                  <h2 className="text-base font-semibold">You are signed in</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Continue to your household dashboard.
                  </p>
                </div>
                <Button asChild className="h-10">
                  <Link href="/dashboard">
                    Login
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            ) : demoLogin ? (
              <DemoSignInButton {...demoLogin} />
            ) : (
              <HomeAuthTabs hasGoogleOAuthConfig={hasGoogleOAuthConfig} />
            )}
          </section>
        </div>
      </section>
    </main>
  )
}
