"use client";

import { useState } from "react";
import { createOperationFromLineAction } from "@/app/actions/manager";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Line = { id: string; operationName: string; zone: string | null };
type Master = { id: string; fullName: string };

export function AssignOperationForm({
  orderId,
  lines,
  masters,
}: {
  orderId: string;
  lines: Line[];
  masters: Master[];
}) {
  const [lineId, setLineId] = useState(lines[0]?.id ?? "");
  const [masterId, setMasterId] = useState(masters[0]?.id ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function assign() {
    setErr(null);
    setMsg(null);
    const line = lines.find((l) => l.id === lineId);
    if (!line || !masterId) return;
    try {
      await createOperationFromLineAction({
        orderId,
        estimateLineId: lineId,
        name: `${line.operationName}${line.zone ? ` — ${line.zone}` : ""}`,
        assigneeUserId: masterId,
      });
      setMsg("Операция назначена мастеру");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Ошибка");
    }
  }

  if (lines.length === 0 || masters.length === 0) return null;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <p className="font-medium text-sm">Назначить операцию мастеру</p>
      <div className="flex flex-wrap gap-2">
        <Select value={lineId} onValueChange={(v) => v && setLineId(v)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {lines.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.operationName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={masterId} onValueChange={(v) => v && setMasterId(v)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {masters.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" onClick={assign}>
          Назначить
        </Button>
      </div>
      {msg && <p className="text-sm text-green-700">{msg}</p>}
      {err && <p className="text-sm text-destructive">{err}</p>}
    </div>
  );
}
