"use client"

import { LogIn, LogOut } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { authClient } from "@features/auth/auth-client"

const SIGN_IN_BUTTON_VARIANT = {
  DEFAULT: "default",
  GHOST: "ghost",
  OUTLINE: "outline",
} as const

type SignInButtonVariant =
  (typeof SIGN_IN_BUTTON_VARIANT)[keyof typeof SIGN_IN_BUTTON_VARIANT]

export interface SignInButtonProps {
  className?: string
  disabled?: boolean
  mode: "sign-in" | "sign-out"
  variant?: SignInButtonVariant
}

export function SignInButton({
  className,
  disabled = false,
  mode,
  variant,
}: SignInButtonProps) {
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
    <Button
      disabled={disabled || isPending}
      className={className}
      onClick={handleClick}
      type="button"
      variant={variant ?? (mode === "sign-out" ? "outline" : "default")}
    >
      {mode === "sign-in" ? <LogIn /> : <LogOut />}
      {label}
    </Button>
  )
}
