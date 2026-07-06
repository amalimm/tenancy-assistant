export const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    style: "currency",
  }).format(amountCents / 100)

export const formatDays = (days: number) =>
  new Intl.NumberFormat("en-MY", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(days)

export const DATE_INPUT_LENGTH = 10

const LOCAL_DATE_FORMATTER = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

const toTwoDigitValue = (value: number) => String(value).padStart(2, "0")

export const parseLocalDate = (dateValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

export const toLocalDateValue = (date: Date) =>
  [
    date.getFullYear(),
    toTwoDigitValue(date.getMonth() + 1),
    toTwoDigitValue(date.getDate()),
  ].join("-")

export const addLocalDays = (dateValue: string, dayCount: number) => {
  const date = parseLocalDate(dateValue)

  if (!date) {
    return ""
  }

  date.setDate(date.getDate() + dayCount)

  return toLocalDateValue(date)
}

export const formatLocalDate = (dateValue: string) => {
  const date = parseLocalDate(dateValue)

  return date ? LOCAL_DATE_FORMATTER.format(date) : dateValue
}
