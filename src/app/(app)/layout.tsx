import { UserRound } from "lucide-react"
import type { Route } from "next"
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
import { requireSession } from "@features/auth/auth-server"
import { SignInButton } from "@features/auth/sign-in-button"
import { AppNav } from "@features/navigation/app-nav"
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
            <AppNav isAdmin={isAdmin} />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  aria-label="Open account menu"
                  className="rounded-lg font-mono text-[0.68rem] font-semibold"
                  size="icon-lg"
                  variant="outline"
                >
                  {userInitials}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-72 gap-0 rounded-xl p-1.5 shadow-lg"
                sideOffset={8}
              >
                <div className="rounded-lg px-2.5 py-2">
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
                <nav aria-label="Account actions" className="grid gap-0.5">
                  <Button
                    asChild
                    className="h-8 w-full justify-start rounded-md px-2 text-sm font-normal"
                    variant="ghost"
                  >
                    <Link href={"/account" as Route}>
                      <UserRound />
                      Profile
                    </Link>
                  </Button>
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
