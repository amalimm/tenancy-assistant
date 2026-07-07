"use client"

import { KeyRound } from "lucide-react"
import type { FormEvent } from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@features/auth/auth-client"

export function AccountPasswordForm() {
  const [message, setMessage] = useState("")
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage("")
    setIsPending(true)

    const formData = new FormData(event.currentTarget)
    const currentPassword = formData.get("currentPassword")
    const newPassword = formData.get("newPassword")

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      setMessage("Enter your current and new password.")
      setIsPending(false)
      return
    }

    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })

    if (error) {
      setMessage(error.message || "Password update failed.")
      setIsPending(false)
      return
    }

    event.currentTarget.reset()
    setMessage("Password updated.")
    setIsPending(false)
  }

  return (
    <form className="grid gap-3 px-2.5 py-2" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <KeyRound className="size-4 text-muted-foreground" />
        Password
      </div>
      <div className="grid gap-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          autoComplete="current-password"
          id="currentPassword"
          name="currentPassword"
          type="password"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          autoComplete="new-password"
          id="newPassword"
          minLength={10}
          name="newPassword"
          type="password"
        />
      </div>
      {message ? (
        <p className="text-xs leading-5 text-muted-foreground">{message}</p>
      ) : null}
      <Button className="w-fit" disabled={isPending} size="sm" type="submit">
        {isPending ? "Saving..." : "Change password"}
      </Button>
    </form>
  )
}
