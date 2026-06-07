import { Router } from "express";
import { db } from "@workspace/db";
import { alertsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { sendTelegramMessage } from "../telegram";

const router = Router();

// GET /api/alerts
router.get("/alerts", async (req, res) => {
  try {
    const alerts = await db
      .select()
      .from(alertsTable)
      .orderBy(desc(alertsTable.createdAt))
      .limit(50);

    res.json(
      alerts.map((a) => ({
        id: a.id,
        walletAddress: a.walletAddress,
        walletLabel: a.walletLabel,
        token: a.token,
        changeType: a.changeType,
        oldValue: a.oldValue,
        newValue: a.newValue,
        changePercent: a.changePercent,
        isRead: a.isRead,
        createdAt: a.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get alerts");
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// GET /api/alerts/unread-count
router.get("/alerts/unread-count", async (req, res) => {
  try {
    const alerts = await db
      .select()
      .from(alertsTable)
      .where(eq(alertsTable.isRead, false));
    res.json({ count: alerts.length });
  } catch (err) {
    req.log.error({ err }, "Failed to get unread count");
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// PATCH /api/alerts/:id/read
router.patch("/alerts/:id/read", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [updated] = await db
      .update(alertsTable)
      .set({ isRead: true })
      .where(eq(alertsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }
    res.json({
      id: updated.id,
      walletAddress: updated.walletAddress,
      walletLabel: updated.walletLabel,
      token: updated.token,
      changeType: updated.changeType,
      oldValue: updated.oldValue,
      newValue: updated.newValue,
      changePercent: updated.changePercent,
      isRead: updated.isRead,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to mark alert read");
    res.status(500).json({ error: "Failed to update alert" });
  }
});

// POST /api/alerts/test-telegram
router.post("/alerts/test-telegram", async (req, res) => {
  try {
    const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    await sendTelegramMessage(
      `🔔 <b>Test Notifikasi MiniPay Monitor</b>\n\n` +
      `✅ Koneksi Telegram berhasil!\n` +
      `🕐 Waktu: ${now} WIB\n\n` +
      `Bot siap mengirim alert untuk:\n` +
      `• 🟢 Transfer masuk ≥ $1,000\n` +
      `• 🔴 Saldo wallet < $1,000`
    );
    res.json({ ok: true, message: "Test notification sent to Telegram" });
  } catch (err) {
    req.log.error({ err }, "Failed to send test Telegram notification");
    res.status(500).json({ error: "Failed to send test notification" });
  }
});

export default router;
