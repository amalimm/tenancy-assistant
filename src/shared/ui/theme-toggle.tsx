"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    setMounted(true)
  }, [])

  const nextTheme = mounted && isDark ? "light" : "dark"
  const Icon = mounted && isDark ? Moon : Sun

  return (
    <Button
      aria-label={`Switch to ${nextTheme} mode`}
      className={cn("rounded-full", className)}
      onClick={() => setTheme(nextTheme)}
      size="icon-lg"
      type="button"
      variant="outline"
    >
      <Icon className="size-4" />
    </Button>
  )
}
