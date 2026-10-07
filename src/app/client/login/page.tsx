import { clientLogin } from "@/app/actions/auth";
import { Button, Card, Field, Input } from "@/components/ui-shell";
import Link from "next/link";

export default function ClientLoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-8">
      <Card padding="lg" className="w-full max-w-md">
        <h1 className="text-xl font-bold text-[var(--navy-900)]">
          Вход в личный кабинет
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Логин и пароль выдаёт менеджер мастерской
        </p>
        <form action={clientLogin} className="mt-6">
          <Field label="Логин">
            <Input name="login" required autoComplete="username" />
          </Field>
          <Field label="Пароль">
            <Input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </Field>
          <Button type="submit" size="lg" className="mt-2 w-full">
            Войти
          </Button>
        </form>
        <p className="mt-4 text-center text-xs leading-relaxed text-[var(--muted)]">
          Согласование работ в ЛК не является электронной подписью (не ЭП).
        </p>
        <p className="mt-3 text-center text-sm">
          <Link
            href="/"
            className="font-medium text-[var(--navy-800)] underline-offset-2 hover:underline"
          >
            На главную
          </Link>
        </p>
      </Card>
    </div>
  );
}
