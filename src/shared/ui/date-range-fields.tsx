"use client"

import { useState } from "react"

import { Label } from "@/components/ui/label"
import {
  DateRangePicker,
  type DateRangePickerValue,
} from "@shared/ui/date-range-picker"

export interface DateRangeFieldsProps {
  allowOpenRange?: boolean
  endName: string
  id: string
  label: string
  placeholder?: string
  startName: string
}

export function DateRangeFields({
  allowOpenRange = false,
  endName,
  id,
  label,
  placeholder,
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
        startDate={range.startDate}
        {...(placeholder ? { placeholder } : {})}
      />
    </div>
  )
}
