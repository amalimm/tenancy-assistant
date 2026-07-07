import { Bolt, LayoutDashboard, Shield, UserRound } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { USER_ROLE } from "@db/schema"
import { AccountPasswordForm } from "@features/auth/account-password-form"
import { requireSession } from "@features/auth/auth-server"
import { SignInButton } from "@features/auth/sign-in-button"
import { ThemeToggle } from "@shared/ui/theme-toggle"

const getUserInitials = (displayName: string) => {
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase())
    .join("")

  return initials || "U"
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession()
  const userInitials = getUserInitials(session.user.name)
  const isAdmin = session.user.role === USER_ROLE.ADMIN

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-2">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50"
              href="/"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                TA
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-semibold">
                  Tenancy Assistant
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  Household operations
                </span>
              </span>
            </Link>
            <nav
              aria-label="Primary"
              className="hidden items-center gap-1 border-l pl-4 md:flex"
            >
              <Link
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-muted px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                href="/dashboard#overview"
              >
                <LayoutDashboard className="size-4" />
                Dashboard
              </Link>
              <Link
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                href="/dashboard#electric"
              >
                <Bolt className="size-4" />
                Electric
              </Link>
              {isAdmin ? (
                <Link
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  href="/dashboard#admin"
                >
                  <Shield className="size-4" />
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  aria-label="Open account menu"
                  className="rounded-full font-mono text-[0.68rem] font-semibold"
                  size="icon-lg"
                  variant="outline"
                >
                  {userInitials}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 gap-0 rounded-xl p-1.5 shadow-lg"
                sideOffset={8}
              >
                <div className="px-2.5 py-2">
                  <div className="flex items-start gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary font-mono text-xs font-semibold">
                      {userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {session.user.name}
                        </p>
                        <Badge variant="outline">
                          {isAdmin ? "Admin" : "Tenant"}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="my-1 h-px bg-border" />
                <div className="px-2.5 py-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <UserRound className="size-4 text-muted-foreground" />
                    Profile
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Account settings stay here. Household navigation stays in
                    the top bar.
                  </p>
                </div>
                <div className="my-1 h-px bg-border" />
                {isAdmin ? (
                  <div className="px-2.5 py-2 text-xs leading-5 text-muted-foreground">
                    Admin sign-in is managed by Google. Tenant password resets
                    are available in the Admin section.
                  </div>
                ) : (
                  <AccountPasswordForm />
                )}
                <div className="my-1 h-px bg-border" />
                <nav aria-label="Account actions" className="grid gap-0.5">
                  <SignInButton
                    className="h-8 w-full justify-start rounded-md px-2 text-sm font-normal"
                    mode="sign-out"
                    variant="ghost"
                  />
                </nav>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>
      <div className="motion-fade-up">{children}</div>
    </main>
  )
}
