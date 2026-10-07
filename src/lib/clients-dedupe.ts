import { db } from "@/db";
import { clients } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";

export async function findExistingClient(
  organizationId: string,
  phone?: string | null,
  email?: string | null,
) {
  const normalizedPhone = phone?.replace(/\D/g, "") || null;
  const normalizedEmail = email?.trim().toLowerCase() || null;

  if (!normalizedPhone && !normalizedEmail) return null;

  const all = await db.query.clients.findMany({
    where: eq(clients.organizationId, organizationId),
  });

  return (
    all.find((c) => {
      const cPhone = c.phone?.replace(/\D/g, "");
      const cEmail = c.email?.trim().toLowerCase();
      if (normalizedPhone && cPhone && cPhone === normalizedPhone) return true;
      if (normalizedEmail && cEmail && cEmail === normalizedEmail) return true;
      return false;
    }) ?? null
  );
}
