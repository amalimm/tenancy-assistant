"use client"

import { useFormStatus } from "react-dom"
import type { ComponentProps, ReactNode } from "react"

import { Button } from "@/components/ui/button"

export interface PendingSubmitButtonProps
  extends Omit<ComponentProps<typeof Button>, "children" | "disabled" | "type"> {
  children: ReactNode
  disabled?: boolean
  pendingLabel?: string
}

export function PendingSubmitButton({
  children,
  disabled = false,
  pendingLabel = "Saving...",
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button disabled={disabled || pending} type="submit" {...props}>
      {pending ? pendingLabel : children}
    </Button>
  )
}
