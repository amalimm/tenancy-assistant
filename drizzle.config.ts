import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({ path: ".env.local" })
config({ path: ".env" })

const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:local.db"
const authToken =
  process.env.TURSO_AUTH_TOKEN ??
  (databaseUrl.startsWith("file:") ? "local-dev-token" : "")

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: databaseUrl,
    authToken,
  },
})
