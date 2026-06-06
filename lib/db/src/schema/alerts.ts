import { pgTable, serial, text, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  walletLabel: text("wallet_label").notNull(),
  token: text("token").notNull(),
  changeType: text("change_type").notNull(), // "increase" | "decrease"
  oldValue: text("old_value").notNull(),
  newValue: text("new_value").notNull(),
  changePercent: real("change_percent"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
