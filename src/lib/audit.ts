import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function writeAudit(input: {
  organizationId?: string;
  workshopId?: string;
  entityType: string;
  entityId: string;
  action: string;
  payload?: Record<string, unknown>;
  actorStaffId?: string;
  actorClientAccountId?: string;
}) {
  await db.insert(auditLogs).values({
    organizationId: input.organizationId,
    workshopId: input.workshopId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    payload: input.payload ?? null,
    actorStaffId: input.actorStaffId,
    actorClientAccountId: input.actorClientAccountId,
  });
}
