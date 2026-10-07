import { BrandMark, LinkButton } from "@/components/ui-shell";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--navy-950)] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-[var(--accent)]/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      </div>
      <header className="relative border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <BrandMark />
          <span className="hidden text-xs font-medium uppercase tracking-widest text-slate-400 sm:inline">
            РФ · ₽
          </span>
        </div>
      </header>
      <div className="relative mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400/90">
          Покраска и сварка
        </p>
        <h1 className="text-balance mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Управление ремонтом для сети мастерских
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
          Клиенты, сметы, производство и личный кабинет автовладельца — единый
          портал для менеджеров, мастеров и клиентов.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <LinkButton href="/login">Вход для сотрудников</LinkButton>
          <LinkButton href="/client/login" variant="secondary">
            Личный кабинет клиента
          </LinkButton>
          <LinkButton href="/request" variant="secondary">
            Оставить заявку
          </LinkButton>
        </div>
        <ul className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            { t: "CRM менеджера", d: "Обращения, заказы, сметы" },
            { t: "Рабочее место мастера", d: "Задачи с телефона в цеху" },
            { t: "Портал клиента", d: "Статус ремонта и согласования" },
          ].map((item) => (
            <li
              key={item.t}
              className="rounded-[var(--radius-xl)] border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <p className="font-semibold text-white">{item.t}</p>
              <p className="mt-1 text-sm text-slate-400">{item.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
