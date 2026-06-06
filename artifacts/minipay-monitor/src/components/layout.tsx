import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetUnreadAlertCount, getGetUnreadAlertCountQueryKey } from "@workspace/api-client-react";
import {
  Activity,
  Wallet as WalletIcon,
  Bell,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";

const DEPOSIT_ADDR = "0xCb205D7ca9840393f43941dDEAc6a7bF8deD4c5a";
const REWARD_EU_ADDR = "0x65cc602e616ca786bdb4bab00a6272060f0082fb";
const REWARD_US_ADDR = "0x74667d9eDD871150cE38EBC26355758ba31F44B5";
const REWARD_ASIA_ADDR = "0x22Bc6F7f356F69EE8103475Aa1A864a0D77fC3e6";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: unreadAlerts } = useGetUnreadAlertCount({
    query: {
      queryKey: getGetUnreadAlertCountQueryKey(),
      refetchInterval: 30000,
    },
  });

  const unreadCount = unreadAlerts?.count || 0;

  const navLinkClass = (path: string) =>
    `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
      location === path
        ? "text-white"
        : "hover:text-white"
    }`;

  const navLinkStyle = (path: string): React.CSSProperties =>
    location === path
      ? {
          background: "linear-gradient(90deg, hsl(180 80% 50% / 0.18), transparent)",
          color: "hsl(180 80% 55%)",
          borderLeft: "2px solid hsl(180 80% 50%)",
        }
      : { color: "hsl(220 12% 50%)" };

  const Sidebar = () => (
    <div className="flex flex-col h-full" style={{ background: "hsl(230 25% 6%)" }}>
      {/* logo */}
      <div className="h-16 flex items-center px-5 border-b" style={{ borderColor: "hsl(230 20% 14%)" }}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(180 80% 50% / 0.15)", border: "1px solid hsl(180 80% 50% / 0.3)" }}>
            <Activity className="h-4 w-4" style={{ color: "hsl(180 80% 55%)" }} />
          </div>
          <span className="font-bold text-sm text-white tracking-tight">MiniPay Monitor</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2"
          style={{ color: "hsl(220 12% 38%)" }}>Menu</p>

        <Link
          href="/"
          className={navLinkClass("/")}
          style={navLinkStyle("/")}
          data-testid="nav-dashboard"
          onClick={() => setMobileOpen(false)}
        >
          <LayoutDashboard className="h-4 w-4 mr-3 shrink-0" />
          Dashboard
        </Link>

        <Link
          href="/alerts"
          className={navLinkClass("/alerts")}
          style={navLinkStyle("/alerts")}
          data-testid="nav-alerts"
          onClick={() => setMobileOpen(false)}
        >
          <Bell className="h-4 w-4 mr-3 shrink-0" />
          Alerts
          {unreadCount > 0 && (
            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "hsl(0 84% 60% / 0.2)", color: "hsl(0 84% 65%)", border: "1px solid hsl(0 84% 60% / 0.3)" }}>
              {unreadCount}
            </span>
          )}
        </Link>

        <div className="pt-4 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-3"
            style={{ color: "hsl(220 12% 38%)" }}>Wallets</p>
        </div>

        <Link
          href={`/wallet/${DEPOSIT_ADDR}`}
          className={navLinkClass(`/wallet/${DEPOSIT_ADDR}`)}
          style={navLinkStyle(`/wallet/${DEPOSIT_ADDR}`)}
          onClick={() => setMobileOpen(false)}
        >
          <WalletIcon className="h-4 w-4 mr-3 shrink-0" />
          Deposit Global
        </Link>

        <Link
          href={`/wallet/${REWARD_EU_ADDR}`}
          className={navLinkClass(`/wallet/${REWARD_EU_ADDR}`)}
          style={navLinkStyle(`/wallet/${REWARD_EU_ADDR}`)}
          onClick={() => setMobileOpen(false)}
        >
          <WalletIcon className="h-4 w-4 mr-3 shrink-0" />
          Reward Europe
        </Link>

        <Link
          href={`/wallet/${REWARD_US_ADDR}`}
          className={navLinkClass(`/wallet/${REWARD_US_ADDR}`)}
          style={navLinkStyle(`/wallet/${REWARD_US_ADDR}`)}
          onClick={() => setMobileOpen(false)}
        >
          <WalletIcon className="h-4 w-4 mr-3 shrink-0" />
          Reward US
        </Link>

        <Link
          href={`/wallet/${REWARD_ASIA_ADDR}`}
          className={navLinkClass(`/wallet/${REWARD_ASIA_ADDR}`)}
          style={navLinkStyle(`/wallet/${REWARD_ASIA_ADDR}`)}
          onClick={() => setMobileOpen(false)}
        >
          <WalletIcon className="h-4 w-4 mr-3 shrink-0" />
          Reward Asia
        </Link>
      </nav>

      {/* status */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "hsl(230 20% 14%)" }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(220 12% 45%)" }}>
          <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: "hsl(154 60% 45%)" }} />
          System Operational
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full dark" style={{ background: "hsl(230 25% 8%)" }}>
      {/* Desktop sidebar */}
      <aside className="w-56 shrink-0 hidden md:block border-r" style={{ borderColor: "hsl(230 20% 14%)" }}>
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-56 h-full border-r" style={{ borderColor: "hsl(230 20% 14%)" }}>
            <Sidebar />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden h-14 border-b flex items-center px-4 justify-between"
          style={{ background: "hsl(230 25% 6%)", borderColor: "hsl(230 20% 14%)" }}>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: "hsl(180 80% 55%)" }} />
            <span className="font-bold text-sm text-white">MiniPay</span>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Link href="/alerts" className="relative p-1.5" style={{ color: "hsl(220 12% 50%)" }}>
                <Bell className="h-5 w-5" />
                <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full" style={{ background: "hsl(0 84% 60%)" }} />
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1.5 rounded-md"
              style={{ color: "hsl(220 12% 50%)" }}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
