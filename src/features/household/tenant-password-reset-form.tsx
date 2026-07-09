"use client"

import { KeyRound } from "lucide-react"
import type { FormEvent } from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { TemporaryPasswordField } from "./temporary-password-field"

const PASSWORD_SAVE_STATUS = {
  IDLE: "idle",
  SAVED: "saved",
  SAVING: "saving",
} as const

type PasswordSaveStatus =
  (typeof PASSWORD_SAVE_STATUS)[keyof typeof PASSWORD_SAVE_STATUS]

export interface TenantPasswordResetFormProps {
  action: (formData: FormData) => Promise<void>
  tenantId: string
  tenantName: string
}

export function TenantPasswordResetForm({
  action,
  tenantId,
  tenantName,
}: TenantPasswordResetFormProps) {
  const [errorMessage, setErrorMessage] = useState("")
  const [saveStatus, setSaveStatus] = useState<PasswordSaveStatus>(
    PASSWORD_SAVE_STATUS.IDLE,
  )

  const resetFeedback = () => {
    setErrorMessage("")
    setSaveStatus(PASSWORD_SAVE_STATUS.IDLE)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget

    setErrorMessage("")
    setSaveStatus(PASSWORD_SAVE_STATUS.SAVING)

    try {
      await action(new FormData(form))
      setSaveStatus(PASSWORD_SAVE_STATUS.SAVED)
    } catch (error) {
      setSaveStatus(PASSWORD_SAVE_STATUS.IDLE)
      setErrorMessage(
        error instanceof Error ? error.message : "Password update failed.",
      )
    }
  }

  const buttonLabel = {
    [PASSWORD_SAVE_STATUS.IDLE]: "Save password",
    [PASSWORD_SAVE_STATUS.SAVED]: "Saved",
    [PASSWORD_SAVE_STATUS.SAVING]: "Saving...",
  }[saveStatus]

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) {
          resetFeedback()
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          aria-label={`Set password for ${tenantName}`}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <KeyRound />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <input name="tenantId" type="hidden" value={tenantId} />
          <div>
            <h3 className="text-sm font-semibold">Set tenant password</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate a temporary password for {tenantName}.
            </p>
          </div>
          <TemporaryPasswordField
            description="Share this with the tenant after saving."
            id={`temporary-password-${tenantId}`}
            name="temporaryPassword"
            onGenerate={resetFeedback}
          />
          {errorMessage ? (
            <p aria-live="polite" className="text-xs leading-5 text-destructive">
              {errorMessage}
            </p>
          ) : null}
          <Button
            disabled={saveStatus === PASSWORD_SAVE_STATUS.SAVING}
            type="submit"
          >
            {buttonLabel}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
