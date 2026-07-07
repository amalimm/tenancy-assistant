export interface CalendarRangeUpdate {
  absenceId: string
  endDate: string
  startDate: string
}

export interface CalendarRangeEvent {
  endStr: string
  id: string
  startStr: string
}

export const toDateOnly = (dateValue: string) => dateValue.slice(0, 10)

export const getCalendarRangeUpdate = (
  event: CalendarRangeEvent,
): CalendarRangeUpdate | null => {
  const startDate = toDateOnly(event.startStr)
  const endDate = toDateOnly(event.endStr)

  if (
    event.id.length === 0 ||
    startDate.length < 10 ||
    endDate.length < 10 ||
    endDate <= startDate
  ) {
    return null
  }

  return {
    absenceId: event.id,
    endDate,
    startDate,
  }
}
