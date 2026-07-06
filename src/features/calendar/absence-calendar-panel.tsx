"use client"

import { useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import {
  AbsenceCalendar,
  type AbsenceCalendarRange,
  type AbsenceCalendarTenant,
} from "./absence-calendar"

const DATE_INPUT_LENGTH = 10
const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

const addDays = (dateValue: string, dayCount: number) => {
  const [year, month, day] = dateValue.split("-").map(Number)

  if (!year || !month || !day) {
    return ""
  }

  const date = new Date(Date.UTC(year, month - 1, day + dayCount))

  return date.toISOString().slice(0, DATE_INPUT_LENGTH)
}

const formatDateLabel = (dateValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number)

  if (!year || !month || !day) {
    return dateValue
  }

  return DATE_LABEL_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)))
}

const getInclusiveEndDate = (exclusiveEndDate: string) =>
  exclusiveEndDate ? addDays(exclusiveEndDate, -1) : ""

const getExclusiveEndDate = (inclusiveEndDate: string) =>
  inclusiveEndDate ? addDays(inclusiveEndDate, 1) : ""

const isValidExclusiveRange = (startDate: string, endDate: string) =>
  startDate.length >= DATE_INPUT_LENGTH &&
  endDate.length >= DATE_INPUT_LENGTH &&
  endDate > startDate

const formatRangeLabel = (startDate: string, exclusiveEndDate: string) => {
  if (!isValidExclusiveRange(startDate, exclusiveEndDate)) {
    return "No dates selected"
  }

  const inclusiveEndDate = getInclusiveEndDate(exclusiveEndDate)

  if (startDate === inclusiveEndDate) {
    return formatDateLabel(startDate)
  }

  return `${formatDateLabel(startDate)} to ${formatDateLabel(inclusiveEndDate)}`
}

export interface AbsenceCalendarPanelProps {
  absences: AbsenceCalendarRange[]
  canManageAll: boolean
  createAbsenceAction: (formData: FormData) => Promise<void>
  currentTenantId: string | null
  deleteAbsenceAction: (formData: FormData) => Promise<void>
  tenants: AbsenceCalendarTenant[]
  updateAbsenceAction: (formData: FormData) => Promise<void>
}

