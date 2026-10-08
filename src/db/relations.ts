import { relations } from "drizzle-orm";
import {
  checklistItems,
  clientAccounts,
  clientLoyalty,
  clients,
  estimateLines,
  estimateVersions,
  inquiries,
  loyaltyTransactions,
  memberships,
  operationChecklists,
  operations,
  orders,
  organizations,
  promotionRedemptions,
  promotions,
  staffUsers,
  supplements,
  vehicles,
  workshops,
} from "./schema";

export const organizationsRelations = relations(organizations, ({ many }) => ({
  workshops: many(workshops),
}));

export const workshopsRelations = relations(workshops, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [workshops.organizationId],
    references: [organizations.id],
  }),
  orders: many(orders),
}));

export const clientsRelations = relations(clients, ({ many, one }) => ({
  vehicles: many(vehicles),
  account: one(clientAccounts),
  loyalty: one(clientLoyalty),
  loyaltyTransactions: many(loyaltyTransactions),
}));

export const clientLoyaltyRelations = relations(clientLoyalty, ({ one }) => ({
  client: one(clients, {
    fields: [clientLoyalty.clientId],
    references: [clients.id],
  }),
}));

export const promotionsRelations = relations(promotions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [promotions.organizationId],
    references: [organizations.id],
  }),
  workshop: one(workshops, {
    fields: [promotions.workshopId],
    references: [workshops.id],
  }),
  redemptions: many(promotionRedemptions),
}));

export const loyaltyTransactionsRelations = relations(
  loyaltyTransactions,
  ({ one }) => ({
    client: one(clients, {
      fields: [loyaltyTransactions.clientId],
      references: [clients.id],
    }),
  }),
);

export const clientAccountsRelations = relations(clientAccounts, ({ one }) => ({
  client: one(clients, {
    fields: [clientAccounts.clientId],
    references: [clients.id],
  }),
}));

export const staffUsersRelations = relations(staffUsers, ({ many }) => ({
  memberships: many(memberships),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(clients, { fields: [orders.clientId], references: [clients.id] }),
  vehicle: one(vehicles, {
    fields: [orders.vehicleId],
    references: [vehicles.id],
  }),
  workshop: one(workshops, {
    fields: [orders.workshopId],
    references: [workshops.id],
  }),
  operations: many(operations),
  supplements: many(supplements),
  estimates: many(estimateVersions),
}));

export const operationsRelations = relations(operations, ({ one }) => ({
  order: one(orders, { fields: [operations.orderId], references: [orders.id] }),
  checklist: one(operationChecklists),
}));

export const operationChecklistsRelations = relations(
  operationChecklists,
  ({ one, many }) => ({
    operation: one(operations, {
      fields: [operationChecklists.operationId],
      references: [operations.id],
    }),
    items: many(checklistItems),
  }),
);

export const estimateVersionsRelations = relations(
  estimateVersions,
  ({ many }) => ({
    lines: many(estimateLines),
  }),
);

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  workshop: one(workshops, {
    fields: [inquiries.workshopId],
    references: [workshops.id],
  }),
}));
