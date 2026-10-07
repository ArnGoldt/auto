import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-800 text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm uppercase tracking-widest text-zinc-400">
          Сеть мастерских · РФ
        </p>
        <h1 className="mt-2 text-4xl font-bold">АвтоПортал</h1>
        <p className="mt-4 text-lg text-zinc-300">
          Управление покраской и сварочным ремонтом: клиенты, сметы, производство
          и личный кабинет автовладельца.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-zinc-900"
          >
            Вход для сотрудников
          </Link>
          <Link
            href="/client/login"
            className="rounded-lg border border-zinc-500 px-5 py-3 text-sm font-semibold"
          >
            Личный кабинет клиента
          </Link>
          <Link
            href="/request"
            className="rounded-lg border border-zinc-500 px-5 py-3 text-sm font-semibold"
          >
            Оставить заявку
          </Link>
        </div>
      </div>
    </div>
  );
}
