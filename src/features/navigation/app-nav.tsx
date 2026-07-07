"use client"

import { LayoutDashboard, Settings, Zap } from "lucide-react"
import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const DASHBOARD_NAV_ITEM = {
  href: "/dashboard",
  icon: LayoutDashboard,
  label: "Dashboard",
} as const

const ELECTRICITY_NAV_ITEM = {
  href: "/dashboard/electricity",
  icon: Zap,
  label: "Electricity",
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
    ? [DASHBOARD_NAV_ITEM, ELECTRICITY_NAV_ITEM, ADMIN_NAV_ITEM]
    : [DASHBOARD_NAV_ITEM, ELECTRICITY_NAV_ITEM]

  return (
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
  )
}
