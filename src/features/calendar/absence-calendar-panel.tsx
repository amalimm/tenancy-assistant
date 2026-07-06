"use client"

import { CircleAlert } from "lucide-react"
import { useMemo, useRef, useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangePicker } from "@shared/ui/date-range-picker"

import {
  AbsenceCalendar,
  type AbsenceCalendarRange,
  type AbsenceCalendarTenant,
} from "./absence-calendar"

const isValidExclusiveRange = (startDate: string, endDate: string) =>
  startDate.length >= 10 &&
  endDate.length >= 10 &&
  endDate > startDate

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
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
  const disabledCalendarMessage = canManageAll
    ? "Create at least one tenant in the Tenants tab before recording away dates."
    : "Ask a household admin to add a tenant record for your sign-in email before recording away dates."
  const selectedTenantLabel =
    tenantOptions.find((tenant) => tenant.value === selectedTenantId)?.label ??
    "No tenant selected"
  const hasValidSelectedRange = isValidExclusiveRange(
    selectedStartDate,
    selectedEndDate,
  )

  const handleSelectRange = (startDate: string, endDate: string) => {
    setSelectedStartDate(startDate)
    setSelectedEndDate(endDate)
  }

  const handleDeleteAbsence = (absenceId: string) => {
    setPendingDeleteId(absenceId)
    setDeleteDialogOpen(true)
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
      {!canEditCalendar ? (
        <div className="flex items-start gap-3 rounded-lg border border-dashed bg-muted/20 p-4 xl:col-span-2">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Calendar setup required</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Away ranges are saved against a tenant record, so the calendar is
              read-only until a tenant exists. {disabledCalendarMessage}
            </p>
          </div>
        </div>
      ) : null}
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
        <div className="grid gap-2">
          <p className="text-sm font-medium">New away range</p>
          <DateRangePicker
            disabled={!canEditCalendar}
            endDate={selectedEndDate}
            id="absenceDateRange"
            onRangeChange={(range) => {
              setSelectedStartDate(range.startDate)
              setSelectedEndDate(range.endDate)
            }}
            placeholder="Select away dates"
            startDate={selectedStartDate}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenantId">Tenant</Label>
          {canManageAll ? (
            <Select
              name="tenantId"
              onValueChange={setSelectedTenantId}
              value={selectedTenantId}
            >
              <SelectTrigger className="w-full" id="tenantId">
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenantOptions.map((tenant) => (
                  <SelectItem key={tenant.value} value={tenant.value}>
                    {tenant.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            {disabledCalendarMessage}
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
      <AlertDialog
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete away range?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the selected away range from the calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              onClick={() => deleteFormRef.current?.requestSubmit()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <form action={updateAbsenceAction} className="hidden" ref={updateFormRef}>
        <input name="absenceId" readOnly value={pendingUpdate.absenceId} />
        <input name="startDate" readOnly value={pendingUpdate.startDate} />
        <input name="endDate" readOnly value={pendingUpdate.endDate} />
      </form>
    </div>
  )
}
