import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/db";
import {
  organizations,
  workshops,
  users,
  memberships,
  inquiries,
  clients,
  clientAccounts,
  vehicles,
  orders,
  estimateVersions,
  estimateLines,
  operations,
  operationChecklistItems,
  supplements,
} from "../src/db/schema";

const DEMO_PASSWORD = "demo1234";

async function main() {
  console.log("Seeding database...");

  const [org] = await db
    .insert(organizations)
    .values({
      name: "АвтоСеть Покраска",
      legalName: 'ООО "АвтоСеть Покраска"',
      inn: "7701234567",
    })
    .returning();

  const workshopRows = await db
    .insert(workshops)
    .values([
      {
        organizationId: org.id,
        name: "Москва — Юг",
        address: "г. Москва, ул. Промышленная, 12",
        phone: "+7 (495) 100-20-30",
      },
      {
        organizationId: org.id,
        name: "Москва — Север",
        address: "г. Москва, ш. Ленинградское, 45",
        phone: "+7 (495) 100-20-31",
      },
      {
        organizationId: org.id,
        name: "Подольск",
        address: "г. Подольск, ул. Заводская, 3",
        phone: "+7 (496) 700-11-22",
      },
    ])
    .returning();

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const staffDefs = [
    {
      email: "manager@demo.local",
      fullName: "Иван Петров",
      role: "MANAGER" as const,
      allBranches: true,
      workshopId: null as string | null,
    },
    {
      email: "admin@demo.local",
      fullName: "Админ Системы",
      role: "ADMIN" as const,
      allBranches: true,
      workshopId: null,
    },
    {
      email: "master1@demo.local",
      fullName: "Сергей Мастеров",
      role: "MASTER" as const,
      allBranches: false,
      workshopId: workshopRows[0].id,
    },
    {
      email: "master2@demo.local",
      fullName: "Алексей Сварщиков",
      role: "MASTER" as const,
      allBranches: false,
      workshopId: workshopRows[1].id,
    },
  ];

  for (const def of staffDefs) {
    const [user] = await db
      .insert(users)
      .values({
        organizationId: org.id,
        email: def.email,
        passwordHash: hash,
        fullName: def.fullName,
      })
      .returning();

    await db.insert(memberships).values({
      userId: user.id,
      organizationId: org.id,
      role: def.role,
      workshopId: def.workshopId,
      allBranches: def.allBranches,
    });
  }

  await db.insert(inquiries).values({
    organizationId: org.id,
    workshopId: workshopRows[1].id,
    contactName: "Анна Новая",
    contactPhone: "+7 (903) 111-22-33",
    contactEmail: "anna.new@example.com",
    description: "Вмятина на двери — нужен осмотр",
    source: "site",
    funnelStage: "new",
  });

  const [inquiry] = await db
    .insert(inquiries)
    .values({
      organizationId: org.id,
      workshopId: workshopRows[0].id,
      contactName: "Дмитрий Клиентов",
      contactPhone: "+7 (916) 555-12-34",
      contactEmail: "dmitry.client@example.com",
      description: "Царапина на левом крыле, нужна покраска",
      source: "site",
      funnelStage: "new",
    })
    .returning();

  const [client] = await db
    .insert(clients)
    .values({
      organizationId: org.id,
      fullName: "Дмитрий Клиентов",
      phone: "+7 (916) 555-12-34",
      email: "dmitry.client@example.com",
      consentPdAt: new Date(),
    })
    .returning();

  const [vehicle] = await db
    .insert(vehicles)
    .values({
      organizationId: org.id,
      clientId: client.id,
      make: "Toyota",
      model: "Camry",
      year: 2019,
      plate: "А123ВС777",
      color: "Белый",
    })
    .returning();

  const [order] = await db
    .insert(orders)
    .values({
      organizationId: org.id,
      workshopId: workshopRows[0].id,
      clientId: client.id,
      vehicleId: vehicle.id,
      inquiryId: inquiry.id,
      salesStatus: "estimate_draft",
      productionStatus: "in_progress",
      inspectionNotes: "Осмотр выполнен (seed)",
    })
    .returning();

  const { eq } = await import("drizzle-orm");
  await db
    .update(inquiries)
    .set({ clientId: client.id, funnelStage: "inspection_done" })
    .where(eq(inquiries.id, inquiry.id));

  const master1 = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, "master1@demo.local"),
  });

  const [estimate] = await db
    .insert(estimateVersions)
    .values({
      orderId: order.id,
      versionNumber: 1,
      kind: "preliminary",
      totalAmount: "45000.00",
    })
    .returning();

  const [line] = await db
    .insert(estimateLines)
    .values({
      estimateVersionId: estimate.id,
      zone: "Левое крыло",
      operationName: "Подготовка и покраска",
      laborHours: "4.5",
      materialsCost: "8000",
      price: "35000",
      sortOrder: 1,
    })
    .returning();

  await db.insert(estimateLines).values({
    estimateVersionId: estimate.id,
    zone: "Бампер",
    operationName: "Локальная подкраска",
    laborHours: "1.5",
    materialsCost: "2000",
    price: "10000",
    sortOrder: 2,
  });

  const [operation] = await db
    .insert(operations)
    .values({
      orderId: order.id,
      estimateLineId: line.id,
      name: "Подготовка и покраска — левое крыло",
      zone: "Левое крыло",
      status: "assigned",
      assigneeUserId: master1?.id,
    })
    .returning();

  await db.insert(operationChecklistItems).values([
    {
      operationId: operation.id,
      label: "Зачистка и грунт",
      required: true,
      requiresPhoto: true,
      sortOrder: 1,
    },
    {
      operationId: operation.id,
      label: "Покраска в камере",
      required: true,
      requiresPhoto: true,
      sortOrder: 2,
    },
    {
      operationId: operation.id,
      label: "Полировка",
      required: true,
      requiresPhoto: false,
      sortOrder: 3,
    },
  ]);

  await db.insert(clientAccounts).values({
    clientId: client.id,
    login: "dmitry.client",
    passwordHash: hash,
    enabled: true,
  });

  await db.insert(supplements).values({
    orderId: order.id,
    title: "Доп. работа: замена клипсы бампера",
    description: "Обнаружено при разборе",
    amount: "3500.00",
    status: "pending_client",
  });

  console.log("Seed complete.");
  console.log(`Organization: ${org.name}`);
  console.log(`Demo password for all staff: ${DEMO_PASSWORD}`);
  console.log("Logins: manager@demo.local, admin@demo.local, master1@demo.local, master2@demo.local");
  console.log(`Sample inquiry id (for inspection demo): ${inquiry.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
