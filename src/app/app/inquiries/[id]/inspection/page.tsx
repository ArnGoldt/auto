import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { InspectionForm } from "@/components/inspection-form";

export default async function InspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const inquiry = await db.query.inquiries.findFirst({
    where: eq(inquiries.id, id),
    with: { workshop: true },
  });
  if (!inquiry || inquiry.organizationId !== session!.user.organizationId) {
    notFound();
  }
  if (inquiry.clientId) {
    return (
      <p className="text-muted-foreground">
        Осмотр уже выполнен.{" "}
        <Link href={`/app/clients/${inquiry.clientId}`} className="underline">
          Открыть клиента
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/app/inquiries" className="text-sm text-muted-foreground hover:underline">
        ← Обращения
      </Link>
      <p className="text-sm">
        Филиал: <strong>{inquiry.workshop?.name}</strong>
      </p>
      <InspectionForm
        inquiryId={inquiry.id}
        workshopId={inquiry.workshopId}
        defaults={{
          contactName: inquiry.contactName,
          contactPhone: inquiry.contactPhone,
          contactEmail: inquiry.contactEmail,
          description: inquiry.description,
        }}
      />
    </div>
  );
}
