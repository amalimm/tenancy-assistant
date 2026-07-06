import { z } from "zod"

const DEFAULT_DATABASE_URL = "file:local.db"

const envSchema = z.object({
  ADMIN_EMAILS: z.string().optional().default(""),
  BETTER_AUTH_SECRET: z.string().optional().default("dev-secret-change-me"),
  BETTER_AUTH_URL: z.string().optional().default("http://localhost:3000"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  TURSO_AUTH_TOKEN: z.string().optional(),
  TURSO_DATABASE_URL: z.string().optional().default(DEFAULT_DATABASE_URL),
})

const parseEmailList = (value: string) =>
  value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)

const parsedEnv = envSchema.parse(process.env)

export const env = {
  adminEmails: parseEmailList(parsedEnv.ADMIN_EMAILS),
  authSecret: parsedEnv.BETTER_AUTH_SECRET,
  authUrl: parsedEnv.BETTER_AUTH_URL,
  blobReadWriteToken: parsedEnv.BLOB_READ_WRITE_TOKEN,
  googleClientId: parsedEnv.GOOGLE_CLIENT_ID,
  googleClientSecret: parsedEnv.GOOGLE_CLIENT_SECRET,
  tursoAuthToken: parsedEnv.TURSO_AUTH_TOKEN,
  tursoDatabaseUrl: parsedEnv.TURSO_DATABASE_URL,
}

export const hasGoogleOAuthConfig =
  env.googleClientId.length > 0 && env.googleClientSecret.length > 0

export const hasBlobConfig = Boolean(env.blobReadWriteToken)
