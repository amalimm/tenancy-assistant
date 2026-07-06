"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
      <Sun className="size-3.5 text-muted-foreground" />
      <Switch
        aria-label="Toggle dark mode"
        checked={mounted ? isDark : false}
        id="theme-toggle"
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <Moon className="size-3.5 text-muted-foreground" />
      <Label className="sr-only" htmlFor="theme-toggle">
        Dark mode
      </Label>
    </div>
  )
}
