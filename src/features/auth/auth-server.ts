import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { admin } from "better-auth/plugins"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { demoLogin, env } from "@config/env"
import { db } from "@db/client"
import { USER_ROLE, type UserRole } from "@db/schema"
import * as schema from "@db/schema"

// Endpoints that would let one demo visitor lock the shared demo account
// out for everyone else until the nightly reset.
const DEMO_BLOCKED_PATHS = new Set([
  "/change-password",
  "/delete-user",
  "/update-user",
  "/admin/ban-user",
  "/admin/impersonate-user",
  "/admin/remove-user",
  "/admin/revoke-user-sessions",
  "/admin/set-role",
])

const resolveRoleForEmail = (email: string): UserRole =>
  env.adminEmails.includes(email.toLowerCase()) ? USER_ROLE.ADMIN : USER_ROLE.TENANT

export const auth = betterAuth({
  baseURL: env.authUrl,
  secret: env.authSecret,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    disableSignUp: true,
    enabled: true,
    minPasswordLength: 10,
  },
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
  plugins: [
    admin({
      adminRoles: [USER_ROLE.ADMIN],
      defaultRole: USER_ROLE.TENANT,
    }),
  ],
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
  // ponytail: path blocklist only; admin set-user-password on the demo account
  // is still possible from devtools, the nightly reset repairs it.
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (demoLogin && DEMO_BLOCKED_PATHS.has(ctx.path)) {
        throw new APIError("FORBIDDEN", {
          message: "This action is disabled in the demo.",
        })
      }
    }),
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
