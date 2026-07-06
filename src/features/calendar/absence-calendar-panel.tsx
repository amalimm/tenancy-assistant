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
  const selectedRangeLabel =
    selectedStartDate && selectedEndDate
      ? `${selectedStartDate} to ${selectedEndDate}`
      : "No range selected"

  const handleSelectRange = (startDate: string, endDate: string) => {
    setSelectedStartDate(startDate)
    setSelectedEndDate(endDate)
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
          disabled={!selectedStartDate || !selectedEndDate || !selectedTenantId}
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
