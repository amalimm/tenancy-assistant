"use client"

import { Check, Copy, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
const TEMPORARY_PASSWORD_LENGTH = 14

const createTemporaryPassword = () => {
  const values = new Uint32Array(TEMPORARY_PASSWORD_LENGTH)

  crypto.getRandomValues(values)

  return Array.from(values, (value) =>
    PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]
  ).join("")
}

export interface TemporaryPasswordFieldProps {
  description?: string
  id: string
  label?: string
  name: string
  onGenerate?: () => void
}

export function TemporaryPasswordField({
  description,
  id,
  label = "Temporary password",
  name,
  onGenerate,
}: TemporaryPasswordFieldProps) {
  const [copied, setCopied] = useState(false)
  const [password, setPassword] = useState("")

  useEffect(() => {
    setPassword(createTemporaryPassword())
  }, [])

  const handleGenerate = () => {
    setCopied(false)
    setPassword(createTemporaryPassword())
    onGenerate?.()
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password)
    setCopied(true)
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          autoComplete="new-password"
          className="font-mono"
          id={id}
          minLength={10}
          name={name}
          readOnly
          required
          value={password}
        />
        <Button
          aria-label="Generate temporary password"
          onClick={handleGenerate}
          size="icon"
          type="button"
          variant="outline"
        >
          <RefreshCw />
        </Button>
        <Button
          aria-label="Copy temporary password"
          disabled={!password}
          onClick={handleCopy}
          size="icon"
          type="button"
          variant="outline"
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      {description ? (
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}
