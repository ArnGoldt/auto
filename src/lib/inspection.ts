import { db } from "@/db";
import {
  clients,
  inquiries,
  orders,
  orderEvents,
  vehicles,
  estimateVersions,
  estimateLines,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { findExistingClient } from "./clients-dedupe";
import { writeAudit } from "./audit";

export type InspectionInput = {
  inquiryId: string;
  organizationId: string;
  workshopId: string;
  fullName: string;
  phone?: string;
  email?: string;
  consentPd: boolean;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  plate?: string;
  color?: string;
  inspectionNotes?: string;
  promisedDate?: string;
  managerUserId: string;
};

export async function saveInspection(input: InspectionInput) {
  if (!input.consentPd) {
    throw new Error("Требуется согласие на обработку персональных данных");
  }

  return db.transaction(async (tx) => {
    const existing = await findExistingClient(
      input.organizationId,
      input.phone,
      input.email,
    );

    let clientId: string;
    let clientCreated = false;

    if (existing) {
      clientId = existing.id;
      await tx
        .update(clients)
        .set({
          fullName: input.fullName || existing.fullName,
          phone: input.phone ?? existing.phone,
          email: input.email ?? existing.email,
          updatedAt: new Date(),
        })
        .where(eq(clients.id, existing.id));
    } else {
      const [created] = await tx
        .insert(clients)
        .values({
          organizationId: input.organizationId,
          fullName: input.fullName,
          phone: input.phone,
          email: input.email,
          consentPdAt: new Date(),
        })
        .returning();
      clientId = created.id;
      clientCreated = true;
    }

    const [vehicle] = await tx
      .insert(vehicles)
      .values({
        organizationId: input.organizationId,
        clientId,
        make: input.make,
        model: input.model,
        year: input.year,
        vin: input.vin,
        plate: input.plate,
        color: input.color,
      })
      .returning();

    const promised = input.promisedDate
      ? new Date(input.promisedDate)
      : undefined;

    const [order] = await tx
      .insert(orders)
      .values({
        organizationId: input.organizationId,
        workshopId: input.workshopId,
        clientId,
        vehicleId: vehicle.id,
        inquiryId: input.inquiryId,
        salesStatus: "estimate_draft",
        productionStatus: "intake",
        inspectionNotes: input.inspectionNotes,
        promisedDateOriginal: promised,
        promisedDateCurrent: promised,
      })
      .returning();

    await tx
      .update(inquiries)
      .set({
        clientId,
        salesStatus: "inspection",
        funnelStage: "inspection_done",
      })
      .where(eq(inquiries.id, input.inquiryId));

    const [estimate] = await tx
      .insert(estimateVersions)
      .values({
        orderId: order.id,
        versionNumber: 1,
        kind: "preliminary",
        totalAmount: "0",
        createdByUserId: input.managerUserId,
      })
      .returning();

    await tx.insert(orderEvents).values({
      orderId: order.id,
      title: "Осмотр и приёмка",
      body: "Заказ создан после осмотра",
      visibleToClient: true,
    });

    await writeAudit({
      organizationId: input.organizationId,
      entityType: "client",
      entityId: clientId,
      action: clientCreated ? "client_created_from_inspection" : "client_linked_from_inspection",
      payload: { inquiryId: input.inquiryId, orderId: order.id },
      userId: input.managerUserId,
    });

    return { clientId, vehicleId: vehicle.id, orderId: order.id, estimateVersionId: estimate.id };
  });
}
