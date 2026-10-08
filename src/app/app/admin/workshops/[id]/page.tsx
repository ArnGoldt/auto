import { WorkshopForm } from "@/app/app/admin/workshops/workshop-form";
import { PageTitle } from "@/components/ui-shell";
import { db } from "@/db";
import { workshops } from "@/db/schema";
import { requireNetworkAdmin } from "@/lib/staff-data";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function EditWorkshopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { session } = await requireNetworkAdmin();
  const { id } = await params;
  const workshop = await db.query.workshops.findFirst({
    where: and(
      eq(workshops.id, id),
      eq(workshops.organizationId, session.organizationId),
    ),
  });
  if (!workshop) notFound();

  return (
    <div>
      <PageTitle title={`Филиал: ${workshop.name}`} />
      <WorkshopForm initial={workshop} />
    </div>
  );
}
