import { PromotionForm } from "../promotion-form";
import { db } from "@/db";
import { promotions, workshops } from "@/db/schema";
import { requireStaff } from "@/lib/staff-data";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { session } = await requireStaff([
    "MANAGER",
    "NETWORK_ADMIN",
    "NETWORK_DIRECTOR",
  ]);
  const { id } = await params;
  const promo = await db.query.promotions.findFirst({
    where: eq(promotions.id, id),
  });
  if (!promo || promo.organizationId !== session.organizationId) notFound();

  const branches = await db.query.workshops.findMany({
    where: eq(workshops.organizationId, session.organizationId),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-2xl font-semibold">Редактирование акции</h2>
      <PromotionForm
        organizationId={session.organizationId}
        workshops={branches.map((b) => ({ id: b.id, name: b.name }))}
        initial={promo}
      />
    </div>
  );
}
