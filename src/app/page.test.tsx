import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@config/env", () => ({
  hasGoogleOAuthConfig: true,
}))

vi.mock("@features/auth/auth-server", () => ({
  getSession: vi.fn(async () => null),
}))

import HomePage from "./page"

describe("HomePage", () => {
  it("centers the sign-in card instead of stretching it full-width", async () => {
    render(await HomePage())

    expect(screen.getByLabelText("Sign in")).toHaveClass(
      "mx-auto",
      "max-w-md",
    )
  })
})
