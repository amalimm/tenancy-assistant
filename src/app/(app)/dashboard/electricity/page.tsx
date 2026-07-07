import type { Route } from "next"
import { redirect } from "next/navigation"

export default async function ElectricityPage() {
  redirect("/dashboard/utilities" as Route)
}
