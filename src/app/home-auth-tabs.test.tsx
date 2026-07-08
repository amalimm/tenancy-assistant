import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HomeAuthTabs } from "./home-auth-tabs"

describe("HomeAuthTabs", () => {
  it("shows tenant and admin sign-in methods as tabs", () => {
    render(<HomeAuthTabs hasGoogleOAuthConfig />)

    expect(screen.getByRole("tab", { name: "Tenant" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Admin" })).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
  })

  it("presents Google admin sign-in with the provider label", () => {
    render(<HomeAuthTabs defaultValue="admin" hasGoogleOAuthConfig />)

    expect(
      screen.getByRole("button", { name: /sign in with google/i }),
    ).toBeInTheDocument()
  })

  it("keeps a compact stable height without redundant admin copy", () => {
    render(<HomeAuthTabs defaultValue="admin" hasGoogleOAuthConfig />)

    expect(screen.getByRole("tabpanel")).toHaveClass("min-h-[12rem]")
    expect(screen.queryByText("Admin access")).not.toBeInTheDocument()
    expect(
      screen.queryByText(/registered as a household admin/i),
    ).not.toBeInTheDocument()
  })

  it("centers the admin Google sign-in group", () => {
    render(<HomeAuthTabs defaultValue="admin" hasGoogleOAuthConfig />)

    const button = screen.getByRole("button", { name: /sign in with google/i })
    const group = button.parentElement
    const panelLayout = group?.parentElement

    expect(panelLayout).toHaveClass("place-items-center")
    expect(group).toHaveClass("max-w-xs", "justify-items-center", "text-center")
  })
})
