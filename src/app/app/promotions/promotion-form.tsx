import { upsertPromotion } from "@/app/actions/promotions";
import { Button, Field, Input, Select, Textarea } from "@/components/ui-shell";
import type { promotions } from "@/db/schema";

type Promo = typeof promotions.$inferSelect;

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function PromotionForm({
  organizationId,
  workshops,
  initial,
}: {
  organizationId: string;
  workshops: { id: string; name: string }[];
  initial?: Promo;
}) {
  const defaultFrom = initial?.validFrom ?? new Date();
  const defaultTo =
    initial?.validTo ?? new Date(Date.now() + 90 * 86400000);

  return (
    <form
      action={upsertPromotion}
      className="space-y-3 rounded-xl border bg-white p-4"
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="organizationId" value={organizationId} />
      <Field label="Название">
        <Input name="name" required defaultValue={initial?.name} />
      </Field>
      <Field label="Описание">
        <Textarea name="description" rows={2} defaultValue={initial?.description ?? ""} />
      </Field>
      <Field label="Тип скидки">
        <Select name="type" defaultValue={initial?.type ?? "PERCENT"}>
          <option value="PERCENT">Процент</option>
          <option value="FIXED">Фиксированная сумма ₽</option>
        </Select>
      </Field>
      <Field label="Значение (% или ₽)">
        <Input
          name="value"
          type="number"
          required
          min={1}
          defaultValue={initial?.value ?? 10}
        />
      </Field>
      <Field label="Мин. сумма заказа ₽ (необяз.)">
        <Input
          name="minOrderAmountRub"
          type="number"
          min={0}
          defaultValue={initial?.minOrderAmountRub ?? ""}
        />
      </Field>
      <Field label="Филиал (пусто = вся сеть)">
        <Select name="workshopId" defaultValue={initial?.workshopId ?? ""}>
          <option value="">Вся сеть</option>
          {workshops.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Промокод (необяз.)">
        <Input
          name="code"
          placeholder="Например SPRING10"
          defaultValue={initial?.code ?? ""}
        />
      </Field>
      <Field label="Макс. использований (необяз.)">
        <Input
          name="maxRedemptions"
          type="number"
          min={1}
          defaultValue={initial?.maxRedemptions ?? ""}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Действует с">
          <Input
            name="validFrom"
            type="date"
            required
            defaultValue={toDateInput(defaultFrom)}
          />
        </Field>
        <Field label="Действует до">
          <Input
            name="validTo"
            type="date"
            required
            defaultValue={toDateInput(defaultTo)}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={initial?.active ?? true}
          className="size-4 accent-[var(--accent)]"
        />
        Акция активна
      </label>
      <Button type="submit">Сохранить</Button>
    </form>
  );
}
