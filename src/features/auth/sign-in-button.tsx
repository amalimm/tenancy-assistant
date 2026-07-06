"use client"

import { LogIn, LogOut } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { authClient } from "@features/auth/auth-client"

export interface SignInButtonProps {
  disabled?: boolean
  mode: "sign-in" | "sign-out"
}

export function SignInButton({ disabled = false, mode }: SignInButtonProps) {
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    setIsPending(true)

    try {
      if (mode === "sign-in") {
        await authClient.signIn.social({
          callbackURL: "/dashboard",
          provider: "google",
        })
        return
      }

      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/"
          },
        },
      })
    } finally {
      setIsPending(false)
    }
  }

  const label =
    mode === "sign-in"
      ? isPending
        ? "Opening Google..."
        : "Sign in with Google"
      : isPending
        ? "Signing out..."
        : "Sign out"

  return (
    <Button disabled={disabled || isPending} onClick={handleClick} type="button">
      {mode === "sign-in" ? <LogIn /> : <LogOut />}
      {label}
    </Button>
  )
}
