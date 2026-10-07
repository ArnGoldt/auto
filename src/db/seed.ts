import "dotenv/config";
import { db } from "./index";
import {
  organizations,
  workshops,
  staffUsers,
  memberships,
  clients,
  vehicles,
  inquiries,
  orders,
  estimateVersions,
  estimateLines,
  operations,
  operationChecklists,
  checklistItems,
  supplements,
  workshopResources,
  managerReminders,
} from "./schema";
import { hashPassword } from "../lib/password";
import { eq } from "drizzle-orm";

async function main() {
  const [org] = await db
    .insert(organizations)
    .values({ name: "АвтоСеть Профи", legalName: "ООО «АвтоСеть Профи»" })
    .returning();

  const ws = await db
    .insert(workshops)
    .values([
      {
        organizationId: org.id,
        name: "Север — покраска",
        address: "Москва, ул. Северная, 1",
        phone: "+7 495 111-11-11",
      },
      {
        organizationId: org.id,
        name: "Юг — кузов и сварка",
        address: "Москва, ул. Южная, 9",
        phone: "+7 495 222-22-22",
      },
      {
        organizationId: org.id,
        name: "Запад — полный цикл",
        address: "Москва, ул. Западная, 15",
        phone: "+7 495 333-33-33",
      },
    ])
    .returning();

  const pwd = await hashPassword("demo1234");

  const [admin, manager, master1, master2, qc] = await db
    .insert(staffUsers)
    .values([
      {
        organizationId: org.id,
        email: "admin@demo.local",
        passwordHash: pwd,
        fullName: "Админ Сети",
      },
      {
        organizationId: org.id,
        email: "manager@demo.local",
        passwordHash: pwd,
        fullName: "Мария Менеджерова",
      },
      {
        organizationId: org.id,
        email: "master1@demo.local",
        passwordHash: pwd,
        fullName: "Иван Мастеров",
      },
      {
        organizationId: org.id,
        email: "master2@demo.local",
        passwordHash: pwd,
        fullName: "Пётр Сварщиков",
      },
      {
        organizationId: org.id,
        email: "qc@demo.local",
        passwordHash: pwd,
        fullName: "Ольга Контролева",
      },
    ])
    .returning();

  await db.insert(memberships).values([
    {
      userId: admin.id,
      organizationId: org.id,
      role: "NETWORK_ADMIN",
      allBranches: true,
    },
    {
      userId: manager.id,
      organizationId: org.id,
      role: "MANAGER",
      allBranches: true,
    },
    {
      userId: master1.id,
      organizationId: org.id,
      role: "MASTER",
      allBranches: false,
      workshopId: ws[0].id,
    },
    {
      userId: master2.id,
      organizationId: org.id,
      role: "MASTER",
      allBranches: false,
      workshopId: ws[1].id,
    },
    {
      userId: qc.id,
      organizationId: org.id,
      role: "QC",
      allBranches: true,
    },
  ]);

  for (const w of ws) {
    await db.insert(workshopResources).values([
      { workshopId: w.id, name: "Пост 1", kind: "BAY" },
      { workshopId: w.id, name: "Покрасочная камера", kind: "PAINT_BOOTH" },
    ]);
  }

  const [inquiry] = await db
    .insert(inquiries)
    .values({
      organizationId: org.id,
      workshopId: ws[0].id,
      stage: "INSPECTION_SCHEDULED",
      source: "WEB",
      contactName: "Алексей Клиентов",
      contactPhone: "+79001234567",
      contactEmail: "client@example.com",
      workTypes: "PAINT",
      description: "Царапина на двери",
      pdConsent: true,
    })
    .returning();

  await db.insert(managerReminders).values({
    organizationId: org.id,
    inquiryId: inquiry.id,
    kind: "INSPECTION_DUE",
    dueAt: new Date(Date.now() + 86400000),
  });

  const [client] = await db
    .insert(clients)
    .values({
      organizationId: org.id,
      fullName: "Алексей Клиентов",
      phone: "+79001234567",
      email: "client@example.com",
      pdConsentAt: new Date(),
    })
    .returning();

  const [vehicle] = await db
    .insert(vehicles)
    .values({
      clientId: client.id,
      make: "Toyota",
      model: "Camry",
      year: 2020,
      plate: "А123BC777",
      color: "Серый",
    })
    .returning();

  const promised = new Date(Date.now() + 7 * 86400000);
  const [order] = await db
    .insert(orders)
    .values({
      organizationId: org.id,
      workshopId: ws[0].id,
      clientId: client.id,
      vehicleId: vehicle.id,
      inquiryId: inquiry.id,
      salesStage: "BOOKED",
      productionStage: "PAINT",
      promisedDateOriginal: promised,
      promisedDateCurrent: promised,
      intakeNotes: "Приёмка выполнена",
    })
    .returning();

  const [est] = await db
    .insert(estimateVersions)
    .values({
      orderId: order.id,
      kind: "AGREED",
      versionNumber: 1,
      note: "Согласовано на осмотре",
      createdByUserId: manager.id,
    })
    .returning();

  await db.insert(estimateLines).values([
    {
      estimateVersionId: est.id,
      zone: "Передняя левая дверь",
      operation: "Локальная покраска",
      laborHours: "3.5",
      priceRub: 18500,
      sortOrder: 1,
    },
    {
      estimateVersionId: est.id,
      zone: "Порог",
      operation: "Антикор обработка",
      laborHours: "1.0",
      priceRub: 4500,
      sortOrder: 2,
    },
  ]);

  const [supp] = await db
    .insert(supplements)
    .values({
      orderId: order.id,
      status: "PENDING_CLIENT",
      reason: "Скрытая коррозия порога",
      priceDeltaRub: 12000,
      scheduleImpactDays: 2,
    })
    .returning();

  const [op] = await db
    .insert(operations)
    .values({
      orderId: order.id,
      workshopId: ws[0].id,
      title: "Локальная покраска двери",
      description: "Подготовка, грунт, база, лак. Код цвета 1G3.",
      kind: "PAINT",
      status: "ASSIGNED",
      assigneeUserId: master1.id,
    })
    .returning();

  await db.insert(operations).values({
    orderId: order.id,
    workshopId: ws[0].id,
    title: "Доп. антикор порога",
    description: "Только после согласования клиента",
    kind: "BODY",
    status: "WAITING",
    supplementId: supp.id,
    waitReason: "Ожидает согласования доп. работ",
  });

  const [cl] = await db
    .insert(operationChecklists)
    .values({ operationId: op.id, templateKind: "PAINT" })
    .returning();

  await db.insert(checklistItems).values([
    {
      checklistId: cl.id,
      label: "Маскировка и подготовка зоны",
      required: true,
      sortOrder: 1,
    },
    {
      checklistId: cl.id,
      label: "Фото скрытой зоны до закрытия",
      required: true,
      requiresPhoto: true,
      sortOrder: 2,
    },
    {
      checklistId: cl.id,
      label: "Нанесение грунта и базы",
      required: true,
      sortOrder: 3,
    },
    {
      checklistId: cl.id,
      label: "Контроль цвета и лака",
      required: true,
      sortOrder: 4,
    },
  ]);

  console.log("Seed OK. Demo password for all staff: demo1234");
  console.log("Manager:", manager.email, "Master1:", master1.email);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
