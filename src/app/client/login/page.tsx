import { clientLogin } from "@/app/actions/auth";
import { Button, Field, Input } from "@/components/ui-shell";
import Link from "next/link";

export default function ClientLoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form
        action={clientLogin}
        className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Вход в личный кабинет</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Логин и пароль выдаёт менеджер мастерской
        </p>
        <div className="mt-6">
          <Field label="Логин">
            <Input name="login" required />
          </Field>
          <Field label="Пароль">
            <Input name="password" type="password" required />
          </Field>
        </div>
        <Button type="submit" className="mt-4 w-full py-3">
          Войти
        </Button>
        <p className="mt-4 text-center text-xs text-zinc-500">
          Согласование работ в ЛК не является электронной подписью (не ЭП).
        </p>
        <p className="mt-2 text-center text-sm">
          <Link href="/">На главную</Link>
        </p>
      </form>
    </div>
  );
}
