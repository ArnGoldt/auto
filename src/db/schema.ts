import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
} from "drizzle-orm/pg-core";

export const staffRoleEnum = pgEnum("staff_role", [
  "NETWORK_ADMIN",
  "MANAGER",
  "MASTER",
  "QC",
  "NETWORK_DIRECTOR",
  "BRANCH_DIRECTOR",
]);

export const inquiryStageEnum = pgEnum("inquiry_stage", [
  "NEW",
  "CONTACTED",
  "INSPECTION_SCHEDULED",
  "ESTIMATE_SENT",
  "AWAITING_DECISION",
  "BOOKED",
  "DEFERRED",
  "REJECTED",
  "NO_CONTACT",
  "CLOSED",
]);

export const productionStageEnum = pgEnum("production_stage", [
  "INTAKE",
  "DIAGNOSTICS",
  "APPROVAL",
  "BODY_WELD",
  "PREP",
  "PAINT",
  "ASSEMBLY",
  "QC",
  "READY",
  "DELIVERED",
]);

export const operationStatusEnum = pgEnum("operation_status", [
  "ASSIGNED",
  "IN_PROGRESS",
  "QC_REVIEW",
  "DONE",
  "WAITING",
]);

export const supplementStatusEnum = pgEnum("supplement_status", [
  "DRAFT",
  "PENDING_CLIENT",
  "APPROVED",
  "REJECTED",
  "BLOCKED",
]);

export const estimateKindEnum = pgEnum("estimate_kind", [
  "PRELIMINARY",
  "AGREED",
  "REVISION",
]);

export const promotionTypeEnum = pgEnum("promotion_type", ["PERCENT", "FIXED"]);

export const estimateLineKindEnum = pgEnum("estimate_line_kind", [
  "WORK",
  "DISCOUNT",
]);

