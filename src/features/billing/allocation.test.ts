import { describe, expect, it } from "vitest"

import { calculateAllocation, type AllocationInput } from "./allocation"

const createInput = (overrides: Partial<AllocationInput> = {}): AllocationInput => ({
  cycleStartDate: "2026-01-01",
  cycleEndDate: "2026-01-31",
  totalAmountCents: 30000,
  tenants: [
    {
      absenceRanges: [],
      displayName: "Asha",
      tenantId: "tenant-a",
      tenancyEndDate: null,
      tenancyStartDate: "2025-01-01",
    },
    {
      absenceRanges: [],
      displayName: "Ben",
      tenantId: "tenant-b",
      tenancyEndDate: null,
      tenancyStartDate: "2025-01-01",
    },
  ],
  ...overrides,
})

describe("calculateAllocation", () => {
  it("should split equally when tenants are present for the same days", () => {
    const result = calculateAllocation(createInput())

    expect(result.totalPresentDays).toBe(60)
    expect(result.lines).toEqual([
      {
        amountCents: 15000,
        displayName: "Asha",
        presentDays: 30,
        tenantId: "tenant-a",
      },
      {
        amountCents: 15000,
        displayName: "Ben",
        presentDays: 30,
        tenantId: "tenant-b",
      },
    ])
  })

  it("should reduce a tenant share for absent days using present-day proportion", () => {
    const result = calculateAllocation(
      createInput({
        tenants: [
          {
            absenceRanges: [{ startDate: "2026-01-11", endDate: "2026-01-21" }],
            displayName: "Asha",
            tenantId: "tenant-a",
            tenancyEndDate: null,
            tenancyStartDate: "2025-01-01",
          },
          {
            absenceRanges: [],
            displayName: "Ben",
            tenantId: "tenant-b",
            tenancyEndDate: null,
            tenancyStartDate: "2025-01-01",
          },
        ],
      }),
    )

    expect(result.totalPresentDays).toBe(50)
    expect(result.lines).toEqual([
      {
        amountCents: 12000,
        displayName: "Asha",
        presentDays: 20,
        tenantId: "tenant-a",
      },
      {
        amountCents: 18000,
        displayName: "Ben",
        presentDays: 30,
        tenantId: "tenant-b",
      },
    ])
  })

  it("should count move-in and move-out overlap inside the billing cycle", () => {
    const result = calculateAllocation(
      createInput({
        tenants: [
          {
            absenceRanges: [],
            displayName: "Asha",
            tenantId: "tenant-a",
            tenancyEndDate: "2026-01-16",
            tenancyStartDate: "2025-01-01",
          },
          {
            absenceRanges: [],
            displayName: "Ben",
            tenantId: "tenant-b",
            tenancyEndDate: null,
            tenancyStartDate: "2026-01-16",
          },
        ],
      }),
    )

    expect(result.lines).toEqual([
      {
        amountCents: 15000,
        displayName: "Asha",
        presentDays: 15,
        tenantId: "tenant-a",
      },
      {
        amountCents: 15000,
        displayName: "Ben",
        presentDays: 15,
        tenantId: "tenant-b",
      },
    ])
  })

  it("should merge overlapping and adjacent absence ranges", () => {
    const result = calculateAllocation(
      createInput({
        totalAmountCents: 31000,
        tenants: [
          {
            absenceRanges: [
              { startDate: "2026-01-05", endDate: "2026-01-10" },
              { startDate: "2026-01-08", endDate: "2026-01-15" },
              { startDate: "2026-01-15", endDate: "2026-01-20" },
            ],
            displayName: "Asha",
            tenantId: "tenant-a",
            tenancyEndDate: null,
            tenancyStartDate: "2025-01-01",
          },
          {
            absenceRanges: [],
            displayName: "Ben",
            tenantId: "tenant-b",
            tenancyEndDate: null,
            tenancyStartDate: "2025-01-01",
          },
        ],
      }),
    )

    expect(result.lines).toEqual([
      {
        amountCents: 10333,
        displayName: "Asha",
        presentDays: 15,
        tenantId: "tenant-a",
      },
      {
        amountCents: 20667,
        displayName: "Ben",
        presentDays: 30,
        tenantId: "tenant-b",
      },
    ])
  })

  it("should throw when nobody is present during the cycle", () => {
    const input = createInput({
      tenants: [
        {
          absenceRanges: [{ startDate: "2026-01-01", endDate: "2026-01-31" }],
          displayName: "Asha",
          tenantId: "tenant-a",
          tenancyEndDate: null,
          tenancyStartDate: "2025-01-01",
        },
      ],
    })

    expect(() => calculateAllocation(input)).toThrow(
      "At least one tenant must be present during the cycle.",
    )
  })
})
