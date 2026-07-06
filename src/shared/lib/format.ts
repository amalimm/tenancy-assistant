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

const LOCAL_DATE_FORMATTER = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

export const formatLocalDate = (dateValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number)

  if (!year || !month || !day) {
    return dateValue
  }

  return LOCAL_DATE_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)))
}
