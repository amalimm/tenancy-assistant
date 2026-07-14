import { createHash } from "node:crypto"

import { createClient } from "@libsql/client"
import { config } from "dotenv"

config({ path: ".env.local", quiet: true })
config({ path: ".env", quiet: true })

const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:local.db"
const authToken = process.env.TURSO_AUTH_TOKEN
const client = createClient(
  authToken ? { authToken, url: databaseUrl } : { url: databaseUrl },
)

const queryTargetHouseholds = async () => {
  const requestedHouseholdId = process.env.SEED_HOUSEHOLD_ID?.trim()

  if (requestedHouseholdId) {
    const result = await client.execute({
      sql: `
        SELECT h.id, h.name, h.created_by_user_id AS actor_user_id, u.email AS actor_email
        FROM household h
        JOIN user u ON u.id = h.created_by_user_id
        WHERE h.id = ?
      `,
      args: [requestedHouseholdId],
    })

    return result.rows
  }

  const result = await client.execute(`
    SELECT h.id, h.name, h.created_by_user_id AS actor_user_id, u.email AS actor_email
    FROM household h
    JOIN user u ON u.id = h.created_by_user_id
    WHERE u.role = 'admin'
      AND u.active_household_id = h.id
      AND h.id NOT LIKE 'codex-e2e-%'
    ORDER BY h.created_at
  `)

  return result.rows
}

const targetHouseholds = await queryTargetHouseholds()

if (targetHouseholds.length !== 1) {
  client.close()
  throw new Error(
    targetHouseholds.length === 0
      ? "No active admin household found. Set SEED_HOUSEHOLD_ID explicitly."
      : "Multiple active admin households found. Set SEED_HOUSEHOLD_ID explicitly.",
  )
}

const [targetHousehold] = targetHouseholds
const householdId = String(targetHousehold.id)
const actorUserId = String(targetHousehold.actor_user_id)
const actorEmail = String(targetHousehold.actor_email)
const seedNamespace = createHash("sha256")
  .update(householdId)
  .digest("hex")
  .slice(0, 10)
const seedId = (suffix) => `seed-dashboard-${seedNamespace}-${suffix}`
const now = Date.now()

const tenants = [
  {
    calendarColor: "#71717a",
    displayName: "Nadia Abdul Rahman",
    email: "nadia.seed@example.test",
    id: seedId("tenant-nadia"),
    notes: "Demo tenant for local dashboard data",
    startDate: "2026-03-01",
  },
  {
    calendarColor: "#a1a1aa",
    displayName: "Marcus Lee",
    email: "marcus.seed@example.test",
    id: seedId("tenant-marcus"),
    notes: "Demo tenant for local dashboard data",
    startDate: "2026-04-15",
  },
]

const tenantByKey = new Map([
  ["nadia", tenants[0]],
  ["marcus", tenants[1]],
])

const absences = [
  {
    endDate: "2026-07-19",
    id: seedId("absence-nadia-july"),
    reason: "Family visit",
    startDate: "2026-07-14",
    tenantId: tenantByKey.get("nadia").id,
  },
  {
    endDate: "2026-07-29",
    id: seedId("absence-marcus-july"),
    reason: "Work trip",
    startDate: "2026-07-24",
    tenantId: tenantByKey.get("marcus").id,
  },
  {
    endDate: "2026-08-08",
    id: seedId("absence-nadia-august"),
    reason: "Holiday",
    startDate: "2026-08-04",
    tenantId: tenantByKey.get("nadia").id,
  },
]

const cycles = [
  {
    endDate: "2026-01-31",
    key: "2026-01-internet",
    name: "Internet · Jan 2026",
    provider: "Unifi",
    startDate: "2026-01-01",
    totalAmountCents: 12900,
    utilityType: "internet",
  },
  {
    endDate: "2026-02-28",
    key: "2026-02-electricity",
    name: "Electricity · Feb 2026",
    provider: "SEB",
    startDate: "2026-02-01",
    totalAmountCents: 14120,
    utilityType: "electricity",
  },
  {
    endDate: "2026-03-31",
    key: "2026-03-water",
    name: "Water · Mar 2026",
    provider: "KWB",
    startDate: "2026-03-01",
    totalAmountCents: 5320,
    utilityType: "water",
  },
  {
    endDate: "2026-04-30",
    key: "2026-04-electricity",
    name: "Electricity · Apr 2026",
    provider: "SEB",
    startDate: "2026-04-01",
    totalAmountCents: 13240,
    utilityType: "electricity",
  },
  {
    endDate: "2026-05-31",
    key: "2026-05-internet",
    name: "Internet · May 2026",
    provider: "Unifi",
    startDate: "2026-05-01",
    totalAmountCents: 12900,
    utilityType: "internet",
  },
  {
    endDate: "2026-06-30",
    key: "2026-06-water",
    name: "Water · Jun 2026",
    provider: "KWB",
    startDate: "2026-06-01",
    totalAmountCents: 4970,
    utilityType: "water",
  },
].map((cycle) => ({ ...cycle, id: seedId(`cycle-${cycle.key}`) }))

