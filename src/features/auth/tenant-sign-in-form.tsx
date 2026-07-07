"use client"

import { LogIn } from "lucide-react"
import type { FormEvent } from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@features/auth/auth-client"

export function TenantSignInForm() {
  const [errorMessage, setErrorMessage] = useState("")
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")
    setIsPending(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("tenantEmail")
    const password = formData.get("tenantPassword")

    if (typeof email !== "string" || typeof password !== "string") {
      setErrorMessage("Enter your email and password.")
      setIsPending(false)
      return
    }

    const { error } = await authClient.signIn.email({
      callbackURL: "/dashboard",
      email,
      password,
    })

    if (error) {
      setErrorMessage(error.message || "Sign-in failed. Check your details.")
      setIsPending(false)
      return
    }

    window.location.href = "/dashboard"
  }

  return (
    <form
      className="grid w-full max-w-sm gap-3 rounded-lg border bg-card p-4 text-card-foreground"
      onSubmit={handleSubmit}
    >
      <div>
        <h2 className="text-sm font-semibold">Tenant login</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the email and temporary password from your admin.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="tenantEmail">Email</Label>
        <Input
          autoComplete="email"
          id="tenantEmail"
          name="tenantEmail"
          type="email"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="tenantPassword">Password</Label>
        <Input
          autoComplete="current-password"
          id="tenantPassword"
          name="tenantPassword"
          type="password"
        />
      </div>
      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
      <Button disabled={isPending} type="submit">
        <LogIn />
        {isPending ? "Signing in..." : "Open tenant dashboard"}
      </Button>
    </form>
  )
}
