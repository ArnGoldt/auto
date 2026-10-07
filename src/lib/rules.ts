import type { checklistItems } from "@/db/schema";

export type ChecklistRow = typeof checklistItems.$inferSelect;

export function supplementBlocksWork(status: string) {
  return status === "BLOCKED" || status === "PENDING_CLIENT" || status === "DRAFT";
}

export function canCompleteOperation(items: ChecklistRow[]) {
  const required = items.filter((i) => i.required);
  return required.every((i) => {
    if (!i.completed) return false;
    if (i.requiresPhoto && !i.photoPath) return false;
    return true;
  });
}

export function canReleaseOrder(
  openRequiredChecklists: number,
  qcPassed: boolean,
) {
  return openRequiredChecklists === 0 && qcPassed;
}
