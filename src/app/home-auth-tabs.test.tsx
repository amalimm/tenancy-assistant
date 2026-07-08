import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HomeAuthTabs } from "./home-auth-tabs"

describe("HomeAuthTabs", () => {
  it("shows tenant and admin sign-in methods as tabs", () => {
    render(<HomeAuthTabs hasGoogleOAuthConfig />)

    expect(screen.getByRole("tab", { name: "Tenant" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Admin" })).toBeInTheDocument()
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Tenant login")
  })

  it("presents Google admin sign-in with the provider label", () => {
    render(<HomeAuthTabs defaultValue="admin" hasGoogleOAuthConfig />)

    expect(
      screen.getByRole("button", { name: /sign in with google/i }),
    ).toBeInTheDocument()
  })
})
