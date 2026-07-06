import { Home } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { requireSession } from "@features/auth/auth-server"
import { SignInButton } from "@features/auth/sign-in-button"
import { ThemeToggle } from "@shared/ui/theme-toggle"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard">
              <Home />
              Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right text-sm sm:block">
              <p className="font-medium">{session.user.name}</p>
              <p className="text-muted-foreground">{session.user.email}</p>
            </div>
            <SignInButton mode="sign-out" />
          </div>
        </div>
      </header>
      {children}
    </main>
  )
}
