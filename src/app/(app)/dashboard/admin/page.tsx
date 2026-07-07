import { USER_ROLE } from "@db/schema"
import { requireRole } from "@features/auth/auth-server"

import {
  DashboardAdmin,
  DashboardRouteLayout,
  HouseholdSetupCard,
} from "../dashboard-content"
import { getDashboardData } from "../data"

export default async function AdminPage() {
  const session = await requireRole([USER_ROLE.ADMIN])
  const data = await getDashboardData({
    email: session.user.email,
    id: session.user.id,
    name: session.user.name,
  })

  if (!data.household) {
    return <HouseholdSetupCard isAdmin />
  }

  return (
    <DashboardRouteLayout>
      <DashboardAdmin data={data} />
    </DashboardRouteLayout>
  )
}
