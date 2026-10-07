"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { completeInspectionAction } from "@/app/actions/manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function InspectionForm({
  inquiryId,
  workshopId,
  defaults,
}: {
  inquiryId: string;
  workshopId: string;
  defaults: {
    contactName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    description?: string | null;
  };
}) {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) {
      setError("Нужно согласие на обработку ПДн");
      return;
    }
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await completeInspectionAction({
        inquiryId,
        workshopId,
        fullName: fd.get("fullName") as string,
        phone: fd.get("phone") as string,
        email: (fd.get("email") as string) || undefined,
        consentPd: true,
        make: fd.get("make") as string,
        model: fd.get("model") as string,
        year: Number(fd.get("year")) || undefined,
        plate: fd.get("plate") as string,
        vin: (fd.get("vin") as string) || undefined,
        color: (fd.get("color") as string) || undefined,
        inspectionNotes: fd.get("inspectionNotes") as string,
        promisedDate: (fd.get("promisedDate") as string) || undefined,
      });
      router.push(`/app/orders/${result.orderId}`);
      router.refresh();
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-2xl border rounded-lg p-6">
      <h2 className="font-semibold text-lg">Акт осмотра и приёмки</h2>
      <p className="text-sm text-muted-foreground">
        При сохранении будут созданы или привязаны клиент и автомобиль, откроется заказ.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="fullName">ФИО клиента</Label>
          <Input id="fullName" name="fullName" defaultValue={defaults.contactName ?? ""} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">Телефон</Label>
          <Input id="phone" name="phone" defaultValue={defaults.contactPhone ?? ""} required />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaults.contactEmail ?? ""} />
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="make">Марка</Label>
          <Input id="make" name="make" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="model">Модель</Label>
          <Input id="model" name="model" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="year">Год</Label>
          <Input id="year" name="year" type="number" min={1980} max={2030} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="plate">Госномер</Label>
          <Input id="plate" name="plate" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="color">Цвет</Label>
          <Input id="color" name="color" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="vin">VIN</Label>
          <Input id="vin" name="vin" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="inspectionNotes">Заметки осмотра</Label>
        <Textarea
          id="inspectionNotes"
          name="inspectionNotes"
          defaultValue={defaults.description ?? ""}
          rows={4}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="promisedDate">Обещанная дата выдачи</Label>
        <Input id="promisedDate" name="promisedDate" type="date" />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} />
        <span>Согласие на обработку персональных данных (152-ФЗ)</span>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Сохранение…" : "Завершить осмотр и создать заказ"}
      </Button>
    </form>
  );
}
