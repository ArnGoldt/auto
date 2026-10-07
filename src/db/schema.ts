import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const staffRoleEnum = pgEnum("staff_role", [
  "ADMIN",
  "MANAGER",
  "MASTER",
  "QC",
  "BRANCH_DIRECTOR",
  "NETWORK_DIRECTOR",
]);

export const salesStatusEnum = pgEnum("sales_status", [
  "inquiry",
  "inspection",
  "estimate_draft",
  "pending_approval",
  "approved",
  "lost",
]);

export const productionStatusEnum = pgEnum("production_status", [
  "intake",
  "in_progress",
  "waiting_parts",
  "qc",
  "ready_for_release",
  "released",
]);

export const estimateVersionKindEnum = pgEnum("estimate_version_kind", [
  "preliminary",
  "agreed",
  "revision",
]);

export const operationStatusEnum = pgEnum("operation_status", [
  "assigned",
  "in_progress",
  "on_review",
  "completed",
]);

export const supplementStatusEnum = pgEnum("supplement_status", [
  "draft",
  "pending_client",
  "approved",
  "rejected",
  "blocked",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  inn: text("inn"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const workshops = pgTable("workshops", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  timezone: text("timezone").default("Europe/Moscow"),
  phone: text("phone"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  role: staffRoleEnum("role").notNull(),
  workshopId: uuid("workshop_id").references(() => workshops.id, {
    onDelete: "set null",
  }),
  allBranches: boolean("all_branches").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  consentPdAt: timestamp("consent_pd_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const clientAccounts = pgTable("client_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .unique()
    .references(() => clients.id, { onDelete: "cascade" }),
  login: text("login").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  vin: text("vin"),
  plate: text("plate"),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  workshopId: uuid("workshop_id")
    .notNull()
    .references(() => workshops.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").references(() => clients.id),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  description: text("description"),
  source: text("source").default("phone"),
  funnelStage: text("funnel_stage").default("new"),
  salesStatus: salesStatusEnum("sales_status").default("inquiry").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  workshopId: uuid("workshop_id")
    .notNull()
    .references(() => workshops.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  inquiryId: uuid("inquiry_id").references(() => inquiries.id),
  salesStatus: salesStatusEnum("sales_status").default("inspection").notNull(),
  productionStatus: productionStatusEnum("production_status")
    .default("intake")
    .notNull(),
  promisedDateOriginal: timestamp("promised_date_original", {
    withTimezone: true,
  }),
  promisedDateCurrent: timestamp("promised_date_current", {
    withTimezone: true,
  }),
  promisedDateChangeReason: text("promised_date_change_reason"),
  inspectionNotes: text("inspection_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const estimateVersions = pgTable("estimate_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  kind: estimateVersionKindEnum("kind").notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const estimateLines = pgTable("estimate_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimateVersionId: uuid("estimate_version_id")
    .notNull()
    .references(() => estimateVersions.id, { onDelete: "cascade" }),
  zone: text("zone"),
  operationName: text("operation_name").notNull(),
  laborHours: numeric("labor_hours", { precision: 8, scale: 2 }),
  materialsCost: numeric("materials_cost", { precision: 12, scale: 2 }),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const supplements = pgTable("supplements", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: supplementStatusEnum("status").default("blocked").notNull(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const operations = pgTable("operations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  estimateLineId: uuid("estimate_line_id").references(() => estimateLines.id),
  supplementId: uuid("supplement_id").references(() => supplements.id),
  name: text("name").notNull(),
  zone: text("zone"),
  status: operationStatusEnum("status").default("assigned").notNull(),
  assigneeUserId: uuid("assignee_user_id").references(() => users.id),
  requiresSupplementApproval: boolean("requires_supplement_approval")
    .default(false)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const operationChecklistItems = pgTable("operation_checklist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  operationId: uuid("operation_id")
    .notNull()
    .references(() => operations.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  required: boolean("required").default(true).notNull(),
  requiresPhoto: boolean("requires_photo").default(false).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedByUserId: uuid("completed_by_user_id").references(() => users.id),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  comment: text("comment"),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => orders.id),
  operationId: uuid("operation_id").references(() => operations.id),
  checklistItemId: uuid("checklist_item_id").references(
    () => operationChecklistItems.id,
  ),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type"),
  storagePath: text("storage_path").notNull(),
  visibleToClient: boolean("visible_to_client").default(false).notNull(),
  uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: text("action").notNull(),
  payload: jsonb("payload"),
  userId: uuid("user_id").references(() => users.id),
  clientAccountId: uuid("client_account_id").references(
    () => clientAccounts.id,
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const orderEvents = pgTable("order_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body"),
  visibleToClient: boolean("visible_to_client").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  workshops: many(workshops),
  users: many(users),
}));

export const workshopsRelations = relations(workshops, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [workshops.organizationId],
    references: [organizations.id],
  }),
  inquiries: many(inquiries),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  workshop: one(workshops, {
    fields: [inquiries.workshopId],
    references: [workshops.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  account: one(clientAccounts, {
    fields: [clients.id],
    references: [clientAccounts.clientId],
  }),
  vehicles: many(vehicles),
  orders: many(orders),
}));

export const estimateVersionsRelations = relations(
  estimateVersions,
  ({ many }) => ({
    lines: many(estimateLines),
  }),
);

export const estimateLinesRelations = relations(estimateLines, ({ one }) => ({
  version: one(estimateVersions, {
    fields: [estimateLines.estimateVersionId],
    references: [estimateVersions.id],
  }),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(clients, {
    fields: [orders.clientId],
    references: [clients.id],
  }),
  vehicle: one(vehicles, {
    fields: [orders.vehicleId],
    references: [vehicles.id],
  }),
  workshop: one(workshops, {
    fields: [orders.workshopId],
    references: [workshops.id],
  }),
  operations: many(operations),
  estimateVersions: many(estimateVersions),
  supplements: many(supplements),
}));

export const operationsRelations = relations(operations, ({ one, many }) => ({
  order: one(orders, {
    fields: [operations.orderId],
    references: [orders.id],
  }),
  checklistItems: many(operationChecklistItems),
}));

export const operationChecklistItemsRelations = relations(
  operationChecklistItems,
  ({ one }) => ({
    operation: one(operations, {
      fields: [operationChecklistItems.operationId],
      references: [operations.id],
    }),
  }),
);

export const supplementsRelations = relations(supplements, ({ one }) => ({
  order: one(orders, {
    fields: [supplements.orderId],
    references: [orders.id],
  }),
}));
