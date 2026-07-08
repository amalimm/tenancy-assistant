"use client"

import type { FormEvent } from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { authClient } from "@features/auth/auth-client"

export interface TenantSignInFormProps {
  className?: string
  hideIntro?: boolean
}

export function TenantSignInForm({
  className,
  hideIntro = false,
}: TenantSignInFormProps) {
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
    <form className={cn("grid gap-4", className)} onSubmit={handleSubmit}>
      {hideIntro ? null : (
        <div>
          <h2 className="text-base font-semibold">Tenant login</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Use the email and temporary password from your admin.
          </p>
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="tenantEmail">Email</Label>
        <Input
          autoComplete="email"
          className="h-10 bg-background px-3"
          id="tenantEmail"
          name="tenantEmail"
          required
          type="email"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="tenantPassword">Password</Label>
        <Input
          autoComplete="current-password"
          className="h-10 bg-background px-3"
          id="tenantPassword"
          name="tenantPassword"
          required
          type="password"
        />
      </div>
      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
      <Button
        className="h-10"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Signing in..." : "Login"}
      </Button>
    </form>
  )
}
