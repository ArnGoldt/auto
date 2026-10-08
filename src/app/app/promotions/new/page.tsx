import { PromotionForm } from "../promotion-form";
import { requireStaff } from "@/lib/staff-data";
import { db } from "@/db";
import { workshops } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function NewPromotionPage() {
  const { session } = await requireStaff([
    "MANAGER",
    "NETWORK_ADMIN",
    "NETWORK_DIRECTOR",
  ]);
  const branches = await db.query.workshops.findMany({
    where: eq(workshops.organizationId, session.organizationId),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-2xl font-semibold">Новая акция</h2>
      <PromotionForm
        organizationId={session.organizationId}
        workshops={branches.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
