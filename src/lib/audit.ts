import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function writeAudit(params: {
  organizationId: string;
  entityType: string;
  entityId: string;
  action: string;
  payload?: Record<string, unknown>;
  userId?: string | null;
  clientAccountId?: string | null;
}) {
  await db.insert(auditLogs).values({
    organizationId: params.organizationId,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    payload: params.payload ?? null,
    userId: params.userId ?? null,
    clientAccountId: params.clientAccountId ?? null,
  });
}
