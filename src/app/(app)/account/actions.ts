"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@db/client"
import { tenant, USER_ROLE } from "@db/schema"
import { requireSession } from "@features/auth/auth-server"
import { normalizeCalendarColor } from "@features/calendar/calendar-colors"

const updateCalendarColorSchema = z.object({
  calendarColor: z.string().transform((value, context) => {
    const normalizedColor = normalizeCalendarColor(value)

    if (!normalizedColor) {
      context.addIssue({
        code: "custom",
        message: "Choose a valid calendar color.",
      })

      return z.NEVER
    }

    return normalizedColor
  }),
})

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key)

  return typeof value === "string" ? value : ""
}

export const updateCalendarColorAction = async (formData: FormData) => {
  const session = await requireSession()

  if (session.user.role !== USER_ROLE.TENANT) {
    throw new Error("Only tenants can update a calendar color.")
  }

  const parsed = updateCalendarColorSchema.parse({
    calendarColor: getString(formData, "calendarColor"),
  })
  const [tenantProfile] = await db
    .select()
    .from(tenant)
    .where(eq(tenant.userId, session.user.id))
    .limit(1)

  if (!tenantProfile) {
    throw new Error("Tenant profile not found.")
  }

  await db
    .update(tenant)
    .set({
      calendarColor: parsed.calendarColor,
      updatedAt: new Date(),
    })
    .where(and(eq(tenant.id, tenantProfile.id), eq(tenant.userId, session.user.id)))

  revalidatePath("/account")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/calendar")
}
