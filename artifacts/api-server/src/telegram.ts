import axios from "axios";
import { logger } from "./lib/logger";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = "@minipaymonitor";

export async function sendTelegramMessage(text: string): Promise<void> {
  if (!BOT_TOKEN) {
    logger.warn("TELEGRAM_BOT_TOKEN not set, skipping Telegram notification");
    return;
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHANNEL_ID,
        text,
        parse_mode: "HTML",
      },
      { timeout: 10000 }
    );
    logger.info({ channel: CHANNEL_ID }, "Telegram notification sent");
  } catch (err) {
    logger.error({ err }, "Failed to send Telegram notification");
  }
}

export function buildLargeIncomingMessage(data: {
  walletLabel: string;
  walletAddress: string;
  token: string;
  amount: string;
  usdValue: number;
  txHash: string;
  timestamp: string;
}): string {
  const usd = data.usdValue.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const shortAddr = `${data.walletAddress.slice(0, 6)}...${data.walletAddress.slice(-4)}`;
  const shortHash = `${data.txHash.slice(0, 10)}...`;
  return (
    `🟢 <b>Incoming Transfer Besar</b>\n\n` +
    `💼 Wallet: <b>${data.walletLabel}</b> (<code>${shortAddr}</code>)\n` +
    `💰 Token: <b>${data.amount} ${data.token}</b>\n` +
    `💵 Nilai: <b>~$${usd}</b>\n` +
    `🔗 Tx: <code>${shortHash}</code>\n` +
    `🕐 Waktu: ${new Date(data.timestamp).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`
  );
}

export function buildLowBalanceMessage(data: {
  walletLabel: string;
  walletAddress: string;
  currentUsd: number;
  thresholdUsd: number;
}): string {
  const current = data.currentUsd.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const threshold = data.thresholdUsd.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const shortAddr = `${data.walletAddress.slice(0, 6)}...${data.walletAddress.slice(-4)}`;
  return (
    `🔴 <b>Saldo Rendah!</b>\n\n` +
    `💼 Wallet: <b>${data.walletLabel}</b> (<code>${shortAddr}</code>)\n` +
    `💵 Saldo: <b>$${current}</b>\n` +
    `⚠️ Threshold: <b>$${threshold}</b>\n` +
    `📉 Saldo di bawah batas minimum — segera top up!`
  );
}