export function AbsenceCalendarPanel({
  absences,
  canManageAll,
  createAbsenceAction,
  currentTenantId,
  deleteAbsenceAction,
  tenants,
  updateAbsenceAction,
}: AbsenceCalendarPanelProps) {
  const createFormRef = useRef<HTMLFormElement>(null)
  const deleteFormRef = useRef<HTMLFormElement>(null)
  const updateFormRef = useRef<HTMLFormElement>(null)
  const firstTenantId = tenants[0]?.id ?? ""
  const defaultTenantId = currentTenantId ?? firstTenantId
  const [selectedTenantId, setSelectedTenantId] = useState(defaultTenantId)
  const [selectedStartDate, setSelectedStartDate] = useState("")
  const [selectedEndDate, setSelectedEndDate] = useState("")
  const [pendingDeleteId, setPendingDeleteId] = useState("")
  const [pendingUpdate, setPendingUpdate] = useState({
    absenceId: "",
    endDate: "",
    startDate: "",
  })
  const tenantOptions = useMemo(
    () => tenants.map((tenant) => ({ label: tenant.displayName, value: tenant.id })),
    [tenants],
  )
  const canEditCalendar = tenants.length > 0 && Boolean(defaultTenantId)
  const selectedTenantLabel =
    tenantOptions.find((tenant) => tenant.value === selectedTenantId)?.label ??
    "No tenant selected"
  const selectedInclusiveEndDate = getInclusiveEndDate(selectedEndDate)
  const hasValidSelectedRange = isValidExclusiveRange(
    selectedStartDate,
    selectedEndDate,
  )
  const selectedRangeLabel = formatRangeLabel(selectedStartDate, selectedEndDate)

  const handleSelectRange = (startDate: string, endDate: string) => {
    setSelectedStartDate(startDate)
    setSelectedEndDate(endDate)
  }

  const handleStartDateChange = (startDate: string) => {
    setSelectedStartDate(startDate)

    if (!startDate) {
      setSelectedEndDate("")
      return
    }

    if (!selectedEndDate || selectedEndDate <= startDate) {
      setSelectedEndDate(addDays(startDate, 1))
    }
  }

  const handleInclusiveEndDateChange = (inclusiveEndDate: string) => {
    setSelectedEndDate(getExclusiveEndDate(inclusiveEndDate))
  }

  const handleDeleteAbsence = (absenceId: string) => {
    setPendingDeleteId(absenceId)
    window.setTimeout(() => deleteFormRef.current?.requestSubmit(), 0)
  }

  const handleMoveAbsence = (
    absenceId: string,
    startDate: string,
    endDate: string,
  ) => {
    setPendingUpdate({ absenceId, endDate, startDate })
    window.setTimeout(() => updateFormRef.current?.requestSubmit(), 0)
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <AbsenceCalendar
        absences={absences}
        canEdit={canEditCalendar}
        currentTenantId={currentTenantId}
        onDeleteAbsence={handleDeleteAbsence}
        onMoveAbsence={handleMoveAbsence}
        onSelectRange={handleSelectRange}
      />

      <form
        action={createAbsenceAction}
        className="grid content-start gap-4 rounded-lg border bg-muted/20 p-4"
        ref={createFormRef}
      >
        <input name="startDate" type="hidden" value={selectedStartDate} />
        <input name="endDate" type="hidden" value={selectedEndDate} />
        <div>
          <p className="text-sm font-medium">New away range</p>
          <p className="mt-1 text-sm text-muted-foreground">{selectedRangeLabel}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="grid gap-2">
            <Label htmlFor="absenceStartDate">Away from</Label>
            <Input
              disabled={!canEditCalendar}
              id="absenceStartDate"
              onChange={(event) => handleStartDateChange(event.target.value)}
              type="date"
              value={selectedStartDate}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="absenceEndDate">Last day away</Label>
            <Input
              disabled={!canEditCalendar}
              id="absenceEndDate"
              min={selectedStartDate || undefined}
              onChange={(event) =>
                handleInclusiveEndDateChange(event.target.value)
              }
              type="date"
              value={selectedInclusiveEndDate}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenantId">Tenant</Label>
          {canManageAll ? (
            <select
              className="h-8 w-full rounded-md border bg-background px-2 text-sm"
              id="tenantId"
              name="tenantId"
              onChange={(event) => setSelectedTenantId(event.target.value)}
              value={selectedTenantId}
            >
              {tenantOptions.map((tenant) => (
                <option key={tenant.value} value={tenant.value}>
                  {tenant.label}
                </option>
              ))}
            </select>
          ) : (
            <>
              <Input readOnly value={selectedTenantLabel} />
              <input name="tenantId" type="hidden" value={currentTenantId ?? ""} />
            </>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            name="reason"
            placeholder="Optional"
            rows={1}
          />
        </div>
        {!canEditCalendar ? (
          <div className="rounded-md border border-dashed bg-background p-3 text-sm text-muted-foreground">
            A tenant record must exist before away ranges can be added.
          </div>
        ) : null}
        <Button
          disabled={!hasValidSelectedRange || !selectedTenantId}
          type="submit"
        >
          Add away range
        </Button>
      </form>

      <form action={deleteAbsenceAction} className="hidden" ref={deleteFormRef}>
        <input name="absenceId" readOnly value={pendingDeleteId} />
      </form>
      <form action={updateAbsenceAction} className="hidden" ref={updateFormRef}>
        <input name="absenceId" readOnly value={pendingUpdate.absenceId} />
        <input name="startDate" readOnly value={pendingUpdate.startDate} />
        <input name="endDate" readOnly value={pendingUpdate.endDate} />
      </form>
    </div>
  )
}