const cycleByKey = new Map(cycles.map((cycle) => [cycle.key, cycle]))
const allocations = [
  {
    cycleKey: "2026-04-electricity",
    lines: [
      { amountCents: 6620, payment: "paid", presentDays: 30, tenantKey: "nadia" },
      { amountCents: 6620, payment: "unpaid", presentDays: 30, tenantKey: "marcus" },
    ],
  },
  {
    cycleKey: "2026-05-internet",
    lines: [
      { amountCents: 6450, payment: "partial", presentDays: 31, tenantKey: "nadia" },
      { amountCents: 6450, payment: "paid", presentDays: 31, tenantKey: "marcus" },
    ],
  },
  {
    cycleKey: "2026-06-water",
    lines: [
      { amountCents: 2485, payment: "unpaid", presentDays: 30, tenantKey: "nadia" },
      { amountCents: 2485, payment: "paid", presentDays: 30, tenantKey: "marcus" },
    ],
  },
]

const statements = []

for (const tenant of tenants) {
  statements.push({
    sql: `
      INSERT INTO tenant (
        id, household_id, user_id, display_name, email, calendar_color, notes, created_at, updated_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        household_id = excluded.household_id,
        display_name = excluded.display_name,
        email = excluded.email,
        calendar_color = excluded.calendar_color,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `,
    args: [
      tenant.id,
      householdId,
      tenant.displayName,
      tenant.email,
      tenant.calendarColor,
      tenant.notes,
      now,
      now,
    ],
  })
  statements.push({
    sql: `
      INSERT INTO tenancy_period (id, tenant_id, start_date, end_date, created_at, updated_at)
      VALUES (?, ?, ?, NULL, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        tenant_id = excluded.tenant_id,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        updated_at = excluded.updated_at
    `,
    args: [seedId(`period-${tenant.id}`), tenant.id, tenant.startDate, now, now],
  })
}

for (const absence of absences) {
  statements.push({
    sql: `
      INSERT INTO absence_range (
        id, tenant_id, start_date, end_date, reason, created_by_user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        tenant_id = excluded.tenant_id,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        reason = excluded.reason,
        created_by_user_id = excluded.created_by_user_id,
        updated_at = excluded.updated_at
    `,
    args: [
      absence.id,
      absence.tenantId,
      absence.startDate,
      absence.endDate,
      absence.reason,
      actorUserId,
      now,
      now,
    ],
  })
}

for (const cycle of cycles) {
  statements.push({
    sql: `
      INSERT INTO billing_cycle (
        id, household_id, name, start_date, end_date, total_amount_cents,
        utility_type, utility_provider, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        household_id = excluded.household_id,
        name = excluded.name,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        total_amount_cents = excluded.total_amount_cents,
        utility_type = excluded.utility_type,
        utility_provider = excluded.utility_provider,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `,
    args: [
      cycle.id,
      householdId,
      cycle.name,
      cycle.startDate,
      cycle.endDate,
      cycle.totalAmountCents,
      cycle.utilityType,
      cycle.provider,
      "Deterministic local dashboard seed",
      now,
      now,
    ],
  })
}

