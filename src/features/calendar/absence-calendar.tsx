"use client"

import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import type {
  DateSelectArg,
  EventChangeArg,
  EventClickArg,
  EventInput,
} from "@fullcalendar/core"

import { Badge } from "@/components/ui/badge"

export interface AbsenceCalendarTenant {
  displayName: string
  id: string
}

export interface AbsenceCalendarRange {
  displayName: string
  endDate: string
  id: string
  reason: string | null
  startDate: string
  tenantId: string
}

export interface AbsenceCalendarProps {
  absences: AbsenceCalendarRange[]
  canEdit: boolean
  currentTenantId: string | null
  onDeleteAbsence: (absenceId: string) => void
  onMoveAbsence: (absenceId: string, startDate: string, endDate: string) => void
  onSelectRange: (startDate: string, endDate: string) => void
}

const toDateOnly = (dateValue: string) => dateValue.slice(0, 10)

const toEvents = (absences: AbsenceCalendarRange[]): EventInput[] =>
  absences.map((absence) => ({
    id: absence.id,
    title: `${absence.displayName}${absence.reason ? ` - ${absence.reason}` : ""}`,
    start: absence.startDate,
    end: absence.endDate,
    allDay: true,
    extendedProps: {
      tenantId: absence.tenantId,
    },
  }))

export function AbsenceCalendar({
  absences,
  canEdit,
  currentTenantId,
  onDeleteAbsence,
  onMoveAbsence,
  onSelectRange,
}: AbsenceCalendarProps) {
  const handleSelect = (selection: DateSelectArg) => {
    if (!canEdit) {
      return
    }

    onSelectRange(toDateOnly(selection.startStr), toDateOnly(selection.endStr))
  }

  const handleEventClick = (click: EventClickArg) => {
    if (!canEdit) {
      return
    }

    const shouldDelete = window.confirm("Delete this away range?")

    if (shouldDelete) {
      onDeleteAbsence(click.event.id)
    }
  }

  const handleEventChange = (change: EventChangeArg) => {
    if (!canEdit) {
      return
    }

    const startDate = change.event.startStr
    const endDate = change.event.endStr

    if (startDate.length === 0 || endDate.length === 0) {
      change.revert()
      return
    }

    onMoveAbsence(change.event.id, toDateOnly(startDate), toDateOnly(endDate))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Away calendar</Badge>
        {currentTenantId ? <Badge variant="outline">Tenant linked</Badge> : null}
      </div>
      <FullCalendar
        editable={canEdit}
        eventLongPressDelay={100}
        eventChange={handleEventChange}
        eventClick={handleEventClick}
        events={toEvents(absences)}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        }}
        height="auto"
        initialView="dayGridMonth"
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        selectable={canEdit}
        selectLongPressDelay={100}
        selectMirror
        select={handleSelect}
      />
    </div>
  )
}
