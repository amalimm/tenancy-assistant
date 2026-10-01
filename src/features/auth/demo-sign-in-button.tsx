"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { authClient } from "@features/auth/auth-client"

export interface DemoSignInButtonProps {
  email: string
  password: string
}

export function DemoSignInButton({ email, password }: DemoSignInButtonProps) {
  const [errorMessage, setErrorMessage] = useState("")
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    setErrorMessage("")
    setIsPending(true)

    const { error } = await authClient.signIn.email({
      callbackURL: "/dashboard",
      email,
      password,
    })

    if (error) {
      setErrorMessage(error.message || "Demo sign-in failed. Try again shortly.")
      setIsPending(false)
      return
    }

    window.location.href = "/dashboard"
  }

  return (
    <div className="grid gap-2">
      <Button className="h-10" disabled={isPending} onClick={handleClick}>
        {isPending ? "Opening demo..." : "Try the demo"}
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        Signs you in as the admin of a sample house. Demo data resets every day.
      </p>
      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  )
}