for (const allocation of allocations) {
  const cycle = cycleByKey.get(allocation.cycleKey)
  const runId = seedId(`run-${allocation.cycleKey}`)
  const totalPresentDays = allocation.lines.reduce(
    (total, line) => total + line.presentDays,
    0,
  )

  statements.push({
    sql: `
      INSERT INTO allocation_run (
        id, billing_cycle_id, status, total_present_days, total_amount_cents,
        created_by_user_id, created_at, updated_at
      ) VALUES (?, ?, 'final', ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        billing_cycle_id = excluded.billing_cycle_id,
        status = excluded.status,
        total_present_days = excluded.total_present_days,
        total_amount_cents = excluded.total_amount_cents,
        created_by_user_id = excluded.created_by_user_id,
        updated_at = excluded.updated_at
    `,
    args: [
      runId,
      cycle.id,
      totalPresentDays,
      cycle.totalAmountCents,
      actorUserId,
      now,
      now,
    ],
  })

  for (const line of allocation.lines) {
    const tenant = tenantByKey.get(line.tenantKey)
    const lineId = seedId(`line-${allocation.cycleKey}-${line.tenantKey}`)
    const amountPaidCents =
      line.payment === "paid"
        ? line.amountCents
        : line.payment === "partial"
          ? Math.floor(line.amountCents / 2)
          : 0
    const paidAt = line.payment === "unpaid" ? null : now

    statements.push({
      sql: `
        INSERT INTO allocation_line (
          id, allocation_run_id, tenant_id, present_days, amount_cents, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          allocation_run_id = excluded.allocation_run_id,
          tenant_id = excluded.tenant_id,
          present_days = excluded.present_days,
          amount_cents = excluded.amount_cents,
          updated_at = excluded.updated_at
      `,
      args: [lineId, runId, tenant.id, line.presentDays, line.amountCents, now, now],
    })
    statements.push({
      sql: `
        INSERT INTO payment (
          id, allocation_line_id, status, amount_paid_cents, paid_at, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          allocation_line_id = excluded.allocation_line_id,
          status = excluded.status,
          amount_paid_cents = excluded.amount_paid_cents,
          paid_at = excluded.paid_at,
          notes = excluded.notes,
          updated_at = excluded.updated_at
      `,
      args: [
        seedId(`payment-${allocation.cycleKey}-${line.tenantKey}`),
        lineId,
        line.payment,
        amountPaidCents,
        paidAt,
        "Demo payment state",
        now,
        now,
      ],
    })
  }
}

const auditEvents = [
  ["tenant.created", "tenant", tenants[0].id, tenants[0].displayName],
  ["tenant.created", "tenant", tenants[1].id, tenants[1].displayName],
  ["bill.created", "bill", cycleByKey.get("2026-06-water").id, "Water · Jun 2026"],
  ["allocation.run", "allocation", seedId("run-2026-06-water"), "Water · Jun 2026"],
  ["payment.updated", "payment", seedId("payment-2026-05-internet-nadia"), "Nadia Abdul Rahman"],
]

auditEvents.forEach(([action, entityType, entityId, targetLabel], index) => {
  statements.push({
    sql: `
      INSERT INTO audit_log (
        id, household_id, actor_user_id, actor_email, action, entity_type,
        entity_id, target_label, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        actor_user_id = excluded.actor_user_id,
        actor_email = excluded.actor_email,
        action = excluded.action,
        entity_type = excluded.entity_type,
        entity_id = excluded.entity_id,
        target_label = excluded.target_label,
        metadata = excluded.metadata
    `,
    args: [
      seedId(`audit-${index + 1}`),
      householdId,
      actorUserId,
      actorEmail,
      action,
      entityType,
      entityId,
      targetLabel,
      JSON.stringify({ source: "local-dashboard-seed" }),
      now - (auditEvents.length - index) * 60_000,
    ],
  })
})

await client.batch(statements, "write")

const summary = await client.execute({
  sql: `
    SELECT
      (SELECT COUNT(*) FROM tenant WHERE household_id = ?) AS tenants,
      (SELECT COUNT(*) FROM billing_cycle WHERE household_id = ?) AS billing_cycles,
      (SELECT COUNT(*) FROM absence_range a JOIN tenant t ON t.id = a.tenant_id WHERE t.household_id = ?) AS absences,
      (SELECT COUNT(*) FROM allocation_run ar JOIN billing_cycle bc ON bc.id = ar.billing_cycle_id WHERE bc.household_id = ?) AS allocation_runs,
      (SELECT COUNT(*) FROM payment p JOIN allocation_line al ON al.id = p.allocation_line_id JOIN tenant t ON t.id = al.tenant_id WHERE t.household_id = ?) AS payments
  `,
  args: [householdId, householdId, householdId, householdId, householdId],
})

const counts = summary.rows[0]
const targetKind = databaseUrl.startsWith("file:") ? "local file" : "configured development database"

console.log(`Seeded ${targetHousehold.name} (${householdId}) in the ${targetKind}.`)
console.log(
  `Totals: ${counts.tenants} tenants, ${counts.billing_cycles} bills, ${counts.absences} absences, ${counts.allocation_runs} allocation runs, ${counts.payments} payments.`,
)

client.close()
