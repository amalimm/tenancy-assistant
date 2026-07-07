import { USER_ROLE } from "@db/schema"
import { requireSession } from "@features/auth/auth-server"

import {
  DashboardCalendar,
  DashboardRouteLayout,
  HouseholdSetupCard,
} from "../dashboard-content"
import { getDashboardData } from "../data"

export default async function CalendarPage() {
  const session = await requireSession()
  const data = await getDashboardData({
    email: session.user.email,
    id: session.user.id,
    name: session.user.name,
  })
  const isAdmin = data.user.role === USER_ROLE.ADMIN

  if (!data.household) {
    return <HouseholdSetupCard isAdmin={isAdmin} />
  }

  return (
    <DashboardRouteLayout>
      <DashboardCalendar data={data} isAdmin={isAdmin} />
    </DashboardRouteLayout>
  )
}
