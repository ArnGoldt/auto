import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 bg-muted/30">
      <div className="text-center max-w-lg space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Портал сети кузовных мастерских
        </h1>
        <p className="text-muted-foreground">
          CRM, осмотр, смета, производство и личный кабинет клиента. РФ, ₽,
          несколько филиалов.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Сотрудники
        </Link>
        <Link
          href="/client/login"
          className="inline-flex h-10 items-center justify-center rounded-md border px-6 text-sm font-medium hover:bg-muted"
        >
          Клиентский ЛК
        </Link>
      </div>
    </main>
  );
}
