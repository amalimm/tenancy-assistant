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
    <main className="min-h-screen bg-muted/20 pb-14 text-foreground md:pb-0">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-4 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              className="flex min-w-0 items-center gap-2 rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50"
              href="/"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md border bg-muted font-mono text-[0.65rem] font-semibold text-foreground">
                TA
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-semibold leading-none">
                  Tenancy Assistant
                </span>
              </span>
            </Link>
            <AppNav isAdmin={isAdmin} />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="size-8 rounded-md" />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  aria-label="Open account menu"
                  className="h-8 gap-2 rounded-md px-2 font-normal"
                  size="sm"
                  variant="outline"
                >
                  <span className="grid size-5 place-items-center rounded bg-muted font-mono text-[0.62rem] font-semibold">
                    {userInitials}
                  </span>
                  <span className="hidden max-w-28 truncate sm:inline">
                    {session.user.name}
                  </span>
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
                      Account
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
      <div>{children}</div>
    </main>
  )
}
