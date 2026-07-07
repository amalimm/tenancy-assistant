import type { Route } from "next"
import { redirect } from "next/navigation"

export default function CalendarRedirectPage() {
  redirect("/dashboard/calendar" as Route)
}
