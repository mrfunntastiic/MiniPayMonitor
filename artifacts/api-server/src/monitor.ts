import axios from "axios";
import { db } from "@workspace/db";
import { alertsTable, monitorStateTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./lib/logger";

const CELOSCAN_API = "https://api.celoscan.io/api";
const POLL_INTERVAL_MS = 60_000; // 1 minute
const INCOMING_THRESHOLD_USD = 1000;
const LOW_BALANCE_THRESHOLD_USD = 1000;
const LOW_BALANCE_ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown

const MONITORED_WALLETS = [
  { address: "0xCb205D7ca9840393f43941dDEAc6a7bF8deD4c5a", label: "Deposit Global", group: "deposit" },
  { address: "0x65cc602e616ca786bdb4bab00a6272060f0082fb", label: "Reward Europe / US", group: "reward-europe" },
  { address: "0x22Bc6F7f356F69EE8103475Aa1A864a0D77fC3e6", label: "Reward Asia", group: "reward-asia" },
];

const DEPOSIT_WALLET = MONITORED_WALLETS.find((w) => w.group === "deposit")!;

const TOKEN_PRICES: Record<string, number> = { USDC: 1, USDT: 1, cUSD: 1, cEUR: 1.08, CELO: 0.5 };

// Fetch latest token prices from coingecko
async function refreshPrices() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=celo,usd-coin,tether,celo-dollar,celo-euro&vs_currencies=usd",
      { timeout: 8000 }
    );
    TOKEN_PRICES["CELO"] = res.data.celo?.usd ?? 0.5;
    TOKEN_PRICES["USDC"] = res.data["usd-coin"]?.usd ?? 1;
    TOKEN_PRICES["USDT"] = res.data.tether?.usd ?? 1;
    TOKEN_PRICES["cUSD"] = res.data["celo-dollar"]?.usd ?? 1;
    TOKEN_PRICES["cEUR"] = res.data["celo-euro"]?.usd ?? 1.08;
  } catch {
    // keep existing prices
  }
}

// Get or create monitor state row for a wallet
async function getState(walletAddress: string) {
  const rows = await db
    .select()
    .from(monitorStateTable)
    .where(eq(monitorStateTable.walletAddress, walletAddress));
  if (rows.length > 0) return rows[0];
  const [inserted] = await db
    .insert(monitorStateTable)
    .values({ walletAddress })
    .returning();
  return inserted;
}

async function updateLastSeenTx(walletAddress: string, txHash: string) {
  await db
    .update(monitorStateTable)
    .set({ lastSeenTxHash: txHash, updatedAt: new Date() })
    .where(eq(monitorStateTable.walletAddress, walletAddress));
}

async function updateLowBalanceAlertTime(walletAddress: string) {
  await db
    .update(monitorStateTable)
    .set({ lastLowBalanceAlertAt: new Date(), updatedAt: new Date() })
    .where(eq(monitorStateTable.walletAddress, walletAddress));
}

async function createAlert(data: {
  walletAddress: string;
  walletLabel: string;
  token: string;
  changeType: "increase" | "decrease";
  oldValue: string;
  newValue: string;
  changePercent?: number;
}) {
  await db.insert(alertsTable).values({
    walletAddress: data.walletAddress,
    walletLabel: data.walletLabel,
    token: data.token,
    changeType: data.changeType,
    oldValue: data.oldValue,
    newValue: data.newValue,
    changePercent: data.changePercent ?? null,
    isRead: false,
  });
  logger.info({ wallet: data.walletLabel, token: data.token, type: data.changeType }, "Alert created");
}

// Fetch recent incoming token transfers from Celoscan
async function fetchRecentIncomingTxs(address: string, afterHash: string | null) {
  const results: Array<{
    hash: string;
    token: string;
    value: number;
    usdValue: number;
    timestamp: string;
  }> = [];

  try {
    const res = await axios.get(CELOSCAN_API, {
      params: {
        module: "account",
        action: "tokentx",
        address,
        startblock: 0,
        endblock: 99999999,
        page: 1,
        offset: 50,
        sort: "desc",
      },
      timeout: 10000,
    });

    if (res.data.status !== "1") return results;

    const txs: Array<Record<string, string>> = res.data.result;
    const addrLower = address.toLowerCase();

    for (const tx of txs) {
      // Stop when we hit a previously seen tx
      if (afterHash && tx.hash === afterHash) break;

      // Only incoming
      if (tx.from.toLowerCase() === addrLower) continue;

      const decimals = parseInt(tx.tokenDecimal) || 18;
      const rawVal = BigInt(tx.value || "0");
      const divisor = BigInt(10 ** decimals);
      const tokenAmount = Number(rawVal) / Number(divisor);
      const symbol = tx.tokenSymbol || "?";
      const priceUsd = TOKEN_PRICES[symbol] ?? 1;
      const usdValue = tokenAmount * priceUsd;

      results.push({
        hash: tx.hash,
        token: symbol,
        value: tokenAmount,
        usdValue,
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      });
    }
  } catch (err) {
    logger.warn({ err, address }, "Failed to fetch transactions for monitoring");
  }

  return results;
}

