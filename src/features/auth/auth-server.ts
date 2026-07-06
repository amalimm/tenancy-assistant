import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { env } from "@config/env"
import { db } from "@db/client"
import { USER_ROLE, type UserRole } from "@db/schema"
import * as schema from "@db/schema"

const resolveRoleForEmail = (email: string): UserRole =>
  env.adminEmails.includes(email.toLowerCase()) ? USER_ROLE.ADMIN : USER_ROLE.TENANT

export const auth = betterAuth({
  baseURL: env.authUrl,
  secret: env.authSecret,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
        required: true,
        defaultValue: USER_ROLE.TENANT,
      },
      activeHouseholdId: {
        type: "string",
        input: false,
        required: false,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => ({
          data: {
            ...newUser,
            role: resolveRoleForEmail(newUser.email),
          },
        }),
      },
    },
  },
})

export const getSession = async () => {
  const requestHeaders = await headers()

  return auth.api.getSession({
    headers: requestHeaders,
  })
}

export const requireSession = async () => {
  const session = await getSession()

  if (!session) {
    redirect("/")
  }

  return session
}

export const requireRole = async (roles: readonly UserRole[]) => {
  const session = await requireSession()
  const role = session.user.role as UserRole

  if (!roles.includes(role)) {
    redirect("/dashboard")
  }

  return {
    ...session,
    user: {
      ...session.user,
      role,
    },
  }
}
