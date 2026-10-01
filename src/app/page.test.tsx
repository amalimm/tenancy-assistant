import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const envMock = vi.hoisted(() => ({
  demoLogin: null as { email: string; password: string } | null,
  hasGoogleOAuthConfig: true,
}))

vi.mock("@config/env", () => envMock)

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

  it("shows the regular sign-in tabs outside demo mode", async () => {
    render(await HomePage())

    expect(screen.queryByRole("button", { name: "Try the demo" })).toBeNull()
    expect(screen.getByRole("tab", { name: "Tenant" })).toBeInTheDocument()
  })

  it("replaces the sign-in tabs with a one-click demo login in demo mode", async () => {
    envMock.demoLogin = { email: "demo@example.test", password: "demo-password" }

    render(await HomePage())

    expect(screen.getByRole("button", { name: "Try the demo" })).toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: "Tenant" })).toBeNull()

    envMock.demoLogin = null
  })
})
