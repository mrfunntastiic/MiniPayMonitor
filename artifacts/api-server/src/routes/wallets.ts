import { Router } from "express";
import axios from "axios";

const router = Router();

const CELO_MAINNET_RPC = "https://forno.celo.org";
const CELOSCAN_API = "https://api.celoscan.io/api";

const MONITORED_WALLETS = [
  {
    address: "0xCb205D7ca9840393f43941dDEAc6a7bF8deD4c5a",
    label: "Deposit Global",
    group: "deposit",
  },
  {
    address: "0x65cc602e616ca786bdb4bab00a6272060f0082fb",
    label: "Reward Europe / US",
    group: "reward-europe",
  },
  {
    address: "0x22Bc6F7f356F69EE8103475Aa1A864a0D77fC3e6",
    label: "Reward Asia",
    group: "reward-asia",
  },
];

const TOKEN_CONTRACTS: Record<string, { symbol: string; name: string; decimals: number; logoUrl: string | null }> = {
  "0xceba9300f2b948710d2653dd7b07f33a8b32118c": {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png",
  },
  "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e": {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
  },
  "0x765de816845861e75a25fca122bb6898b8b1282a": {
    symbol: "cUSD",
    name: "Celo Dollar",
    decimals: 18,
    logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/7236.png",
  },
  "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73": {
    symbol: "cEUR",
    name: "Celo Euro",
    decimals: 18,
    logoUrl: null,
  },
  "0x0000000000000000000000000000000000000000": {
    symbol: "CELO",
    name: "Celo",
    decimals: 18,
    logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/5567.png",
  },
};

// Simple in-memory price cache
let priceCache: Record<string, number> = {};
let priceCacheTime = 0;

async function getTokenPrices(): Promise<Record<string, number>> {
  const now = Date.now();
  if (now - priceCacheTime < 60_000 && Object.keys(priceCache).length > 0) {
    return priceCache;
  }
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=celo,usd-coin,tether,celo-dollar,celo-euro&vs_currencies=usd",
      { timeout: 8000 }
    );
    priceCache = {
      CELO: res.data.celo?.usd ?? 0.5,
      USDC: res.data["usd-coin"]?.usd ?? 1,
      USDT: res.data.tether?.usd ?? 1,
      cUSD: res.data["celo-dollar"]?.usd ?? 1,
      cEUR: res.data["celo-euro"]?.usd ?? 1.08,
    };
    priceCacheTime = now;
    return priceCache;
  } catch {
    return { CELO: 0.5, USDC: 1, USDT: 1, cUSD: 1, cEUR: 1.08 };
  }
}

async function getERC20Balance(
  walletAddress: string,
  contractAddress: string,
  decimals: number
): Promise<string> {
  try {
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [
        {
          to: contractAddress,
          data:
            "0x70a08231" +
            "000000000000000000000000" +
            walletAddress.toLowerCase().replace("0x", ""),
        },
        "latest",
      ],
    };
    const res = await axios.post(CELO_MAINNET_RPC, body, { timeout: 8000 });
    const hex: string = res.data.result;
    if (!hex || hex === "0x") return "0";
    const raw = BigInt(hex);
    const divisor = BigInt(10 ** decimals);
    const whole = raw / divisor;
    const fraction = raw % divisor;
    const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 4);
    return `${whole}.${fractionStr}`;
  } catch {
    return "0";
  }
}

async function getNativeBalance(walletAddress: string): Promise<string> {
  try {
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [walletAddress, "latest"],
    };
    const res = await axios.post(CELO_MAINNET_RPC, body, { timeout: 8000 });
    const hex: string = res.data.result;
    if (!hex || hex === "0x") return "0";
    const raw = BigInt(hex);
    const divisor = BigInt(10 ** 18);
    const whole = raw / divisor;
    const fraction = raw % divisor;
    const fractionStr = fraction.toString().padStart(18, "0").slice(0, 4);
    return `${whole}.${fractionStr}`;
  } catch {
    return "0";
  }
}

