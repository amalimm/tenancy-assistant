import { and, eq } from "drizzle-orm"
import { get } from "@vercel/blob"

import { env } from "@config/env"
import { db } from "@db/client"
import { billUpload, billingCycle, tenant, USER_ROLE } from "@db/schema"
import { getSession } from "@features/auth/auth-server"

interface BillDownloadRouteContext {
  params: Promise<{
    uploadId: string
  }>
}

const notFound = () => new Response("Not found", { status: 404 })

const toContentDisposition = (fileName: string) => {
  const fallbackName = fileName.replace(/[^\x20-\x7E]|["\\\r\n]/g, "_")

  return `inline; filename="${fallbackName || "bill"}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

const canAccessHousehold = async ({
  activeHouseholdId,
  householdId,
  role,
  userId,
}: {
  activeHouseholdId: string | null | undefined
  householdId: string
  role: string
  userId: string
}) => {
  if (role === USER_ROLE.ADMIN) {
    return activeHouseholdId === householdId
  }

  const [linkedTenant] = await db
    .select({ id: tenant.id })
    .from(tenant)
    .where(and(eq(tenant.householdId, householdId), eq(tenant.userId, userId)))
    .limit(1)

  return Boolean(linkedTenant)
}

export const GET = async (
  _request: Request,
  context: BillDownloadRouteContext,
) => {
  const session = await getSession()
  const blobReadWriteToken = env.blobReadWriteToken

  if (!session || !blobReadWriteToken) {
    return notFound()
  }

  const { uploadId } = await context.params
  const [upload] = await db
    .select({
      blobPathname: billUpload.fileUrl,
      fileName: billUpload.fileName,
      householdId: billingCycle.householdId,
    })
    .from(billUpload)
    .innerJoin(
      billingCycle,
      eq(billingCycle.id, billUpload.billingCycleId),
    )
    .where(eq(billUpload.id, uploadId))
    .limit(1)

  if (!upload) {
    return notFound()
  }

  const hasAccess = await canAccessHousehold({
    activeHouseholdId: session.user.activeHouseholdId,
    householdId: upload.householdId,
    role: session.user.role,
    userId: session.user.id,
  })

  if (!hasAccess) {
    return notFound()
  }

  const blob = await get(upload.blobPathname, {
    access: "private",
    token: blobReadWriteToken,
  }).catch(() => null)

  if (!blob || blob.statusCode !== 200) {
    return notFound()
  }

  return new Response(blob.stream, {
    headers: {
      "cache-control": "no-store",
      "content-disposition": toContentDisposition(upload.fileName),
      "content-type": blob.blob.contentType,
    },
  })
}
