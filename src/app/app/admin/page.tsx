import {
  Card,
  LinkButton,
  PageTitle,
} from "@/components/ui-shell";
import Link from "next/link";
import { requireNetworkAdmin } from "@/lib/staff-data";

export default async function AdminDashboardPage() {
  await requireNetworkAdmin();

  const sections = [
    {
      href: "/app/admin/staff",
      title: "Сотрудники",
      description: "Учётные записи, роли и привязка к филиалам",
    },
    {
      href: "/app/admin/workshops",
      title: "Мастерские",
      description: "Филиалы сети: адреса, телефоны, активность",
    },
    {
      href: "/app/admin/organization",
      title: "Организация",
      description: "Название и юридическое наименование",
    },
  ];

  return (
    <div>
      <PageTitle
        title="Администрирование"
        description="Структура сети: сотрудники, филиалы и настройки организации"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="group block">
            <Card
              padding="lg"
              className="h-full transition-shadow group-hover:shadow-md"
            >
              <h3 className="font-semibold text-[var(--navy-900)]">{s.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{s.description}</p>
              <span className="mt-4 inline-block text-sm font-medium text-[var(--accent-foreground)]">
                Открыть →
              </span>
            </Card>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm text-[var(--muted)]">
        Клиенты, заказы и акции по-прежнему доступны в основном меню приложения.
      </p>
      <div className="mt-4">
        <LinkButton href="/app" variant="secondary">
          К рабочему столу
        </LinkButton>
      </div>
    </div>
  );
}
