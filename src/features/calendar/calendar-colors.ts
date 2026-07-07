export const CALENDAR_COLOR = {
  AMBER: "#7c6338",
  BLUE: "#536b8c",
  CLAY: "#7a5c58",
  OLIVE: "#6d6a43",
  PLUM: "#6b5f7f",
  SAGE: "#55725b",
  SLATE: "#5f6774",
  TEAL: "#4f7074",
} as const

export type CalendarColor = `#${string}`

export const CALENDAR_COLOR_VALUES = [
  CALENDAR_COLOR.SAGE,
  CALENDAR_COLOR.BLUE,
  CALENDAR_COLOR.CLAY,
  CALENDAR_COLOR.TEAL,
  CALENDAR_COLOR.PLUM,
  CALENDAR_COLOR.OLIVE,
  CALENDAR_COLOR.AMBER,
  CALENDAR_COLOR.SLATE,
] as const

export const DEFAULT_CALENDAR_COLOR = CALENDAR_COLOR_VALUES[0]

export const CALENDAR_COLOR_OPTIONS = [
  { label: "Sage", value: CALENDAR_COLOR.SAGE },
  { label: "Blue", value: CALENDAR_COLOR.BLUE },
  { label: "Clay", value: CALENDAR_COLOR.CLAY },
  { label: "Teal", value: CALENDAR_COLOR.TEAL },
  { label: "Plum", value: CALENDAR_COLOR.PLUM },
  { label: "Olive", value: CALENDAR_COLOR.OLIVE },
  { label: "Amber", value: CALENDAR_COLOR.AMBER },
  { label: "Slate", value: CALENDAR_COLOR.SLATE },
] as const

export const DEFAULT_CALENDAR_TEXT_COLOR = "#ffffff"

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

export const normalizeCalendarColor = (value: string) => {
  const trimmedValue = value.trim()

  return HEX_COLOR_PATTERN.test(trimmedValue)
    ? (trimmedValue.toLowerCase() as CalendarColor)
    : null
}

export const isCalendarColor = (value: string): value is CalendarColor =>
  normalizeCalendarColor(value) !== null

const getTenantColorIndex = (tenantId: string) => {
  let hash = 0

  for (const character of tenantId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }

  return hash % CALENDAR_COLOR_VALUES.length
}

export const getTenantCalendarColor = (
  tenantId: string,
  preferredColor: string | null,
) => {
  if (preferredColor) {
    const normalizedColor = normalizeCalendarColor(preferredColor)

    if (normalizedColor) {
      return normalizedColor
    }
  }

  return (
    CALENDAR_COLOR_VALUES[getTenantColorIndex(tenantId)] ??
    DEFAULT_CALENDAR_COLOR
  )
}
