"use client"

import { useState } from "react"

import { Label } from "@/components/ui/label"
import {
  DateRangePicker,
  type CalendarDensity,
  type DateRangePickerValue,
} from "@shared/ui/date-range-picker"

export interface DateRangeFieldsProps {
  allowOpenRange?: boolean
  calendarDensity?: CalendarDensity
  endName: string
  id: string
  label: string
  numberOfMonths?: number
  placeholder?: string
  requireCompleteRange?: boolean
  startName: string
}

export function DateRangeFields({
  allowOpenRange = false,
  calendarDensity,
  endName,
  id,
  label,
  numberOfMonths,
  placeholder,
  requireCompleteRange = false,
  startName,
}: DateRangeFieldsProps) {
  const [range, setRange] = useState<DateRangePickerValue>({
    endDate: "",
    startDate: "",
  })

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <input name={startName} type="hidden" value={range.startDate} />
      <input name={endName} type="hidden" value={range.endDate} />
      <DateRangePicker
        allowOpenRange={allowOpenRange}
        endDate={range.endDate}
        id={id}
        onRangeChange={setRange}
        requireCompleteRange={requireCompleteRange}
        startDate={range.startDate}
        {...(calendarDensity ? { calendarDensity } : {})}
        {...(numberOfMonths ? { numberOfMonths } : {})}
        {...(placeholder ? { placeholder } : {})}
      />
    </div>
  )
}
