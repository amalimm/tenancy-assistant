"use client"

import { CalendarDays, LayoutDashboard, ReceiptText, Settings } from "lucide-react"
import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const DASHBOARD_NAV_ITEM = {
  href: "/dashboard",
  icon: LayoutDashboard,
  label: "Dashboard",
} as const

const CALENDAR_NAV_ITEM = {
  href: "/dashboard/calendar",
  icon: CalendarDays,
  label: "Calendar",
} as const

const UTILITIES_NAV_ITEM = {
  href: "/dashboard/utilities",
  icon: ReceiptText,
  label: "Utilities",
} as const

const ADMIN_NAV_ITEM = {
  href: "/dashboard/admin",
  icon: Settings,
  label: "Admin",
} as const

const isActiveRoute = (pathname: string, href: string) => {
  if (href === "/dashboard") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const navItems = isAdmin
    ? [DASHBOARD_NAV_ITEM, CALENDAR_NAV_ITEM, UTILITIES_NAV_ITEM, ADMIN_NAV_ITEM]
    : [DASHBOARD_NAV_ITEM, CALENDAR_NAV_ITEM, UTILITIES_NAV_ITEM]

  return (
    <>
      <nav
        aria-label="Primary"
        className="hidden items-center gap-1 border-l pl-4 md:flex"
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = isActiveRoute(pathname, item.href)

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              href={item.href as Route}
              key={item.href}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur md:hidden"
      >
        <div
          className={cn("mx-auto grid max-w-7xl", isAdmin ? "grid-cols-4" : "grid-cols-3")}
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveRoute(pathname, item.href)

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[0.68rem] font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                href={item.href as Route}
                key={item.href}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