// Fetch total USD balance of a wallet using RPC
async function getDepositTotalUsd(address: string): Promise<number> {
  try {
    // Only check USDC and USDT for deposit wallet (primary stablecoins)
    const STABLECOINS = [
      { contract: "0xceba9300f2b948710d2653dd7b07f33a8b32118c", symbol: "USDC", decimals: 6 },
      { contract: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e", symbol: "USDT", decimals: 6 },
      { contract: "0x765de816845861e75a25fca122bb6898b8b1282a", symbol: "cUSD", decimals: 18 },
    ];

    let total = 0;

    await Promise.all(
      STABLECOINS.map(async ({ contract, symbol, decimals }) => {
        try {
          const body = {
            jsonrpc: "2.0",
            id: 1,
            method: "eth_call",
            params: [
              {
                to: contract,
                data:
                  "0x70a08231" +
                  "000000000000000000000000" +
                  address.toLowerCase().replace("0x", ""),
              },
              "latest",
            ],
          };
          const res = await axios.post("https://forno.celo.org", body, { timeout: 8000 });
          const hex: string = res.data.result;
          if (!hex || hex === "0x") return;
          const raw = BigInt(hex);
          const divisor = BigInt(10 ** decimals);
          const amount = Number(raw) / Number(divisor);
          const price = TOKEN_PRICES[symbol] ?? 1;
          total += amount * price;
        } catch {
          // skip
        }
      })
    );

    return total;
  } catch {
    return 0;
  }
}

// Main polling loop
async function runMonitorCycle() {
  try {
    await refreshPrices();

    // --- Check each wallet for large incoming transactions ---
    for (const wallet of MONITORED_WALLETS) {
      const state = await getState(wallet.address);
      const afterHash = state?.lastSeenTxHash ?? null;

      const incoming = await fetchRecentIncomingTxs(wallet.address, afterHash);

      // Update last seen tx hash to most recent
      if (incoming.length > 0) {
        await updateLastSeenTx(wallet.address, incoming[0].hash);
      } else if (!afterHash) {
        // First run, seed with a dummy hash to prevent alerting on all old txs
        // Fetch and store latest tx hash without creating alerts
        const seedRes = await axios.get(CELOSCAN_API, {
          params: {
            module: "account",
            action: "tokentx",
            address: wallet.address,
            page: 1,
            offset: 1,
            sort: "desc",
          },
          timeout: 10000,
        }).catch(() => null);

        if (seedRes?.data?.status === "1" && seedRes.data.result?.length > 0) {
          await updateLastSeenTx(wallet.address, seedRes.data.result[0].hash);
        }
        continue; // Skip creating alerts on first run
      }

      // Create alerts for txs > $1000
      for (const tx of incoming) {
        if (tx.usdValue >= INCOMING_THRESHOLD_USD) {
          await createAlert({
            walletAddress: wallet.address,
            walletLabel: wallet.label,
            token: tx.token,
            changeType: "increase",
            oldValue: "0.0000",
            newValue: tx.value.toFixed(4),
          });
        }
      }
    }

    // --- Check Deposit Global balance for low balance alert ---
    const depositState = await getState(DEPOSIT_WALLET.address);
    const lastLowAlertAt = depositState?.lastLowBalanceAlertAt;
    const cooldownPassed =
      !lastLowAlertAt ||
      Date.now() - new Date(lastLowAlertAt).getTime() > LOW_BALANCE_ALERT_COOLDOWN_MS;

    if (cooldownPassed) {
      const totalUsd = await getDepositTotalUsd(DEPOSIT_WALLET.address);
      logger.info({ totalUsd }, "Deposit wallet balance checked");

      if (totalUsd < LOW_BALANCE_THRESHOLD_USD) {
        await createAlert({
          walletAddress: DEPOSIT_WALLET.address,
          walletLabel: DEPOSIT_WALLET.label,
          token: "USD",
          changeType: "decrease",
          oldValue: LOW_BALANCE_THRESHOLD_USD.toFixed(2),
          newValue: totalUsd.toFixed(2),
          changePercent: ((totalUsd - LOW_BALANCE_THRESHOLD_USD) / LOW_BALANCE_THRESHOLD_USD) * 100,
        });
        await updateLowBalanceAlertTime(DEPOSIT_WALLET.address);
      }
    }
  } catch (err) {
    logger.error({ err }, "Monitor cycle failed");
  }
}

export function startMonitor() {
  logger.info("Starting balance monitor (interval: 60s)");
  // Run immediately then schedule
  runMonitorCycle();
  setInterval(runMonitorCycle, POLL_INTERVAL_MS);
}
