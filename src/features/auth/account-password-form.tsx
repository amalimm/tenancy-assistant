"use client"

import type { FormEvent } from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { authClient } from "@features/auth/auth-client"

export function AccountPasswordForm({
  className,
  email,
}: {
  className?: string
  email?: string
}) {
  const [message, setMessage] = useState("")
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget

    setMessage("")
    setIsPending(true)

    const formData = new FormData(form)
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

    form.reset()
    setMessage("Password updated.")
    setIsPending(false)
  }

  return (
    <form className={cn("grid gap-3", className)} onSubmit={handleSubmit}>
      {email ? (
        <div className="sr-only">
          <Label htmlFor="accountPasswordUsername">Username</Label>
          <input
            autoComplete="username"
            id="accountPasswordUsername"
            name="username"
            readOnly
            tabIndex={-1}
            type="email"
            value={email}
          />
        </div>
      ) : null}
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
