import { describe, expect, it } from "vitest"

import { sanitizeAuditMetadata } from "./audit-log"

describe("sanitizeAuditMetadata", () => {
  it("removes sensitive metadata keys", () => {
    expect(
      sanitizeAuditMetadata({
        fileName: "bill.pdf",
        temporaryPassword: "secret-pass",
        tokenValue: "token",
      }),
    ).toEqual({
      fileName: "bill.pdf",
    })
  })

  it("returns null when nothing safe remains", () => {
    expect(
      sanitizeAuditMetadata({
        password: "secret",
      }),
    ).toBeNull()
  })
})
