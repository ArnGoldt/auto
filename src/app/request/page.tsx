export const dynamic = "force-dynamic";

import { createPublicInquiry } from "@/app/actions/manager";
import { db } from "@/db";
import { workshops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button, Field, Input, Textarea } from "@/components/ui-shell";
import Link from "next/link";

export default async function PublicRequestPage() {
  const branches = await db.query.workshops.findMany({
    where: eq(workshops.active, true),
  });

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-zinc-50 px-4 py-10">
      <h1 className="text-2xl font-semibold">Заявка на ремонт</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Предварительная оценка · клиент в базе создаётся после осмотра в мастерской
      </p>
      <form action={createPublicInquiry} className="mt-6 space-y-3 rounded-xl border bg-white p-4">
        <Field label="Мастерская">
          <select name="workshopId" required className="w-full rounded-lg border px-3 py-2">
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Тип работ">
          <select name="workTypes" className="w-full rounded-lg border px-3 py-2">
            <option value="PAINT">Покраска</option>
            <option value="WELD">Сварка</option>
            <option value="COMBO">Комбинированный</option>
          </select>
        </Field>
        <Field label="Имя">
          <Input name="contactName" required />
        </Field>
        <Field label="Телефон">
          <Input name="contactPhone" required />
        </Field>
        <Field label="Email">
          <Input name="contactEmail" type="email" />
        </Field>
        <Field label="Описание">
          <Textarea name="description" rows={4} required />
        </Field>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="pdConsent" required className="mt-1" />
          Согласие на обработку персональных данных
        </label>
        <Button type="submit" className="w-full py-3">
          Отправить заявку
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/">На главную</Link>
      </p>
    </div>
  );
}
