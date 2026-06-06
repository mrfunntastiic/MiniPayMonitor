import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const monitorStateTable = pgTable("monitor_state", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  lastSeenTxHash: text("last_seen_tx_hash"),
  lastLowBalanceAlertAt: timestamp("last_low_balance_alert_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type MonitorState = typeof monitorStateTable.$inferSelect;