async function getWalletTokenBalances(walletAddress: string) {
  const prices = await getTokenPrices();

  const tokenEntries = Object.entries(TOKEN_CONTRACTS).filter(
    ([addr]) => addr !== "0x0000000000000000000000000000000000000000"
  );

  const [celoBalance, ...erc20Balances] = await Promise.all([
    getNativeBalance(walletAddress),
    ...tokenEntries.map(([addr, info]) =>
      getERC20Balance(walletAddress, addr, info.decimals)
    ),
  ]);

  const tokens: Array<{
    symbol: string;
    name: string;
    balance: string;
    usdValue: number;
    contractAddress: string;
    decimals: number;
    logoUrl: string | null;
  }> = [];

  // CELO native
  const celoInfo = TOKEN_CONTRACTS["0x0000000000000000000000000000000000000000"];
  const celoNum = parseFloat(celoBalance);
  if (celoNum > 0) {
    tokens.push({
      symbol: "CELO",
      name: celoInfo.name,
      balance: celoBalance,
      usdValue: celoNum * (prices["CELO"] ?? 0.5),
      contractAddress: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      logoUrl: celoInfo.logoUrl,
    });
  }

  // ERC20 tokens
  tokenEntries.forEach(([addr, info], i) => {
    const bal = erc20Balances[i];
    const num = parseFloat(bal);
    if (num > 0) {
      tokens.push({
        symbol: info.symbol,
        name: info.name,
        balance: bal,
        usdValue: num * (prices[info.symbol] ?? 1),
        contractAddress: addr,
        decimals: info.decimals,
        logoUrl: info.logoUrl ?? null,
      });
    }
  });

  return tokens;
}

// GET /api/wallets
router.get("/wallets", async (req, res) => {
  try {
    const results = await Promise.all(
      MONITORED_WALLETS.map(async (w) => {
        const tokens = await getWalletTokenBalances(w.address);
        const totalUsdValue = tokens.reduce((acc, t) => acc + t.usdValue, 0);
        return {
          ...w,
          totalUsdValue,
          tokens,
          lastUpdated: new Date().toISOString(),
        };
      })
    );
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Failed to get wallets");
    res.status(500).json({ error: "Failed to fetch wallet data" });
  }
});

// GET /api/wallets/summary
router.get("/wallets/summary", async (req, res) => {
  try {
    const allWallets = await Promise.all(
      MONITORED_WALLETS.map(async (w) => {
        const tokens = await getWalletTokenBalances(w.address);
        const totalUsdValue = tokens.reduce((acc, t) => acc + t.usdValue, 0);
        return { ...w, totalUsdValue, tokens };
      })
    );

    const totalUsdValue = allWallets.reduce((acc, w) => acc + w.totalUsdValue, 0);
    const depositTotal = allWallets
      .filter((w) => w.group === "deposit")
      .reduce((acc, w) => acc + w.totalUsdValue, 0);
    const rewardTotal = allWallets
      .filter((w) => w.group.startsWith("reward"))
      .reduce((acc, w) => acc + w.totalUsdValue, 0);

    // Token breakdown across all wallets
    const tokenMap: Record<string, { symbol: string; totalBalance: number; totalUsdValue: number }> = {};
    for (const w of allWallets) {
      for (const t of w.tokens) {
        if (!tokenMap[t.symbol]) {
          tokenMap[t.symbol] = { symbol: t.symbol, totalBalance: 0, totalUsdValue: 0 };
        }
        tokenMap[t.symbol].totalBalance += parseFloat(t.balance);
        tokenMap[t.symbol].totalUsdValue += t.usdValue;
      }
    }

    const tokenBreakdown = Object.values(tokenMap).map((t) => ({
      symbol: t.symbol,
      totalBalance: t.totalBalance.toFixed(4),
      totalUsdValue: t.totalUsdValue,
    }));

    res.json({
      totalUsdValue,
      walletCount: MONITORED_WALLETS.length,
      depositTotal,
      rewardTotal,
      tokenBreakdown,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get wallet summary");
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

// GET /api/wallets/:address/balances
router.get("/wallets/:address/balances", async (req, res) => {
  try {
    const { address } = req.params;
    const tokens = await getWalletTokenBalances(address);
    res.json(tokens);
  } catch (err) {
    req.log.error({ err }, "Failed to get wallet balances");
    res.status(500).json({ error: "Failed to fetch balances" });
  }
});

export { MONITORED_WALLETS, getWalletTokenBalances };
export default router;
