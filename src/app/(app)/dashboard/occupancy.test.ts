import { describe, expect, it } from "vitest"

import { buildOccupancyModel, OCCUPANCY_CELL_STATE } from "./occupancy"

const createTenant = (overrides: {
  id: string
  displayName?: string
  tenancyEndDate?: string | null
  tenancyStartDate?: string
}) => ({
  calendarColor: "#2563eb",
  displayName: overrides.displayName ?? overrides.id,
  email: `${overrides.id}@example.com`,
  id: overrides.id,
  isLinked: true,
  notes: null,
  tenancyEndDate: overrides.tenancyEndDate ?? null,
  tenancyStartDate: overrides.tenancyStartDate ?? "2026-07-01",
})

const createAbsence = (overrides: {
  endDate: string
  id: string
  reason?: string | null
  startDate: string
  tenantId: string
}) => ({
  calendarColor: "#2563eb",
  displayName: overrides.tenantId,
  endDate: overrides.endDate,
  id: overrides.id,
  reason: overrides.reason ?? null,
  startDate: overrides.startDate,
  tenantId: overrides.tenantId,
})

describe("buildOccupancyModel", () => {
  it("should mark an active tenant present today when they have no absence", () => {
    const model = buildOccupancyModel({
      absences: [],
      startDate: "2026-07-09",
      tenants: [createTenant({ id: "tenant-a" })],
    })

    expect(model.tenantRows[0]?.cells[0]?.state).toBe(
      OCCUPANCY_CELL_STATE.PRESENT,
    )
    expect(model.totals[0]).toMatchObject({ out: 0, present: 1 })
    expect(model.today).toMatchObject({ out: 0, present: 1 })
  })

  it("should mark a tenant out during an absence range", () => {
    const model = buildOccupancyModel({
      absences: [
        createAbsence({
          endDate: "2026-07-12",
          id: "absence-1",
          reason: "Travel",
          startDate: "2026-07-09",
          tenantId: "tenant-a",
        }),
      ],
      startDate: "2026-07-09",
      tenants: [createTenant({ id: "tenant-a" })],
    })

    expect(model.tenantRows[0]?.cells[0]).toMatchObject({
      absence: {
        endDate: "2026-07-12",
        reason: "Travel",
        startDate: "2026-07-09",
      },
      state: OCCUPANCY_CELL_STATE.OUT,
    })
    expect(model.totals[0]).toMatchObject({ out: 1, present: 0 })
  })

  it("should mark a tenant with a future start date inactive", () => {
    const model = buildOccupancyModel({
      absences: [],
      startDate: "2026-07-09",
      tenants: [
        createTenant({
          id: "tenant-future",
          tenancyStartDate: "2026-07-11",
        }),
      ],
    })

    expect(model.tenantRows[0]?.cells[0]?.state).toBe(
      OCCUPANCY_CELL_STATE.INACTIVE,
    )
    expect(model.totals[0]).toMatchObject({ out: 0, present: 0 })
  })

  it("should mark a tenant with an ended tenancy inactive", () => {
    const model = buildOccupancyModel({
      absences: [],
      startDate: "2026-07-09",
      tenants: [
        createTenant({
          id: "tenant-ended",
          tenancyEndDate: "2026-07-09",
          tenancyStartDate: "2026-07-01",
        }),
      ],
    })

    expect(model.tenantRows[0]?.cells[0]?.state).toBe(
      OCCUPANCY_CELL_STATE.INACTIVE,
    )
    expect(model.totals[0]).toMatchObject({ out: 0, present: 0 })
  })

  it("should count overlapping absences for the same tenant as one out tenant", () => {
    const model = buildOccupancyModel({
      absences: [
        createAbsence({
          endDate: "2026-07-12",
          id: "absence-1",
          startDate: "2026-07-09",
          tenantId: "tenant-a",
        }),
        createAbsence({
          endDate: "2026-07-13",
          id: "absence-2",
          startDate: "2026-07-10",
          tenantId: "tenant-a",
        }),
      ],
      startDate: "2026-07-10",
      tenants: [createTenant({ id: "tenant-a" })],
    })

    expect(model.tenantRows[0]?.cells[0]?.state).toBe(
      OCCUPANCY_CELL_STATE.OUT,
    )
    expect(model.totals[0]).toMatchObject({ out: 1, present: 0 })
    expect(model.today).toMatchObject({ out: 1, present: 0 })
  })

  it("should report the earliest next change across tenant rows", () => {
    const model = buildOccupancyModel({
      absences: [
        createAbsence({
          endDate: "2026-07-15",
          id: "absence-late",
          startDate: "2026-07-14",
          tenantId: "tenant-a",
        }),
        createAbsence({
          endDate: "2026-07-12",
          id: "absence-soon",
          startDate: "2026-07-10",
          tenantId: "tenant-b",
        }),
      ],
      startDate: "2026-07-09",
      tenants: [
        createTenant({ displayName: "Asha", id: "tenant-a" }),
        createTenant({ displayName: "Ben", id: "tenant-b" }),
      ],
    })

    expect(model.nextChange).toMatchObject({
      date: "2026-07-10",
      tenantName: "Ben",
    })
  })
})
