"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import {
  CALENDAR_COLOR_OPTIONS,
  normalizeCalendarColor,
} from "./calendar-colors"

export function CalendarColorForm({
  action,
  className,
  currentColor,
}: {
  action: (formData: FormData) => Promise<void>
  className?: string
  currentColor: string
}) {
  const normalizedCurrentColor =
    normalizeCalendarColor(currentColor) ?? CALENDAR_COLOR_OPTIONS[0].value
  const [selectedColor, setSelectedColor] = useState<string>(normalizedCurrentColor)
  const [hexValue, setHexValue] = useState<string>(normalizedCurrentColor)
  const normalizedHexValue = normalizeCalendarColor(hexValue)
  const isValidHexValue = Boolean(normalizedHexValue)

  const handleSelectColor = (color: string) => {
    const normalizedColor = normalizeCalendarColor(color)

    if (!normalizedColor) {
      return
    }

    setSelectedColor(normalizedColor)
    setHexValue(normalizedColor)
  }

  return (
    <form action={action} className={cn("grid gap-4", className)}>
      <input name="calendarColor" type="hidden" value={selectedColor} />
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Calendar color</legend>
        <div className="flex flex-wrap gap-2">
          {CALENDAR_COLOR_OPTIONS.map((option) => (
            <button
              aria-label={option.label}
              aria-pressed={option.value === selectedColor}
              className="size-9 rounded-lg border border-foreground/10 ring-offset-2 transition outline-none hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:ring-2 aria-pressed:ring-ring"
              key={option.value}
              onClick={() => handleSelectColor(option.value)}
              style={{ backgroundColor: option.value }}
              title={option.label}
              type="button"
            />
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
        <div className="grid gap-2">
          <Label htmlFor="calendarColorPicker">Custom</Label>
          <Input
            className="h-10 w-16 cursor-pointer p-1"
            id="calendarColorPicker"
            onChange={(event) => handleSelectColor(event.target.value)}
            type="color"
            value={selectedColor}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="calendarColorHex">Hex</Label>
          <Input
            aria-invalid={!isValidHexValue}
            id="calendarColorHex"
            inputMode="text"
            maxLength={7}
            onBlur={() => {
              if (normalizedHexValue) {
                handleSelectColor(normalizedHexValue)
              }
            }}
            onChange={(event) => {
              const nextValue = event.target.value
              const normalizedColor = normalizeCalendarColor(nextValue)

              setHexValue(nextValue)

              if (normalizedColor) {
                setSelectedColor(normalizedColor)
              }
            }}
            placeholder="#55725b"
            value={hexValue}
          />
        </div>
      </div>

      <p className="text-sm leading-6 text-muted-foreground">
        Used for your calendar entries.
      </p>
      <Button
        className="w-fit"
        disabled={!isValidHexValue}
        size="sm"
        type="submit"
      >
        Save color
      </Button>
    </form>
  )
}
