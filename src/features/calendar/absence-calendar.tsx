"use client"

import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import FullCalendar from "@fullcalendar/react"
import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventDropArg,
  EventHoveringArg,
  EventInput,
} from "@fullcalendar/core"
import type { EventResizeDoneArg } from "@fullcalendar/interaction"
import { ChevronLeft, ChevronRight, UserPlus } from "lucide-react"
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { addLocalDays, formatLocalDate } from "@shared/lib/format"
import {
  DEFAULT_CALENDAR_COLOR,
  DEFAULT_CALENDAR_TEXT_COLOR,
} from "./calendar-colors"
import { getCalendarRangeUpdate, toDateOnly } from "./calendar-range-update"

export interface AbsenceCalendarTenant {
  calendarColor: string
  displayName: string
  id: string
}

export interface AbsenceCalendarRange {
  calendarColor: string
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

export interface AbsenceCalendarSelectedRange {
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
  emptyState?: AbsenceCalendarEmptyState | null
  onDeleteAbsence: (absenceId: string) => void
  onMoveAbsence: (move: AbsenceCalendarMoveInput) => Promise<void> | void
  onSelectRange: (startDate: string, endDate: string) => void
  selectedRange?: AbsenceCalendarSelectedRange | null
  selectedTenantColor?: string | null
}

const CALENDAR_NAV_ACTION = {
  NEXT: "next",
  PREVIOUS: "previous",
  TODAY: "today",
} as const

type CalendarNavAction =
  (typeof CALENDAR_NAV_ACTION)[keyof typeof CALENDAR_NAV_ACTION]

const isValidSelectedRange = (
  selectedRange: AbsenceCalendarSelectedRange | null | undefined,
) =>
  Boolean(
    selectedRange &&
      selectedRange.startDate.length >= 10 &&
      selectedRange.endDate.length >= 10 &&
      selectedRange.endDate > selectedRange.startDate,
  )

const toEvents = (absences: AbsenceCalendarRange[]): EventInput[] =>
  absences.map((absence) => ({
    allDay: true,
    backgroundColor: absence.calendarColor,
    borderColor: absence.calendarColor,
    end: absence.endDate,
    extendedProps: {
      calendarColor: absence.calendarColor,
      displayName: absence.displayName,
      endDate: absence.endDate,
      reason: absence.reason,
      startDate: absence.startDate,
      tenantId: absence.tenantId,
    },
    id: absence.id,
    start: absence.startDate,
    textColor: DEFAULT_CALENDAR_TEXT_COLOR,
    title: `${absence.displayName}${absence.reason ? ` - ${absence.reason}` : ""}`,
  }))

interface CalendarHoverCard {
  calendarColor: string
  displayName: string
  endDate: string
  left: number
  reason: string | null
  startDate: string
  top: number
}

type CalendarStyle = CSSProperties & {
  "--calendar-selection-color": string
}

const formatHoverRange = (startDate: string, endDate: string) => {
  const inclusiveEndDate = addLocalDays(endDate, -1)

  if (startDate === inclusiveEndDate) {
    return formatLocalDate(startDate)
  }

  return `${formatLocalDate(startDate)} to ${formatLocalDate(inclusiveEndDate)}`
}

export function AbsenceCalendar({
  absences,
  canEdit,
  currentTenantId,
  emptyState = null,
  onDeleteAbsence,
  onMoveAbsence,
  onSelectRange,
  selectedRange = null,
  selectedTenantColor = DEFAULT_CALENDAR_COLOR,
}: AbsenceCalendarProps) {
  const calendarRef = useRef<FullCalendar | null>(null)
  const [calendarTitle, setCalendarTitle] = useState("Calendar")
  const [hoverCard, setHoverCard] = useState<CalendarHoverCard | null>(null)
  const calendarEvents = useMemo(() => toEvents(absences), [absences])
  const calendarStyle: CalendarStyle = {
    "--calendar-selection-color": selectedTenantColor ?? DEFAULT_CALENDAR_COLOR,
  }

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi()

    if (!calendarApi) {
      return
    }

    if (!isValidSelectedRange(selectedRange) || !selectedRange) {
      calendarApi.unselect()
      return
    }

    calendarApi.select({
      allDay: true,
      end: selectedRange.endDate,
      start: selectedRange.startDate,
    })
  }, [selectedRange])

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

  const handleEventRangeChange = ({
    event,
    revert,
  }: {
    event: EventDropArg["event"] | EventResizeDoneArg["event"]
    revert: () => void
  }) => {
    if (!canEdit) {
      revert()
      return
    }

    const rangeUpdate = getCalendarRangeUpdate(event)

    if (!rangeUpdate) {
      revert()
      return
    }

    void Promise.resolve(onMoveAbsence(rangeUpdate)).catch(() => revert())
  }

  const handleEventDrop = (drop: EventDropArg) => {
    handleEventRangeChange({
      event: drop.event,
      revert: drop.revert,
    })
  }

  const handleEventResize = (resize: EventResizeDoneArg) => {
    handleEventRangeChange({
      event: resize.event,
      revert: resize.revert,
    })
  }

  const handleEventMouseEnter = (hover: EventHoveringArg) => {
    const rect = hover.el.getBoundingClientRect()
    const displayName = hover.event.extendedProps.displayName
    const startDate = hover.event.extendedProps.startDate
    const endDate = hover.event.extendedProps.endDate
    const reason = hover.event.extendedProps.reason
    const calendarColor = hover.event.extendedProps.calendarColor

    if (
      typeof displayName !== "string" ||
      typeof startDate !== "string" ||
      typeof endDate !== "string" ||
      typeof calendarColor !== "string"
    ) {
      return
    }

    setHoverCard({
      calendarColor,
      displayName,
      endDate,
      left: Math.min(
        Math.max(rect.left + rect.width / 2, 128),
        window.innerWidth - 128,
      ),
      reason: typeof reason === "string" && reason.length > 0 ? reason : null,
      startDate,
      top: rect.top,
    })
  }

  const handleEventMouseLeave = () => {
    setHoverCard(null)
  }

  return (
    <div className="space-y-3" style={calendarStyle}>
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
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
            eventResizableFromStart
            eventResize={handleEventResize}
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
            unselectAuto={false}
          />
        </div>
        {hoverCard ? (
          <div
            className="pointer-events-none fixed z-50 w-56 -translate-x-1/2 -translate-y-full rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg"
            style={{
              borderColor: hoverCard.calendarColor,
              left: hoverCard.left,
              top: hoverCard.top - 8,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ backgroundColor: hoverCard.calendarColor }}
              />
              <p className="truncate text-sm font-medium">
                {hoverCard.displayName}
              </p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatHoverRange(hoverCard.startDate, hoverCard.endDate)}
            </p>
            {hoverCard.reason ? (
              <p className="mt-2 text-sm leading-5">{hoverCard.reason}</p>
            ) : null}
          </div>
        ) : null}
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
