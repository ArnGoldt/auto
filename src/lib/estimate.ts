import { db } from "@/db";
import {
  estimateLines,
  estimateVersions,
  type estimateLines as estimateLinesTable,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export type EstimateLineDraft = Omit<
  typeof estimateLinesTable.$inferInsert,
  "estimateVersionId" | "id"
>;

export async function getLatestEstimateForOrder(orderId: string) {
  const latest = await db.query.estimateVersions.findFirst({
    where: eq(estimateVersions.orderId, orderId),
    orderBy: [desc(estimateVersions.versionNumber)],
  });
  if (!latest) return { version: null, lines: [] as EstimateLineDraft[] };
  const lines = await db.query.estimateLines.findMany({
    where: eq(estimateLines.estimateVersionId, latest.id),
  });
  return { version: latest, lines };
}

export async function createEstimateRevisionFromLines(
  orderId: string,
  createdByUserId: string,
  lines: EstimateLineDraft[],
  note?: string,
) {
  const last = await db.query.estimateVersions.findFirst({
    where: eq(estimateVersions.orderId, orderId),
    orderBy: [desc(estimateVersions.versionNumber)],
  });
  const versionNumber = (last?.versionNumber ?? 0) + 1;
  const kind =
    versionNumber === 1 ? "PRELIMINARY" : last?.kind === "AGREED" ? "REVISION" : "REVISION";

  const [ver] = await db
    .insert(estimateVersions)
    .values({
      orderId,
      kind: kind as "PRELIMINARY" | "REVISION" | "AGREED",
      versionNumber,
      note,
      createdByUserId,
    })
    .returning();

  if (lines.length > 0) {
    await db.insert(estimateLines).values(
      lines.map((l, idx) => ({
        ...l,
        estimateVersionId: ver.id,
        sortOrder: l.sortOrder ?? idx,
      })),
    );
  }
  return ver;
}
