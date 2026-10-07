"use client";

import { useState } from "react";
import {
  completeOperationAction,
  startOperationAction,
  toggleChecklistItemAction,
  uploadChecklistPhotoAction,
} from "@/app/actions/master";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { operationStatusLabels } from "@/lib/labels";

type Item = {
  id: string;
  label: string;
  required: boolean;
  requiresPhoto: boolean;
  completed: boolean;
  photoCount: number;
};

export function MasterOperationClient({
  operationId,
  status,
  items,
}: {
  operationId: string;
  status: string;
  items: Item[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      await startOperationAction(operationId);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(itemId: string, checked: boolean) {
    setError(null);
    try {
      await toggleChecklistItemAction(itemId, checked);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Ошибка");
    }
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      await completeOperationAction(operationId);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function onPhoto(itemId: string, file: File | null) {
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("itemId", itemId);
    fd.set("file", file);
    try {
      await uploadChecklistPhotoAction(fd);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Ошибка загрузки");
    }
  }

  return (
    <div className="space-y-4">
      <Badge className="text-base px-3 py-1">{operationStatusLabels[status]}</Badge>

      {status === "assigned" && (
        <Button size="lg" className="w-full min-h-[52px] text-base" onClick={start} disabled={busy}>
          Принять в работу
        </Button>
      )}

      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="border rounded-xl p-4 space-y-3">
            <label className="flex items-start gap-3">
              <Checkbox
                className="mt-1 h-6 w-6"
                checked={item.completed}
                disabled={status === "assigned" || status === "completed"}
                onCheckedChange={(v) => toggle(item.id, v === true)}
              />
              <span className="text-base leading-snug">
                {item.label}
                {item.required && <span className="text-destructive"> *</span>}
              </span>
            </label>
            {item.requiresPhoto && (
              <div className="pl-9 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="text-sm w-full"
                  disabled={status === "assigned" || status === "completed"}
                  onChange={(e) => onPhoto(item.id, e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">
                  Фото: {item.photoCount} {item.requiresPhoto && !item.photoCount ? "(обязательно)" : ""}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>

      {status === "in_progress" && (
        <Button
          size="lg"
          className="w-full min-h-[52px] text-base"
          variant="default"
          onClick={finish}
          disabled={busy}
        >
          Завершить операцию
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
