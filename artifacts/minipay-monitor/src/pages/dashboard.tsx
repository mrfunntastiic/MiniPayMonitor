import { useGetWallets, getGetWalletsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ExternalLink } from "lucide-react";

const DEPOSIT_ADDR = "0xCb205D7ca9840393f43941dDEAc6a7bF8deD4c5a";
const REWARD_EU_US_ADDR = "0x65cc602e616ca786bdb4bab00a6272060f0082fb";
const REWARD_ASIA_ADDR = "0x22Bc6F7f356F69EE8103475Aa1A864a0D77fC3e6";

type CardDef = {
  id: string;
  label: string;
  region: string;
  token: string;
  address: string;
  accent: string;
};

const SECTIONS: { title: string; cards: CardDef[] }[] = [
  {
    title: "WALLET DEPOSIT",
    cards: [
      { id: "deposit-usdt", label: "Saldo Deposit", region: "Global", token: "USDT", address: DEPOSIT_ADDR, accent: "#06b6d4" },
      { id: "deposit-usdc", label: "Saldo Deposit", region: "Global", token: "USDC", address: DEPOSIT_ADDR, accent: "#8b5cf6" },
    ],
  },
  {
    title: "WALLET REWARD",
    cards: [
      { id: "reward-eu-usdt",   label: "Saldo Reward", region: "Europe", token: "USDT", address: REWARD_EU_US_ADDR, accent: "#06b6d4" },
      { id: "reward-eu-usdc",   label: "Saldo Reward", region: "Europe", token: "USDC", address: REWARD_EU_US_ADDR, accent: "#8b5cf6" },
      { id: "reward-us-usdt",   label: "Saldo Reward", region: "US",     token: "USDT", address: REWARD_EU_US_ADDR, accent: "#f59e0b" },
      { id: "reward-us-usdc",   label: "Saldo Reward", region: "US",     token: "USDC", address: REWARD_EU_US_ADDR, accent: "#f59e0b" },
      { id: "reward-asia-usdt", label: "Saldo Reward", region: "Asia",   token: "USDT", address: REWARD_ASIA_ADDR,  accent: "#ec4899" },
      { id: "reward-asia-usdc", label: "Saldo Reward", region: "Asia",   token: "USDC", address: REWARD_ASIA_ADDR,  accent: "#ec4899" },
    ],
  },
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

function WalletCard({
  card,
  balance,
  usdValue,
  isLoading,
}: {
  card: CardDef;
  balance: string | undefined;
  usdValue: number | undefined;
  isLoading: boolean;
}) {
  return (
    <div
      key={card.id}
      data-testid={`card-${card.id}`}
      className="relative rounded-xl p-5 transition-all duration-200 overflow-hidden"
      style={{
        background: "hsl(230 25% 11%)",
        border: `1px solid ${card.accent}33`,
        boxShadow: `0 0 20px ${card.accent}0d`,
      }}
    >
      {/* left accent bar */}
      <div
        className="absolute top-0 left-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ background: `linear-gradient(to bottom, ${card.accent}, ${card.accent}44)` }}
      />

      {/* header */}
      <div className="flex items-start justify-between mb-4 pl-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1"
            style={{ color: card.accent + "99" }}>
            {card.label}
          </p>
          <p className="text-sm font-bold text-white">
            {card.region}
          </p>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{ background: card.accent + "22", color: card.accent, border: `1px solid ${card.accent}44` }}
          data-testid={`badge-${card.id}`}
        >
          {card.token}
        </span>
      </div>

      {/* balance */}
      <div className="pl-2 mb-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-36" style={{ background: "hsl(230 20% 18%)" }} />
            <Skeleton className="h-4 w-24" style={{ background: "hsl(230 20% 18%)" }} />
          </div>
        ) : (
          <>
            <div
              className="text-3xl font-mono font-bold tracking-tight leading-none"
              style={{ color: card.accent }}
              data-testid={`balance-${card.id}`}
            >
              {formatBalance(balance)}
            </div>
            <div className="text-xs mt-1.5 font-mono" style={{ color: "hsl(220 12% 50%)" }}>
              {card.token} · {formatUsd(usdValue)}
            </div>
            {/* accent line */}
            <div className="mt-3 h-[2px] w-16 rounded-full" style={{ background: `linear-gradient(to right, ${card.accent}, transparent)` }} />
          </>
        )}
      </div>

      {/* footer */}
      <div className="pl-2 pt-3 border-t flex items-center justify-between"
        style={{ borderColor: "hsl(230 20% 18%)" }}>
        <span className="text-[11px] font-mono" style={{ color: "hsl(220 12% 45%)" }}>
          {shortenAddr(card.address)}
        </span>
        <a
          href={`https://celoscan.io/address/${card.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors"
          style={{ color: "hsl(220 12% 45%)" }}
          data-testid={`link-celoscan-${card.id}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: wallets, isLoading, dataUpdatedAt } = useGetWallets({
    query: {
      queryKey: getGetWalletsQueryKey(),
      refetchInterval: 30000,
    },
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  function getTokenData(address: string, symbol: string) {
    const wallet = wallets?.find((w) => w.address.toLowerCase() === address.toLowerCase());
    const token = wallet?.tokens?.find((t) => t.symbol === symbol);
    return { balance: token?.balance, usdValue: token?.usdValue };
  }

  return (
    <div className="space-y-8">
      {/* header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: "hsl(220 12% 50%)" }}>
          <RefreshCw className="h-3 w-3" />
          Auto-refresh setiap 30 detik
          {lastUpdated && <span className="opacity-60">· {lastUpdated}</span>}
        </p>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title} className="space-y-4">
          {/* section label */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "hsl(230 20% 18%)" }} />
            <span
              className="text-[11px] font-bold tracking-widest px-3 py-1 rounded-full border"
              style={{
                color: "hsl(180 80% 55%)",
                borderColor: "hsl(180 80% 50% / 0.3)",
                background: "hsl(180 80% 50% / 0.08)",
              }}
            >
              {section.title}
            </span>
            <div className="flex-1 h-px" style={{ background: "hsl(230 20% 18%)" }} />
          </div>

          {/* cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {section.cards.map((card) => {
              const { balance, usdValue } = getTokenData(card.address, card.token);
              return (
                <WalletCard
                  key={card.id}
                  card={card}
                  balance={balance}
                  usdValue={usdValue}
                  isLoading={isLoading}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
