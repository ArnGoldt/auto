"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createInquiryAction } from "@/app/actions/inquiries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Workshop = { id: string; name: string };

export function InquiryCreateForm({ workshops }: { workshops: Workshop[] }) {
  const router = useRouter();
  const [workshopId, setWorkshopId] = useState(workshops[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const id = await createInquiryAction({
        workshopId,
        contactName: fd.get("contactName") as string,
        contactPhone: fd.get("contactPhone") as string,
        contactEmail: (fd.get("contactEmail") as string) || undefined,
        description: fd.get("description") as string,
      });
      router.push(`/app/inquiries/${id}/inspection`);
      router.refresh();
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Ошибка");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 border rounded-lg p-4 max-w-xl">
      <p className="font-medium">Новое обращение (без создания клиента)</p>
      <div className="space-y-2">
        <Label>Филиал</Label>
        <Select value={workshopId} onValueChange={(v) => v && setWorkshopId(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите филиал" />
          </SelectTrigger>
          <SelectContent>
            {workshops.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="contactName">Имя</Label>
          <Input id="contactName" name="contactName" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contactPhone">Телефон</Label>
          <Input id="contactPhone" name="contactPhone" required />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="contactEmail">Email</Label>
        <Input id="contactEmail" name="contactEmail" type="email" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Описание</Label>
        <Textarea id="description" name="description" required rows={3} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit">Создать и перейти к осмотру</Button>
    </form>
  );
}
