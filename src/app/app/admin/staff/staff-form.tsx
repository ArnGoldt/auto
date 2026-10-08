import { createStaff, updateStaff } from "@/app/actions/admin";
import {
  ASSIGNABLE_STAFF_ROLES,
  roleSupportsAllBranches,
  staffRoleLabel,
} from "@/lib/roles";
import { Button, Field, Input, Select } from "@/components/ui-shell";

type StaffInitial = {
  id: string;
  fullName: string;
  email: string;
  active: boolean;
  role: string;
  allBranches: boolean;
  workshopId: string | null;
};

export function StaffForm({
  workshops,
  initial,
}: {
  workshops: { id: string; name: string }[];
  initial?: StaffInitial;
}) {
  const action = initial ? updateStaff : createStaff;
  const defaultRole = initial?.role ?? "MANAGER";

  return (
    <form action={action} className="max-w-lg space-y-1 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-white p-6 shadow-[var(--shadow-card)]">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <Field label="ФИО">
        <Input name="fullName" required defaultValue={initial?.fullName} />
      </Field>
      <Field label="Email">
        <Input
          name="email"
          type="email"
          required
          autoComplete="off"
          defaultValue={initial?.email}
        />
      </Field>
      <Field label={initial ? "Новый пароль (необяз.)" : "Пароль"}>
        <Input
          name="password"
          type="password"
          minLength={initial ? undefined : 6}
          required={!initial}
          autoComplete="new-password"
          placeholder={initial ? "Оставьте пустым, чтобы не менять" : "мин. 6 символов"}
        />
      </Field>
      <Field label="Роль">
        <Select name="role" defaultValue={defaultRole}>
          {ASSIGNABLE_STAFF_ROLES.map((r) => (
            <option key={r} value={r}>
              {staffRoleLabel(r)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Филиал (для мастера / директора филиала)">
        <Select name="workshopId" defaultValue={initial?.workshopId ?? ""}>
          <option value="">— не выбран —</option>
          {workshops.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </Field>
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="allBranches"
          defaultChecked={initial?.allBranches ?? true}
          className="size-4 rounded border-[var(--border)]"
        />
        <span className="font-medium text-[var(--navy-800)]">
          Доступ ко всем филиалам (менеджер / администратор)
        </span>
      </label>
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={initial?.active ?? true}
          className="size-4 rounded border-[var(--border)]"
        />
        <span className="font-medium text-[var(--navy-800)]">Учётная запись активна</span>
      </label>
      <p className="mb-4 text-xs text-[var(--muted)]">
        Для ролей «{staffRoleLabel("MASTER")}» и «{staffRoleLabel("BRANCH_DIRECTOR")}» нужен
        филиал. Флаг «все филиалы» учитывается для{" "}
        {roleSupportsAllBranches("MANAGER") ? "менеджера и администратора" : "менеджера"}.
      </p>
      <div className="flex gap-3 pt-2">
        <Button type="submit">{initial ? "Сохранить" : "Создать"}</Button>
      </div>
    </form>
  );
}
