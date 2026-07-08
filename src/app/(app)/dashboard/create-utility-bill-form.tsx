"use client"

import { ReceiptText } from "lucide-react"
import type { FormEvent } from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UTILITY_TYPE } from "@db/schema"
import { DateRangeFields } from "@shared/ui/date-range-fields"

import { createBillingCycleAction } from "./actions"

const UTILITY_TYPE_LABEL = {
  [UTILITY_TYPE.ELECTRICITY]: "Electricity",
  [UTILITY_TYPE.WATER]: "Water",
  [UTILITY_TYPE.INTERNET]: "Internet",
  [UTILITY_TYPE.OTHER]: "Other",
} as const

export interface CreateUtilityBillFormProps {
  householdId: string
}

export function CreateUtilityBillForm({
  householdId,
}: CreateUtilityBillFormProps) {
  const [errorMessage, setErrorMessage] = useState("")
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")
    setIsPending(true)

    try {
      await createBillingCycleAction(new FormData(event.currentTarget))
      event.currentTarget.reset()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Save failed.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form className="grid gap-4 p-5" onSubmit={handleSubmit}>
      <input name="householdId" type="hidden" value={householdId} />
      <div className="grid gap-2">
        <Label htmlFor="billName">Bill name (optional)</Label>
        <Input id="billName" name="name" placeholder="Auto" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="utilityType">Utility type</Label>
        <Select defaultValue={UTILITY_TYPE.ELECTRICITY} name="utilityType">
          <SelectTrigger className="w-full" id="utilityType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(UTILITY_TYPE_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DateRangeFields
        calendarDensity="compact"
        endName="endDate"
        id="billPeriod"
        label="Bill period"
        numberOfMonths={2}
        placeholder="Start Date - End Date"
        requireCompleteRange
        startName="startDate"
      />
      <div className="grid gap-2">
        <Label htmlFor="totalAmount">Total amount</Label>
        <Input
          id="totalAmount"
          inputMode="decimal"
          name="totalAmount"
          placeholder="300.00"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="billNotes">Notes</Label>
        <Textarea id="billNotes" name="notes" />
      </div>
      {errorMessage ? (
        <p aria-live="polite" className="text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
      <Button disabled={isPending} type="submit">
        <ReceiptText />
        {isPending ? "Saving..." : "Save bill"}
      </Button>
    </form>
  )
}
