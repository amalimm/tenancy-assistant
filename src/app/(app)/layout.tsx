import { Home, LayoutDashboard, Menu } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { requireSession } from "@features/auth/auth-server"
import { SignInButton } from "@features/auth/sign-in-button"
import { ThemeToggle } from "@shared/ui/theme-toggle"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession()

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
              className="hidden items-center border-l pl-4 md:flex"
            >
              <Link
                aria-current="page"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-muted px-2.5 text-sm font-medium text-foreground"
                href="/dashboard"
              >
                <LayoutDashboard className="size-4" />
                Dashboard
              </Link>
            </nav>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                aria-label="Open account menu"
                className="gap-2"
                size="sm"
                variant="outline"
              >
                <Menu className="size-4" />
                <span className="hidden sm:inline">Menu</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 gap-0 p-0">
              <div className="border-b p-3">
                <p className="truncate text-sm font-medium">{session.user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
              <nav aria-label="Account menu" className="grid gap-1 p-2">
                <Link
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  href="/"
                >
                  <Home className="size-4 text-muted-foreground" />
                  Home
                </Link>
                <Link
                  aria-current="page"
                  className="flex items-center gap-2 rounded-md bg-muted px-2 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  href="/dashboard"
                >
                  <LayoutDashboard className="size-4 text-muted-foreground" />
                  Dashboard
                </Link>
              </nav>
              <div className="grid gap-2 border-t p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Theme</span>
                  <ThemeToggle />
                </div>
                <SignInButton className="w-full justify-start" mode="sign-out" />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>
      {children}
    </main>
  )
}
