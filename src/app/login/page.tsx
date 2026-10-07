import { staffLogin } from "@/app/actions/auth";
import { Button, Field, Input } from "@/components/ui-shell";
import Link from "next/link";

export default function StaffLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <form
        action={staffLogin}
        className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Вход для сотрудников</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Менеджер, мастер, контроль качества
        </p>
        <div className="mt-6 space-y-1">
          <Field label="Email">
            <Input name="email" type="email" required placeholder="manager@demo.local" />
          </Field>
          <Field label="Пароль">
            <Input name="password" type="password" required placeholder="demo1234" />
          </Field>
        </div>
        <Button type="submit" className="mt-4 w-full py-3 text-base">
          Войти
        </Button>
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/">На главную</Link>
        </p>
      </form>
    </div>
  );
}
