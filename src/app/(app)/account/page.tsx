import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { db } from "@db/client"
import { tenant, USER_ROLE } from "@db/schema"
import { AccountPasswordForm } from "@features/auth/account-password-form"
import { requireSession } from "@features/auth/auth-server"
import { CalendarColorForm } from "@features/calendar/calendar-color-form"
import { getTenantCalendarColor } from "@features/calendar/calendar-colors"
import { eq } from "drizzle-orm"

import { updateCalendarColorAction } from "./actions"

const USER_ROLE_LABEL = {
  [USER_ROLE.ADMIN]: "Admin",
  [USER_ROLE.TENANT]: "Tenant",
} as const

const getTenantProfile = async (userId: string) => {
  const [tenantProfile] = await db
    .select()
    .from(tenant)
    .where(eq(tenant.userId, userId))
    .limit(1)

  return tenantProfile ?? null
}

export default async function AccountPage() {
  const session = await requireSession()
  const role =
    session.user.role === USER_ROLE.ADMIN ? USER_ROLE.ADMIN : USER_ROLE.TENANT
  const tenantProfile =
    role === USER_ROLE.TENANT ? await getTenantProfile(session.user.id) : null
  const calendarColor = tenantProfile
    ? getTenantCalendarColor(tenantProfile.id, tenantProfile.calendarColor)
    : null

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5 px-4 py-5">
      <section className="rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="secondary">{USER_ROLE_LABEL[role]}</Badge>
            <h1 className="mt-3 text-2xl font-semibold">Account</h1>
          </div>
          <Badge variant="outline">
            {role === USER_ROLE.ADMIN ? "Google SSO" : "Email + password"}
          </Badge>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your sign-in identity.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1">
            <p className="text-xs font-medium text-muted-foreground">Name</p>
            <p className="font-medium">{session.user.name}</p>
          </div>
          <div className="grid gap-1">
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p className="break-all font-medium">{session.user.email}</p>
          </div>
        </CardContent>
      </Card>

      {role === USER_ROLE.TENANT ? (
        <>
          {calendarColor ? (
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>
                  Choose the color used for your calendar entries.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarColorForm
                  action={updateCalendarColorAction}
                  className="max-w-md"
                  currentColor={calendarColor}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                Update the password used for tenant email sign-in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountPasswordForm
                className="max-w-md"
                email={session.user.email}
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
