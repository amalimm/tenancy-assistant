import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AccountPasswordForm } from "./account-password-form"

const mocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
}))

vi.mock("@features/auth/auth-client", () => ({
  authClient: {
    changePassword: mocks.changePassword,
  },
}))

describe("AccountPasswordForm", () => {
  it("resets the form after an async password update", async () => {
    mocks.changePassword.mockResolvedValue({ error: null })
    render(<AccountPasswordForm email="tenant@example.com" />)

    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "old-password" },
    })
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new-password" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Change password" }))

    await waitFor(() => {
      expect(screen.getByText("Password updated.")).toBeInTheDocument()
    })
    expect(screen.getByLabelText("Current password")).toHaveValue("")
    expect(screen.getByLabelText("New password")).toHaveValue("")
    expect(screen.getByDisplayValue("tenant@example.com")).toHaveAttribute(
      "autocomplete",
      "username",
    )
    expect(screen.getByLabelText("Username")).toHaveAttribute(
      "name",
      "username",
    )
    expect(mocks.changePassword).toHaveBeenCalledWith({
      currentPassword: "old-password",
      newPassword: "new-password",
      revokeOtherSessions: true,
    })
  })
})
