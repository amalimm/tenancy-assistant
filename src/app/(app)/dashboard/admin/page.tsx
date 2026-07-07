import { USER_ROLE } from "@db/schema"
import { requireRole } from "@features/auth/auth-server"

import {
  DashboardAdmin,
  DashboardRouteLayout,
  HouseholdSetupCard,
} from "../dashboard-content"
import {
  getAuditLogData,
  getDashboardData,
  toAuditActionFilter,
  toAuditEntityFilter,
  type AuditLogFilters,
} from "../data"

interface AdminPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const getSearchValue = (
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) => {
  const value = searchParams[key]

  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "")
}

const parseAuditFilters = (
  searchParams: Record<string, string | string[] | undefined>,
): AuditLogFilters => {
  const actorEmail = getSearchValue(searchParams, "actorEmail").trim()
  const dateFrom = getSearchValue(searchParams, "dateFrom")
  const dateTo = getSearchValue(searchParams, "dateTo")
  const action = toAuditActionFilter(getSearchValue(searchParams, "action"))
  const entityType = toAuditEntityFilter(
    getSearchValue(searchParams, "entityType"),
  )
  const filters: AuditLogFilters = {}

  if (action) {
    filters.action = action
  }

  if (actorEmail.length > 0) {
    filters.actorEmail = actorEmail
  }

  if (dateFrom.length > 0) {
    filters.dateFrom = dateFrom
  }

  if (dateTo.length > 0) {
    filters.dateTo = dateTo
  }

  if (entityType) {
    filters.entityType = entityType
  }

  return filters
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await requireRole([USER_ROLE.ADMIN])
  const resolvedSearchParams = await searchParams
  const data = await getDashboardData({
    email: session.user.email,
    id: session.user.id,
    name: session.user.name,
  })

  if (!data.household) {
    return <HouseholdSetupCard isAdmin />
  }
  const auditFilters = parseAuditFilters(resolvedSearchParams)
  const auditLogs = await getAuditLogData(data.household.id, auditFilters)
  const defaultTab =
    getSearchValue(resolvedSearchParams, "tab") === "audit"
      ? "audit"
      : "tenants"

  return (
    <DashboardRouteLayout>
      <DashboardAdmin
        auditFilters={auditFilters}
        auditLogs={auditLogs}
        data={data}
        defaultTab={defaultTab}
      />
    </DashboardRouteLayout>
  )
}
