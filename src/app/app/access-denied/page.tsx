import { Button, Card } from "@/components/ui-shell";
import Link from "next/link";
import { staffLogout } from "@/app/actions/auth";

export default function AccessDeniedPage() {
  return (
    <div className="mx-auto max-w-lg py-8">
      <Card padding="lg">
        <h1 className="text-xl font-bold text-[var(--navy-900)]">
          Нет доступа к администрированию
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Раздел «Администрирование» доступен только учётной записи с ролью{" "}
          <strong>администратор сети</strong> (например{" "}
          <code className="rounded bg-slate-100 px-1">admin@demo.local</code>
          ). Вы вошли под другой ролью (менеджер, QC и т.д.).
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app">
            <Button type="button" variant="secondary">
              В CRM
            </Button>
          </Link>
          <form action={staffLogout}>
            <Button type="submit">Выйти и войти как админ</Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
