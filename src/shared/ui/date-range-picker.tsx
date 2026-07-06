"use client"

import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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

export interface DateRangePickerProps {
  allowOpenRange?: boolean
  className?: string
  disabled?: boolean
  endDate: string
  id?: string
  onRangeChange: (value: DateRangePickerValue) => void
  placeholder?: string
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
  disabled = false,
  endDate,
  id,
  onRangeChange,
  placeholder = "Select dates",
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
          mode="range"
          numberOfMonths={1}
          onSelect={handleSelect}
          resetOnSelect
          selected={selectedRange}
        />
      </PopoverContent>
    </Popover>
  )
}
