"use client"

import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import {
  Calendar,
  type CalendarDensity,
} from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  addLocalDays,
  formatLocalDate,
  parseLocalDate,
  toLocalDateValue,
} from "@shared/lib/format"

export interface DateRangePickerValue {
  endDate: string
  startDate: string
}

export type { CalendarDensity }

export interface DateRangePickerProps {
  allowOpenRange?: boolean
  className?: string
  disabled?: boolean
  endDate: string
  id?: string
  calendarDensity?: CalendarDensity
  numberOfMonths?: number
  onRangeChange: (value: DateRangePickerValue) => void
  placeholder?: string
  requireCompleteRange?: boolean
  startDate: string
}

const getInclusiveEndDate = (exclusiveEndDate: string) =>
  exclusiveEndDate ? addLocalDays(exclusiveEndDate, -1) : ""

const getSelectedRange = (
  startDate: string,
  exclusiveEndDate: string,
): DateRange | undefined => {
  const from = parseLocalDate(startDate)

  if (!from) {
    return undefined
  }

  const inclusiveEndDate = getInclusiveEndDate(exclusiveEndDate)
  const to = inclusiveEndDate ? parseLocalDate(inclusiveEndDate) : null

  return to ? { from, to } : { from }
}

const formatRangeLabel = (
  startDate: string,
  exclusiveEndDate: string,
  placeholder: string,
) => {
  if (!startDate) {
    return placeholder
  }

  if (!exclusiveEndDate) {
    return `${formatLocalDate(startDate)} onwards`
  }

  const inclusiveEndDate = getInclusiveEndDate(exclusiveEndDate)

  if (startDate === inclusiveEndDate) {
    return formatLocalDate(startDate)
  }

  return `${formatLocalDate(startDate)} to ${formatLocalDate(inclusiveEndDate)}`
}

export function DateRangePicker({
  allowOpenRange = false,
  className,
  calendarDensity,
  disabled = false,
  endDate,
  id,
  numberOfMonths = 1,
  onRangeChange,
  placeholder = "Select dates",
  requireCompleteRange = false,
  startDate,
}: DateRangePickerProps) {
  const selectedRange = getSelectedRange(startDate, endDate)
  const label = formatRangeLabel(startDate, endDate, placeholder)

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      onRangeChange({ endDate: "", startDate: "" })
      return
    }

    const nextStartDate = toLocalDateValue(range.from)

    if (requireCompleteRange && !range.to) {
      onRangeChange({ endDate: "", startDate: nextStartDate })
      return
    }

    const inclusiveEndDate = range.to ? toLocalDateValue(range.to) : ""
    const nextEndDate = inclusiveEndDate
      ? addLocalDays(inclusiveEndDate, 1)
      : allowOpenRange
        ? ""
        : addLocalDays(nextStartDate, 1)

    onRangeChange({
      endDate: nextEndDate,
      startDate: nextStartDate,
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "w-full justify-start text-left font-normal",
            !startDate && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
          id={id}
          type="button"
          variant="outline"
        >
          <CalendarIcon />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          {...(calendarDensity ? { density: calendarDensity } : {})}
          fixedWeeks
          mode="range"
          numberOfMonths={numberOfMonths}
          onSelect={handleSelect}
          resetOnSelect
          selected={selectedRange}
        />
      </PopoverContent>
    </Popover>
  )
}
