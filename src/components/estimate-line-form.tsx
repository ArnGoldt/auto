"use client";

import { useState } from "react";
import { addEstimateLineAction } from "@/app/actions/manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EstimateLineForm({
  orderId,
  estimateVersionId,
}: {
  orderId: string;
  estimateVersionId: string;
}) {
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await addEstimateLineAction({
        orderId,
        estimateVersionId,
        zone: fd.get("zone") as string,
        operationName: fd.get("operationName") as string,
        price: fd.get("price") as string,
      });
      e.currentTarget.reset();
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Ошибка");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid sm:grid-cols-4 gap-2 items-end">
      <div className="space-y-1">
        <Label>Зона</Label>
        <Input name="zone" required />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label>Операция</Label>
        <Input name="operationName" required />
      </div>
      <div className="space-y-1">
        <Label>Цена, ₽</Label>
        <Input name="price" type="number" min={0} step="0.01" required />
      </div>
      <Button type="submit" className="sm:col-span-4 w-fit">
        Добавить строку
      </Button>
      {error && <p className="text-sm text-destructive sm:col-span-4">{error}</p>}
    </form>
  );
}
