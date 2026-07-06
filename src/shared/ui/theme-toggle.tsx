"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useId, useState } from "react"
import { useTheme } from "next-themes"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const switchId = useId()
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className={cn(
        "flex items-center",
        compact
          ? "justify-between gap-3 rounded-md px-2 py-1.5"
          : "gap-2 rounded-md border bg-background px-2 py-1.5",
      )}
    >
      {compact ? (
        <Label className="text-sm" htmlFor={switchId}>
          Dark mode
        </Label>
      ) : (
        <Sun className="size-3.5 text-muted-foreground" />
      )}
      <Switch
        aria-label="Toggle dark mode"
        checked={mounted ? isDark : false}
        id={switchId}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        size={compact ? "sm" : "default"}
      />
      {compact ? null : <Moon className="size-3.5 text-muted-foreground" />}
      {compact ? null : (
        <Label className="sr-only" htmlFor={switchId}>
          Dark mode
        </Label>
      )}
    </div>
  )
}
