// Wipes the public demo database and rebuilds the sample house.
// Run by .github/workflows/demo-reset.yml; never point it at production.
import { spawnSync } from "node:child_process"

import { createClient } from "@libsql/client"
import { hashPassword } from "better-auth/crypto"

const databaseUrl = process.env.TURSO_DATABASE_URL ?? ""
const authToken = process.env.TURSO_AUTH_TOKEN ?? ""
const demoEmail = process.env.DEMO_EMAIL ?? ""
const demoPassword = process.env.DEMO_PASSWORD ?? ""

// The demo database is named tenancy-assistant-demo, so its URL carries this marker.
if (!databaseUrl.includes("tenancy-assistant-demo")) {
  throw new Error("Refusing to reset: TURSO_DATABASE_URL is not the demo database.")
}

if (!authToken || !demoEmail || demoPassword.length < 10) {
  throw new Error("Set TURSO_AUTH_TOKEN, DEMO_EMAIL and DEMO_PASSWORD (10+ chars).")
}

const client = createClient({ authToken, url: databaseUrl })
const userId = "demo-admin"
const householdId = "demo-household"
const now = Date.now()

// Children before parents, so foreign keys never block a delete.
const tables = [
  "payment",
  "allocation_line",
  "allocation_run",
  "bill_upload",
  "billing_cycle",
  "absence_range",
  "tenancy_period",
  "tenant",
  "audit_log",
  "household",
  "verification",
  "session",
  "account",
  "user",
]

await client.batch(
  [
    ...tables.map((table) => `DELETE FROM "${table}"`),
    {
      sql: `
        INSERT INTO user (id, name, email, email_verified, role, active_household_id, created_at, updated_at)
        VALUES (?, 'Demo Admin', ?, 1, 'admin', ?, ?, ?)
      `,
      args: [userId, demoEmail, householdId, now, now],
    },
    {
      sql: `
        INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
        VALUES ('demo-admin-credential', ?, 'credential', ?, ?, ?, ?)
      `,
      args: [userId, userId, await hashPassword(demoPassword), now, now],
    },
    {
      sql: `
        INSERT INTO household (id, name, address, created_by_user_id, created_at, updated_at)
        VALUES (?, 'Demo House', 'Sample address', ?, ?, ?)
      `,
      args: [householdId, userId, now, now],
    },
  ],
  "write",
)
client.close()

const seed = spawnSync(process.execPath, ["scripts/seed.mjs"], {
  env: { ...process.env, SEED_HOUSEHOLD_ID: householdId },
  stdio: "inherit",
})

process.exit(seed.status ?? 1)
