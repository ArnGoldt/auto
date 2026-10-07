export const dynamic = "force-dynamic";

import { createPublicInquiry } from "@/app/actions/manager";
import { db } from "@/db";
import { workshops } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  Button,
  Card,
  Field,
  Input,
  PublicChrome,
  Select,
  Textarea,
} from "@/components/ui-shell";
import Link from "next/link";

export default async function PublicRequestPage() {
  const branches = await db.query.workshops.findMany({
    where: eq(workshops.active, true),
  });

  return (
    <PublicChrome
      title="Заявка на ремонт"
      subtitle="Предварительная оценка · клиент в базе создаётся после осмотра в мастерской"
    >
      <Card>
        <form action={createPublicInquiry} className="space-y-1">
          <Field label="Мастерская">
            <Select name="workshopId" required>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Тип работ">
            <Select name="workTypes">
              <option value="PAINT">Покраска</option>
              <option value="WELD">Сварка</option>
              <option value="COMBO">Комбинированный</option>
            </Select>
          </Field>
          <Field label="Имя">
            <Input name="contactName" required />
          </Field>
          <Field label="Телефон">
            <Input name="contactPhone" type="tel" required />
          </Field>
          <Field label="Email">
            <Input name="contactEmail" type="email" />
          </Field>
          <Field label="Описание">
            <Textarea name="description" rows={4} required />
          </Field>
          <label className="mb-4 flex gap-3 rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3 text-sm leading-snug">
            <input
              type="checkbox"
              name="pdConsent"
              required
              className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
            />
            Согласие на обработку персональных данных
          </label>
          <Button type="submit" size="lg" className="w-full">
            Отправить заявку
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        <Link
          href="/"
          className="font-medium text-[var(--navy-800)] underline-offset-2 hover:underline"
        >
          На главную
        </Link>
      </p>
    </PublicChrome>
  );
}
