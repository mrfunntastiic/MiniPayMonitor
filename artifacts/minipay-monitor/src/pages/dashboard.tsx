import { useGetWallets, getGetWalletsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ExternalLink } from "lucide-react";

const DEPOSIT_ADDR = "0xCb205D7ca9840393f43941dDEAc6a7bF8deD4c5a";
const REWARD_EU_US_ADDR = "0x65cc602e616ca786bdb4bab00a6272060f0082fb";
const REWARD_ASIA_ADDR = "0x22Bc6F7f356F69EE8103475Aa1A864a0D77fC3e6";

const CARDS = [
  { id: "deposit-usdt",    label: "Deposit",      region: "Global",  token: "USDT", address: DEPOSIT_ADDR,      accent: "#22d3ee" },
  { id: "deposit-usdc",    label: "Deposit",      region: "Global",  token: "USDC", address: DEPOSIT_ADDR,      accent: "#6366f1" },
  { id: "reward-eu-usdt",  label: "Reward",       region: "Europe",  token: "USDT", address: REWARD_EU_US_ADDR, accent: "#34d399" },
  { id: "reward-us-usdt",  label: "Reward",       region: "US",      token: "USDT", address: REWARD_EU_US_ADDR, accent: "#f59e0b" },
  { id: "reward-asia-usdt",label: "Reward",       region: "Asia",    token: "USDT", address: REWARD_ASIA_ADDR,  accent: "#f472b6" },
];

function shortenAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatBalance(val: string | undefined): string {
  if (!val || val === "0" || val === "0.0000") return "0.00";
  const n = parseFloat(val);
  if (isNaN(n)) return "0.00";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatUsd(val: number | undefined): string {
  if (!val) return "$0.00";
  return val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

export default function Dashboard() {
  const { data: wallets, isLoading, dataUpdatedAt } = useGetWallets({
    query: {
      queryKey: getGetWalletsQueryKey(),
      refetchInterval: 30000,
    },
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  function getTokenData(address: string, symbol: string) {
    const wallet = wallets?.find((w) => w.address.toLowerCase() === address.toLowerCase());
    const token = wallet?.tokens?.find((t) => t.symbol === symbol);
    return { balance: token?.balance, usdValue: token?.usdValue };
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Saldo Wallet</h1>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Auto-refresh setiap 30 detik
            {lastUpdated && <span className="ml-1 opacity-60">· {lastUpdated}</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {CARDS.map((card) => {
          const { balance, usdValue } = getTokenData(card.address, card.token);
          return (
            <div
              key={card.id}
              data-testid={`card-${card.id}`}
              className="group relative rounded-xl border border-border bg-card p-5 hover:border-[--accent] transition-all duration-200"
              style={{ "--accent": card.accent } as React.CSSProperties}
            >
              {/* accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
                style={{ background: card.accent }}
              />

              {/* header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {card.region}
                  </p>
                </div>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: card.accent + "22", color: card.accent }}
                  data-testid={`badge-${card.id}`}
                >
                  {card.token}
                </span>
              </div>

              {/* balance */}
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-36" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ) : (
                <div>
                  <div
                    className="text-3xl font-mono font-bold tracking-tight leading-none"
                    style={{ color: card.accent }}
                    data-testid={`balance-${card.id}`}
                  >
                    {formatBalance(balance)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                    {card.token} · {formatUsd(usdValue)}
                  </div>
                </div>
              )}

              {/* footer */}
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {shortenAddr(card.address)}
                </span>
                <a
                  href={`https://celoscan.io/address/${card.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`link-celoscan-${card.id}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
