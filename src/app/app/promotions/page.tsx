import { deactivatePromotion } from "@/app/actions/promotions";
import { db } from "@/db";
import { promotions, workshops } from "@/db/schema";
import { Badge, Button, LinkButton } from "@/components/ui-shell";
import { requireStaff } from "@/lib/staff-data";
import { formatRub } from "@/lib/utils";
import { isPromotionCurrentlyActive } from "@/lib/rules";
import { desc, eq } from "drizzle-orm";

export default async function PromotionsPage() {
  const { session } = await requireStaff([
    "MANAGER",
    "NETWORK_ADMIN",
    "NETWORK_DIRECTOR",
  ]);

  const rows = await db.query.promotions.findMany({
    where: eq(promotions.organizationId, session.organizationId),
    orderBy: [desc(promotions.createdAt)],
  });

  const workshopMap = new Map(
    (
      await db.query.workshops.findMany({
        where: eq(workshops.organizationId, session.organizationId),
      })
    ).map((w) => [w.id, w.name]),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Акции и промокоды</h2>
          <p className="text-sm text-zinc-600">
            Скидки для конверсии заявок и повторных визитов
          </p>
        </div>
        <LinkButton href="/app/promotions/new">Создать акцию</LinkButton>
      </div>

      <ul className="space-y-3">
        {rows.map((p) => {
          const live = isPromotionCurrentlyActive(p);
          const scope = p.workshopId
            ? workshopMap.get(p.workshopId) ?? "Филиал"
            : "Вся сеть";
          const valueLabel =
            p.type === "PERCENT" ? `${p.value}%` : formatRub(p.value);
          return (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-zinc-600">
                  {valueLabel}
                  {p.minOrderAmountRub
                    ? ` · от ${formatRub(p.minOrderAmountRub)}`
                    : ""}
                  {p.code ? ` · код ${p.code}` : ""}
                </p>
                <p className="text-xs text-zinc-500">
                  {scope} · {p.validFrom.toLocaleDateString("ru-RU")} —{" "}
                  {p.validTo.toLocaleDateString("ru-RU")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={live && p.active ? "success" : "default"}>
                  {p.active ? (live ? "активна" : "вне срока") : "выключена"}
                </Badge>
                <LinkButton href={`/app/promotions/${p.id}`} variant="secondary">
                  Изменить
                </LinkButton>
                {p.active && (
                  <form action={deactivatePromotion}>
                    <input type="hidden" name="id" value={p.id} />
                    <Button type="submit" variant="secondary" size="sm">
                      Выключить
                    </Button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-8 text-center text-sm text-zinc-500">
            Пока нет акций — создайте первую для главной и заявок
          </li>
        )}
      </ul>
    </div>
  );
}
