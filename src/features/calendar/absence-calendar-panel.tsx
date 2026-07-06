"use client"

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
import { DASHBOARD_TAB, useDashboardTabs } from "@features/dashboard/dashboard-tabs"
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
  const { setActiveTab } = useDashboardTabs()
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
    ? "Add a tenant before saving away dates."
    : "Ask an admin to add your tenant profile."
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
      <AbsenceCalendar
        absences={absences}
        canEdit={canEditCalendar}
        currentTenantId={currentTenantId}
        emptyState={
          canEditCalendar
            ? null
            : {
                actionLabel: canManageAll ? "Add tenant" : "View tenants",
                description: disabledCalendarMessage,
                onAction: () => setActiveTab(DASHBOARD_TAB.TENANTS),
                title: "No tenants yet",
              }
        }
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
              This removes it from the calendar.
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
