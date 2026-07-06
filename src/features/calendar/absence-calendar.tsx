"use client"

import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import FullCalendar from "@fullcalendar/react"
import type {
  DateSelectArg,
  DatesSetArg,
  EventChangeArg,
  EventClickArg,
  EventInput,
} from "@fullcalendar/core"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Move,
  MousePointer2,
  Trash2,
} from "lucide-react"
import { useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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

const CALENDAR_NAV_ACTION = {
  NEXT: "next",
  PREVIOUS: "previous",
  TODAY: "today",
} as const

type CalendarNavAction =
  (typeof CALENDAR_NAV_ACTION)[keyof typeof CALENDAR_NAV_ACTION]

const calendarHelpItems = [
  {
    description: "Drag across calendar days to prefill the new away range.",
    icon: MousePointer2,
    title: "Select dates",
  },
  {
    description: "Choose the tenant, add an optional reason, then save the range.",
    icon: CalendarDays,
    title: "Add details",
  },
  {
    description: "Drag an existing block to move it, or click it to delete it.",
    icon: Move,
    title: "Edit entries",
  },
] as const

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
  const calendarRef = useRef<FullCalendar | null>(null)
  const [calendarTitle, setCalendarTitle] = useState("Calendar")

  const handleCalendarNav = (action: CalendarNavAction) => {
    const calendarApi = calendarRef.current?.getApi()

    if (!calendarApi) {
      return
    }

    if (action === CALENDAR_NAV_ACTION.PREVIOUS) {
      calendarApi.prev()
      return
    }

    if (action === CALENDAR_NAV_ACTION.NEXT) {
      calendarApi.next()
      return
    }

    calendarApi.today()
  }

  const handleDatesSet = (dateInfo: DatesSetArg) => {
    setCalendarTitle(dateInfo.view.title)
  }

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

    onDeleteAbsence(click.event.id)
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
      <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-1.5">
          <Button
            aria-label="Previous month"
            onClick={() => handleCalendarNav(CALENDAR_NAV_ACTION.PREVIOUS)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <ChevronLeft />
          </Button>
          <Button
            onClick={() => handleCalendarNav(CALENDAR_NAV_ACTION.TODAY)}
            size="sm"
            type="button"
            variant="outline"
          >
            Today
          </Button>
          <Button
            aria-label="Next month"
            onClick={() => handleCalendarNav(CALENDAR_NAV_ACTION.NEXT)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="flex items-center justify-start gap-3 md:justify-center">
          <h3 className="text-base font-semibold">{calendarTitle}</h3>
          <CalendarHelpGuide />
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Badge variant="secondary">Away calendar</Badge>
          {currentTenantId ? <Badge variant="outline">Tenant linked</Badge> : null}
        </div>
      </div>
      <FullCalendar
        datesSet={handleDatesSet}
        editable={canEdit}
        eventLongPressDelay={100}
        eventChange={handleEventChange}
        eventClick={handleEventClick}
        events={toEvents(absences)}
        headerToolbar={false}
        height="auto"
        initialView="dayGridMonth"
        plugins={[dayGridPlugin, interactionPlugin]}
        ref={calendarRef}
        selectable={canEdit}
        selectLongPressDelay={100}
        selectMirror
        select={handleSelect}
      />
    </div>
  )
}

function CalendarHelpGuide() {
  return (
    <div className="group/help relative">
      <button
        className="rounded-sm border-b border-dotted border-muted-foreground/70 pb-0.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:border-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        type="button"
      >
        Help Guide
      </button>
      <div
        className="pointer-events-none absolute left-1/2 top-full z-30 mt-3 hidden w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border bg-popover p-3 text-left text-popover-foreground shadow-lg ring-1 ring-foreground/10 group-focus-within/help:block group-hover/help:block"
        role="tooltip"
      >
        <div className="flex items-start gap-2 border-b pb-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
            <CalendarDays className="size-4" />
          </div>
          <div>
            <p className="font-medium">Using the away calendar</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Ranges end on the return date, so the return day is not counted.
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-2">
          {calendarHelpItems.map((item) => {
            const Icon = item.icon

            return (
              <div className="flex gap-2" key={item.title}>
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium leading-5">{item.title}</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-md bg-muted/50 p-2 text-xs leading-5 text-muted-foreground">
          <Trash2 className="mt-0.5 size-3.5 shrink-0" />
          <p>Deleting asks for confirmation before the range is removed.</p>
        </div>
      </div>
    </div>
  )
}
