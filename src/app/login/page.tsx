import { staffLogin } from "@/app/actions/auth";
import { BrandMark, Button, Card, Field, Input } from "@/components/ui-shell";
import Link from "next/link";

export default function StaffLoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <header className="border-b border-[var(--navy-800)] bg-[var(--navy-900)] px-4 py-4">
        <Link href="/">
          <BrandMark compact />
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <Card padding="lg" className="w-full max-w-md">
          <h1 className="text-xl font-bold text-[var(--navy-900)]">
            Вход для сотрудников
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Менеджер, мастер, контроль качества или администратор сети
          </p>
          <form action={staffLogin} className="mt-6">
            <Field label="Email">
              <Input
                name="email"
                type="email"
                required
                placeholder="manager@demo.local"
                autoComplete="email"
              />
            </Field>
            <Field label="Пароль">
              <Input
                name="password"
                type="password"
                required
                placeholder="demo1234"
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" size="lg" className="mt-2 w-full">
              Войти
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-[var(--muted)]">
            <Link
              href="/"
              className="font-medium text-[var(--navy-800)] underline-offset-2 hover:underline"
            >
              На главную
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
