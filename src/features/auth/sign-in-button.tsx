"use client"

import { LogOut } from "lucide-react"
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

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 18 18">
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.72H.94v2.33A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.96 10.7A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.16.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.34 2.82.94 4.03l3.02-2.33Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.5.45 3.43 1.35l2.59-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .94 4.97L3.96 7.3C4.67 5.16 6.66 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
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
      {mode === "sign-out" ? <LogOut /> : <GoogleIcon />}
      {label}
    </Button>
  )
}
