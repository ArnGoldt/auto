import { listActiveNetworkPromotions } from "@/lib/promotions-query";
import { formatRub } from "@/lib/utils";
import Link from "next/link";

export async function PromotionsShowcase({ compact }: { compact?: boolean }) {
  const promos = (await listActiveNetworkPromotions()).slice(0, 3);
  if (promos.length === 0) return null;

  return (
    <section
      className={
        compact
          ? "mt-8 rounded-[var(--radius-xl)] border border-[var(--border)] bg-white p-5"
          : "mt-16"
      }
    >
      <h2
        className={
          compact
            ? "text-lg font-bold text-[var(--navy-900)]"
            : "text-sm font-semibold uppercase tracking-[0.2em] text-amber-400/90"
        }
      >
        Акции
      </h2>
      <ul
        className={
          compact
            ? "mt-4 space-y-3"
            : "mt-6 grid gap-4 sm:grid-cols-3"
        }
      >
        {promos.map((p) => {
          const value =
            p.type === "PERCENT" ? `${p.value}%` : formatRub(p.value);
          const href = p.code ? `/request?promo=${encodeURIComponent(p.code)}` : "/request";
          return (
            <li
              key={p.id}
              className={
                compact
                  ? "rounded-lg bg-[var(--surface-muted)] p-3 text-sm"
                  : "rounded-[var(--radius-xl)] border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              }
            >
              <p className={compact ? "font-semibold text-[var(--navy-900)]" : "font-semibold text-white"}>
                {p.name}
              </p>
              <p className={compact ? "text-[var(--muted)]" : "mt-1 text-sm text-slate-400"}>
                {p.description ?? `Скидка ${value}`}
              </p>
              {p.code && (
                <p className="mt-2 text-xs font-medium text-amber-500">
                  Промокод {p.code}
                </p>
              )}
              <Link
                href={href}
                className={
                  compact
                    ? "mt-2 inline-block text-sm font-medium text-[var(--navy-800)] underline-offset-2 hover:underline"
                    : "mt-3 inline-block text-sm font-medium text-amber-400 hover:underline"
                }
              >
                Записаться на осмотр →
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
