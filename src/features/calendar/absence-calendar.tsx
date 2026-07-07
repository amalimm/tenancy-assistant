"use client"

import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import FullCalendar from "@fullcalendar/react"
import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core"
import { ChevronLeft, ChevronRight, UserPlus } from "lucide-react"
import { useMemo, useRef, useState } from "react"

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

export interface AbsenceCalendarEmptyState {
  actionLabel?: string
  description: string
  onAction?: () => void
  title: string
}

export interface AbsenceCalendarDraftRange {
  endDate: string
  startDate: string
}

export interface AbsenceCalendarMoveInput {
  absenceId: string
  endDate: string
  startDate: string
}

export interface AbsenceCalendarProps {
  absences: AbsenceCalendarRange[]
  canEdit: boolean
  currentTenantId: string | null
  draftRange?: AbsenceCalendarDraftRange | null
  emptyState?: AbsenceCalendarEmptyState | null
  onDeleteAbsence: (absenceId: string) => void
  onMoveAbsence: (move: AbsenceCalendarMoveInput) => Promise<void> | void
  onSelectRange: (startDate: string, endDate: string) => void
}

const toDateOnly = (dateValue: string) => dateValue.slice(0, 10)

const DRAFT_SELECTION_EVENT_ID = "calendar-draft-selection"

const CALENDAR_NAV_ACTION = {
  NEXT: "next",
  PREVIOUS: "previous",
  TODAY: "today",
} as const

type CalendarNavAction =
  (typeof CALENDAR_NAV_ACTION)[keyof typeof CALENDAR_NAV_ACTION]

const isValidDraftRange = (
  draftRange: AbsenceCalendarDraftRange | null | undefined,
) =>
  Boolean(
    draftRange &&
      draftRange.startDate.length >= 10 &&
      draftRange.endDate.length >= 10 &&
      draftRange.endDate > draftRange.startDate,
  )

const isDraftEventId = (eventId: string) => eventId === DRAFT_SELECTION_EVENT_ID

const toEvents = (
  absences: AbsenceCalendarRange[],
  draftRange: AbsenceCalendarDraftRange | null | undefined,
): EventInput[] => {
  const events = absences.map<EventInput>((absence) => ({
    id: absence.id,
    title: `${absence.displayName}${absence.reason ? ` - ${absence.reason}` : ""}`,
    start: absence.startDate,
    end: absence.endDate,
    allDay: true,
    extendedProps: {
      tenantId: absence.tenantId,
    },
  }))

  if (isValidDraftRange(draftRange) && draftRange) {
    events.push({
      allDay: true,
      classNames: ["calendar-draft-event"],
      editable: false,
      end: draftRange.endDate,
      id: DRAFT_SELECTION_EVENT_ID,
      start: draftRange.startDate,
      title: "Selected dates",
    })
  }

  return events
}

export function AbsenceCalendar({
  absences,
  canEdit,
  currentTenantId,
  draftRange = null,
  emptyState = null,
  onDeleteAbsence,
  onMoveAbsence,
  onSelectRange,
}: AbsenceCalendarProps) {
  const calendarRef = useRef<FullCalendar | null>(null)
  const [calendarTitle, setCalendarTitle] = useState("Calendar")
  const calendarEvents = useMemo(
    () => toEvents(absences, draftRange),
    [absences, draftRange],
  )

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
    if (!canEdit || isDraftEventId(click.event.id)) {
      return
    }

    onDeleteAbsence(click.event.id)
  }

  const handleEventDrop = (drop: EventDropArg) => {
    if (!canEdit) {
      drop.revert()
      return
    }

    if (isDraftEventId(drop.event.id)) {
      drop.revert()
      return
    }

    const startDate = drop.event.startStr
    const endDate = drop.event.endStr

    if (startDate.length === 0 || endDate.length === 0) {
      drop.revert()
      return
    }

    void Promise.resolve(
      onMoveAbsence({
        absenceId: drop.event.id,
        endDate: toDateOnly(endDate),
        startDate: toDateOnly(startDate),
      }),
    ).catch(() => drop.revert())
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
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Badge variant="secondary">Calendar</Badge>
          {currentTenantId ? <Badge variant="outline">Your profile</Badge> : null}
        </div>
      </div>
      <div className="relative overflow-hidden rounded-lg">
        <div
          aria-hidden={!canEdit && emptyState ? true : undefined}
          className={!canEdit && emptyState ? "pointer-events-none opacity-45" : undefined}
        >
          <FullCalendar
            datesSet={handleDatesSet}
            editable={canEdit}
            eventLongPressDelay={100}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            events={calendarEvents}
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
        {!canEdit && emptyState ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/75 p-5 backdrop-blur-[1px]">
            <div className="grid max-w-xs justify-items-center rounded-lg border bg-card p-4 text-center shadow-sm">
              <div className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                <UserPlus className="size-4" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{emptyState.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {emptyState.description}
              </p>
              {emptyState.onAction && emptyState.actionLabel ? (
                <Button
                  className="mt-4"
                  onClick={emptyState.onAction}
                  type="button"
                >
                  {emptyState.actionLabel}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
