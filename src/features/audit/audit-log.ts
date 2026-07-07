import { db } from "@db/client"
import {
  auditLog,
  type AuditAction,
  type AuditEntity,
} from "@db/schema"

export type AuditMetadataValue =
  | boolean
  | null
  | number
  | string
  | string[]

export type AuditMetadata = Record<string, AuditMetadataValue>

export interface RecordAuditLogInput {
  action: AuditAction
  actorEmail: string
  actorUserId: string
  entityId?: string | null
  entityType: AuditEntity
  householdId: string
  metadata?: AuditMetadata
  targetLabel?: string | null
}

const SENSITIVE_METADATA_KEY_PARTS = [
  "password",
  "secret",
  "token",
  "credential",
  "auth",
] as const

const isSensitiveMetadataKey = (key: string) => {
  const normalizedKey = key.toLowerCase()

  return SENSITIVE_METADATA_KEY_PARTS.some((part) =>
    normalizedKey.includes(part),
  )
}

export const sanitizeAuditMetadata = (
  metadata: AuditMetadata | undefined,
): AuditMetadata | null => {
  if (!metadata) {
    return null
  }

  const sanitizedEntries = Object.entries(metadata).filter(
    ([key]) => !isSensitiveMetadataKey(key),
  )

  if (sanitizedEntries.length === 0) {
    return null
  }

  return Object.fromEntries(sanitizedEntries)
}

export const recordAuditLog = async ({
  action,
  actorEmail,
  actorUserId,
  entityId = null,
  entityType,
  householdId,
  metadata,
  targetLabel = null,
}: RecordAuditLogInput) => {
  const sanitizedMetadata = sanitizeAuditMetadata(metadata)

  await db.insert(auditLog).values({
    action,
    actorEmail,
    actorUserId,
    entityId,
    entityType,
    householdId,
    id: crypto.randomUUID(),
    metadata: sanitizedMetadata ? JSON.stringify(sanitizedMetadata) : null,
    targetLabel,
  })
}
