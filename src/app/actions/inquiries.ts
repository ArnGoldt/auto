"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { requireManagerSession } from "@/lib/auth";

export async function createInquiryAction(input: {
  workshopId: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  description: string;
}) {
  const session = await requireManagerSession();
  const [row] = await db
    .insert(inquiries)
    .values({
      organizationId: session.user.organizationId,
      workshopId: input.workshopId,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
      description: input.description,
      source: "manager",
      funnelStage: "new",
    })
    .returning();

  revalidatePath("/app/inquiries");
  return row.id;
}
