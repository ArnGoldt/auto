import { completeInspection } from "@/app/actions/manager";
import { db } from "@/db";
import { inquiries, workshops } from "@/db/schema";
import { Button, Field, Input, Textarea } from "@/components/ui-shell";
import { requireStaff } from "@/lib/staff-data";
import { eq } from "drizzle-orm";

export default async function InspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const inquiry = await db.query.inquiries.findFirst({
    where: eq(inquiries.id, id),
  });
  if (!inquiry) return <p>Обращение не найдено</p>;
  const workshop = await db.query.workshops.findFirst({
    where: eq(workshops.id, inquiry.workshopId),
  });

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold">Осмотр и приёмка</h2>
      <p className="text-sm text-zinc-600">
        {workshop?.name} · после сохранения клиент и автомобиль создаются автоматически
      </p>
      <form action={completeInspection} className="mt-6 space-y-2 rounded-xl border bg-white p-4">
        <input type="hidden" name="inquiryId" value={inquiry.id} />
        <input type="hidden" name="workshopId" value={inquiry.workshopId} />
        <Field label="ФИО клиента">
          <Input name="fullName" required defaultValue={inquiry.contactName ?? ""} />
        </Field>
        <Field label="Телефон">
          <Input name="phone" required defaultValue={inquiry.contactPhone ?? ""} />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" defaultValue={inquiry.contactEmail ?? ""} />
        </Field>
        <Field label="Марка">
          <Input name="make" required placeholder="Toyota" />
        </Field>
        <Field label="Модель">
          <Input name="model" required placeholder="Camry" />
        </Field>
        <Field label="Госномер">
          <Input name="plate" placeholder="А123BC777" />
        </Field>
        <Field label="Заметки приёмки">
          <Textarea name="intakeNotes" rows={3} defaultValue={inquiry.description ?? ""} />
        </Field>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="pdConsent" required defaultChecked className="mt-1" />
          <span>Согласие на обработку персональных данных (152-ФЗ)</span>
        </label>
        <Button type="submit" className="mt-2 w-full py-3 text-base">
          Завершить осмотр и создать заказ
        </Button>
      </form>
    </div>
  );
}
