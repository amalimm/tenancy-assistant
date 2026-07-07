"use client"

import { KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { TemporaryPasswordField } from "./temporary-password-field"

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
  return (
    <Popover>
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
        <form action={action} className="grid gap-3">
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
          />
          <Button type="submit">Save password</Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
