import { createWorkshop, updateWorkshop } from "@/app/actions/admin";
import { Button, Field, Input } from "@/components/ui-shell";
import type { workshops } from "@/db/schema";

type Workshop = typeof workshops.$inferSelect;

export function WorkshopForm({ initial }: { initial?: Workshop }) {
  const action = initial ? updateWorkshop : createWorkshop;

  return (
    <form
      action={action}
      className="max-w-lg space-y-1 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-white p-6 shadow-[var(--shadow-card)]"
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <Field label="Название">
        <Input name="name" required defaultValue={initial?.name} />
      </Field>
      <Field label="Адрес">
        <Input name="address" defaultValue={initial?.address ?? ""} />
      </Field>
      <Field label="Телефон">
        <Input name="phone" type="tel" defaultValue={initial?.phone ?? ""} />
      </Field>
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={initial?.active ?? true}
          className="size-4 rounded border-[var(--border)]"
        />
        <span className="font-medium text-[var(--navy-800)]">Филиал активен</span>
      </label>
      <Button type="submit">{initial ? "Сохранить" : "Создать филиал"}</Button>
    </form>
  );
}