export const loyaltyTierEnum = pgEnum("loyalty_tier", [
  "BRONZE",
  "SILVER",
  "GOLD",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workshops = pgTable("workshops", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  address: text("address"),
  timezone: text("timezone").default("Europe/Moscow"),
  phone: text("phone"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const staffUsers = pgTable("staff_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => staffUsers.id),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  role: staffRoleEnum("role").notNull(),
  allBranches: boolean("all_branches").default(false).notNull(),
  workshopId: uuid("workshop_id").references(() => workshops.id),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  pdConsentAt: timestamp("pd_consent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year"),
  plate: text("plate"),
  vin: text("vin"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientAccounts = pgTable("client_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id)
    .unique(),
  login: text("login").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdByUserId: uuid("created_by_user_id").references(() => staffUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  workshopId: uuid("workshop_id")
    .notNull()
    .references(() => workshops.id),
  clientId: uuid("client_id").references(() => clients.id),
  stage: inquiryStageEnum("stage").default("NEW").notNull(),
  source: text("source").default("WEB"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  workTypes: text("work_types"),
  description: text("description"),
  pdConsent: boolean("pd_consent").default(false),
  promoCode: text("promo_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  workshopId: uuid("workshop_id")
    .notNull()
    .references(() => workshops.id),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  inquiryId: uuid("inquiry_id").references(() => inquiries.id),
  salesStage: inquiryStageEnum("sales_stage").default("BOOKED").notNull(),
  productionStage: productionStageEnum("production_stage")
    .default("INTAKE")
    .notNull(),
  promisedDateOriginal: timestamp("promised_date_original"),
  promisedDateCurrent: timestamp("promised_date_current"),
  promisedDateChangeReason: text("promised_date_change_reason"),
  intakeNotes: text("intake_notes"),
  bodyZones: jsonb("body_zones"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const estimateVersions = pgTable("estimate_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  kind: estimateKindEnum("kind").notNull(),
  versionNumber: integer("version_number").notNull(),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id").references(() => staffUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const promotions = pgTable("promotions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  workshopId: uuid("workshop_id").references(() => workshops.id),
  name: text("name").notNull(),
  description: text("description"),
  type: promotionTypeEnum("type").notNull(),
  value: integer("value").notNull(),
  minOrderAmountRub: integer("min_order_amount_rub"),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to").notNull(),
  active: boolean("active").default(true).notNull(),
  code: text("code"),
  maxRedemptions: integer("max_redemptions"),
  createdByUserId: uuid("created_by_user_id").references(() => staffUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientLoyalty = pgTable("client_loyalty", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id)
    .unique(),
  pointsBalance: integer("points_balance").default(0).notNull(),
  tier: loyaltyTierEnum("tier"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  orderId: uuid("order_id").references(() => orders.id),
  promotionId: uuid("promotion_id").references(() => promotions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const promotionRedemptions = pgTable("promotion_redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  promotionId: uuid("promotion_id")
    .notNull()
    .references(() => promotions.id),
  orderId: uuid("order_id").references(() => orders.id),
  inquiryId: uuid("inquiry_id").references(() => inquiries.id),
  clientId: uuid("client_id").references(() => clients.id),
  appliedAmountRub: integer("applied_amount_rub").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const estimateLines = pgTable("estimate_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimateVersionId: uuid("estimate_version_id")
    .notNull()
    .references(() => estimateVersions.id),
  lineKind: estimateLineKindEnum("line_kind").default("WORK").notNull(),
  zone: text("zone"),
  operation: text("operation").notNull(),
  laborHours: numeric("labor_hours", { precision: 8, scale: 2 }),
  materials: text("materials"),
  priceRub: integer("price_rub").notNull(),
  promotionId: uuid("promotion_id").references(() => promotions.id),
  sortOrder: integer("sort_order").default(0),
});

export const supplements = pgTable("supplements", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  status: supplementStatusEnum("status").default("BLOCKED").notNull(),
  reason: text("reason").notNull(),
  priceDeltaRub: integer("price_delta_rub").notNull(),
  scheduleImpactDays: integer("schedule_impact_days"),
  clientDecisionAt: timestamp("client_decision_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const operations = pgTable("operations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  workshopId: uuid("workshop_id")
    .notNull()
    .references(() => workshops.id),
  title: text("title").notNull(),
  description: text("description"),
  kind: text("kind").default("GENERAL"),
  status: operationStatusEnum("status").default("ASSIGNED").notNull(),
  assigneeUserId: uuid("assignee_user_id").references(() => staffUsers.id),
  supplementId: uuid("supplement_id").references(() => supplements.id),
  waitReason: text("wait_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const operationChecklists = pgTable("operation_checklists", {
  id: uuid("id").primaryKey().defaultRandom(),
  operationId: uuid("operation_id")
    .notNull()
    .references(() => operations.id)
    .unique(),
  templateKind: text("template_kind"),
});

export const checklistItems = pgTable("checklist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  checklistId: uuid("checklist_id")
    .notNull()
    .references(() => operationChecklists.id),
  label: text("label").notNull(),
  required: boolean("required").default(true).notNull(),
  requiresPhoto: boolean("requires_photo").default(false).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedByUserId: uuid("completed_by_user_id").references(
    () => staffUsers.id,
  ),
  completedAt: timestamp("completed_at"),
  photoPath: text("photo_path"),
  sortOrder: integer("sort_order").default(0),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  workshopId: uuid("workshop_id").references(() => workshops.id),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: text("action").notNull(),
  payload: jsonb("payload"),
  actorStaffId: uuid("actor_staff_id").references(() => staffUsers.id),
  actorClientAccountId: uuid("actor_client_account_id").references(
    () => clientAccounts.id,
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderEvents = pgTable("order_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  title: text("title").notNull(),
  body: text("body"),
  visibleToClient: boolean("visible_to_client").default(false).notNull(),
  confirmed: boolean("confirmed").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const managerReminders = pgTable("manager_reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  inquiryId: uuid("inquiry_id").references(() => inquiries.id),
  orderId: uuid("order_id").references(() => orders.id),
  kind: text("kind").notNull(),
  dueAt: timestamp("due_at").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
});

export const workshopResources = pgTable("workshop_resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  workshopId: uuid("workshop_id")
    .notNull()
    .references(() => workshops.id),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  active: boolean("active").default(true).notNull(),
});
