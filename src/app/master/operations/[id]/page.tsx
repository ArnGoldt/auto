import {
  completeOperationForm,
  startOperationForm,
  toggleChecklistItem,
  uploadChecklistPhoto,
} from "@/app/actions/master";
import { db } from "@/db";
import {
  checklistItems,
  operationChecklists,
  operations,
  orders,
  vehicles,
} from "@/db/schema";
import { Button } from "@/components/ui-shell";
import { requireMasterSession } from "@/lib/staff-data";
import { asc, eq } from "drizzle-orm";
import Image from "next/image";

export default async function MasterOperationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireMasterSession();
  const { id } = await params;

  const op = await db.query.operations.findFirst({
    where: eq(operations.id, id),
  });
  if (!op || op.assigneeUserId !== session.userId) {
    return <p className="p-4">Операция недоступна</p>;
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, op.orderId),
  });
  const vehicle = order
    ? await db.query.vehicles.findFirst({
        where: eq(vehicles.id, order.vehicleId),
      })
    : null;

  const cl = await db.query.operationChecklists.findFirst({
    where: eq(operationChecklists.operationId, id),
  });
  const items = cl
    ? await db.query.checklistItems.findMany({
        where: eq(checklistItems.checklistId, cl.id),
        orderBy: [asc(checklistItems.sortOrder)],
      })
    : [];

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">{op.title}</h2>
        <p className="mt-1 text-sm text-zinc-600">
          {vehicle?.make} {vehicle?.model} {vehicle?.plate ? `· ${vehicle.plate}` : ""}
        </p>
        <p className="mt-3 text-sm">{op.description}</p>
        {op.status === "ASSIGNED" && (
          <form action={startOperationForm} className="mt-4">
            <input type="hidden" name="operationId" value={id} />
            <Button type="submit" className="w-full py-4 text-base">
              Принять в работу
            </Button>
          </form>
        )}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h3 className="font-medium">Чек-лист</h3>
        <ul className="mt-3 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="border-b pb-4 last:border-0">
              <form action={toggleChecklistItem} className="flex items-start gap-3">
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="operationId" value={id} />
                <button
                  type="submit"
                  className={`mt-1 h-8 w-8 rounded-lg border text-lg ${item.completed ? "bg-green-600 text-white" : "bg-white"}`}
                >
                  {item.completed ? "✓" : ""}
                </button>
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  {item.required && (
                    <p className="text-xs text-zinc-500">Обязательно</p>
                  )}
                  {item.photoPath && (
                    <Image
                      src={item.photoPath}
                      alt=""
                      width={200}
                      height={120}
                      className="mt-2 rounded-lg object-cover"
                    />
                  )}
                </div>
              </form>
              {item.requiresPhoto && (
                <form
                  action={uploadChecklistPhoto}
                  className="mt-2 pl-11"
                  encType="multipart/form-data"
                >
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="operationId" value={id} />
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    capture="environment"
                    className="text-sm"
                  />
                  <Button type="submit" variant="secondary" className="mt-2 w-full py-3">
                    Загрузить фото
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </div>

      {(op.status === "IN_PROGRESS" || op.status === "ASSIGNED") && (
        <form action={completeOperationForm}>
          <input type="hidden" name="operationId" value={id} />
          <Button type="submit" className="w-full py-4 text-base">
            Отправить на контроль качества
          </Button>
        </form>
      )}
    </div>
  );
}
