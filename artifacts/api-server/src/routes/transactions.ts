import { Router } from "express";
import axios from "axios";

const router = Router();

const CELOSCAN_API = "https://api.celoscan.io/api";

async function fetchTransactions(address: string) {
  try {
    // Fetch normal (CELO) transactions
    const [normalRes, tokenRes] = await Promise.all([
      axios.get(CELOSCAN_API, {
        params: {
          module: "account",
          action: "txlist",
          address,
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 25,
          sort: "desc",
        },
        timeout: 10000,
      }),
      axios.get(CELOSCAN_API, {
        params: {
          module: "account",
          action: "tokentx",
          address,
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 25,
          sort: "desc",
        },
        timeout: 10000,
      }),
    ]);

    const normalTxs: Array<Record<string, string>> =
      normalRes.data.status === "1" ? normalRes.data.result : [];
    const tokenTxs: Array<Record<string, string>> =
      tokenRes.data.status === "1" ? tokenRes.data.result : [];

    const addrLower = address.toLowerCase();

    const normal = normalTxs
      .filter((tx) => parseFloat(tx.value) > 0)
      .map((tx) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: (parseFloat(tx.value) / 1e18).toFixed(4),
        token: "CELO",
        usdValue: null,
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
        type: tx.from.toLowerCase() === addrLower ? "out" : "in",
        blockNumber: parseInt(tx.blockNumber),
      }));

    const tokens = tokenTxs.map((tx) => {
      const decimals = parseInt(tx.tokenDecimal) || 18;
      const rawVal = BigInt(tx.value || "0");
      const divisor = BigInt(10 ** decimals);
      const whole = rawVal / divisor;
      const fraction = (rawVal % divisor).toString().padStart(decimals, "0").slice(0, 4);
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: `${whole}.${fraction}`,
        token: tx.tokenSymbol || "?",
        usdValue: null,
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
        type: tx.from.toLowerCase() === addrLower ? "out" : "in",
        blockNumber: parseInt(tx.blockNumber),
      };
    });

    // Merge and sort by timestamp desc
    const all = [...normal, ...tokens].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Dedupe by hash
    const seen = new Set<string>();
    const deduped = all.filter((tx) => {
      if (seen.has(tx.hash + tx.token)) return false;
      seen.add(tx.hash + tx.token);
      return true;
    });

    return deduped.slice(0, 40);
  } catch {
    return [];
  }
}

// GET /api/transactions/:address
router.get("/transactions/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const txs = await fetchTransactions(address);
    res.json({
      transactions: txs,
      total: txs.length,
      page: 1,
      limit: 40,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get transactions");
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;
