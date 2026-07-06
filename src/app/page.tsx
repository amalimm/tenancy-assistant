import { CalendarDays, ReceiptText, ShieldCheck, Users } from "lucide-react"
import Link from "next/link"

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
import { Separator } from "@/components/ui/separator"
import { hasGoogleOAuthConfig } from "@config/env"
import { getSession } from "@features/auth/auth-server"
import { SignInButton } from "@features/auth/sign-in-button"
import { ThemeToggle } from "@shared/ui/theme-toggle"

const features = [
  {
    description: "Tenants drag across dates to mark when they are away.",
    icon: CalendarDays,
    title: "Away calendar",
  },
  {
    description: "Bills split by each tenant's present days in the billing cycle.",
    icon: ReceiptText,
    title: "Present-day billing",
  },
  {
    description: "Admin creates tenants; tenant accounts are linked by email.",
    icon: Users,
    title: "Admin-managed tenants",
  },
  {
    description: "CASL abilities keep admin and tenant actions separated.",
    icon: ShieldCheck,
    title: "Role permissions",
  },
] as const

export default async function HomePage() {
  const session = await getSession()

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Badge variant="secondary">Sarawak shared house utility tracker</Badge>
            <h1 className="mt-4 text-4xl font-semibold">
              Tenancy Assistant
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session ? (
              <Button asChild variant="outline">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <SignInButton disabled={!hasGoogleOAuthConfig} mode="sign-in" />
            )}
          </div>
        </header>

        {!hasGoogleOAuthConfig ? (
          <Alert className="mt-8">
            <ShieldCheck className="size-4" />
            <AlertTitle>Google OAuth is not configured</AlertTitle>
            <AlertDescription>
              Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL`,
              and `BETTER_AUTH_SECRET` before signing in.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1fr_420px]">
          <div className="max-w-2xl">
            <p className="text-lg leading-8 text-muted-foreground">
              Manage tenants in one house, record away days, upload electricity
              bills, calculate fair present-day shares, and track who has paid.
            </p>
            <Separator className="my-8" />
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon

                return (
                  <div className="flex gap-3" key={feature.title}>
                    <div className="mt-1 flex size-8 items-center justify-center rounded-md bg-secondary">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <h2 className="font-medium">{feature.title}</h2>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>V1 workflow</CardTitle>
              <CardDescription>
                Built for the first electricity-bill split feature.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>1. Admin signs in with Google.</p>
              <p>2. Admin creates the household and tenant emails.</p>
              <p>3. Tenants sign in and mark away ranges.</p>
              <p>4. Admin creates a billing cycle and runs allocation.</p>
              <p>5. Payments move from unpaid to partial or paid.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
