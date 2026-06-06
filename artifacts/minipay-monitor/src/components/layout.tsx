import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetUnreadAlertCount, getGetUnreadAlertCountQueryKey } from "@workspace/api-client-react";
import { 
  Activity, 
  Wallet as WalletIcon, 
  Bell, 
  LayoutDashboard, 
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink
} from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: unreadAlerts } = useGetUnreadAlertCount({
    query: {
      queryKey: getGetUnreadAlertCountQueryKey(),
      refetchInterval: 30000,
    }
  });

  const unreadCount = unreadAlerts?.count || 0;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground dark">
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Activity className="h-5 w-5 text-primary mr-2" />
          <span className="font-bold tracking-tight text-primary">MiniPay Monitor</span>
        </div>
        
        <div className="p-4 flex-1">
          <nav className="space-y-1">
            <Link href="/" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${location === '/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`} data-testid="nav-dashboard">
              <LayoutDashboard className="h-4 w-4 mr-3" />
              Dashboard
            </Link>
            <Link href="/alerts" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${location === '/alerts' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`} data-testid="nav-alerts">
              <Bell className="h-4 w-4 mr-3" />
              Alerts
              {unreadCount > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
            
            <div className="mt-8 mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Wallets
            </div>
            
            <Link href="/wallet/0xCb205D7ca9840393f43941dDEAc6a7bF8deD4c5a" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${location === '/wallet/0xCb205D7ca9840393f43941dDEAc6a7bF8deD4c5a' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
              <WalletIcon className="h-4 w-4 mr-3" />
              Deposit Global
            </Link>
            <Link href="/wallet/0x65cc602e616ca786bdb4bab00a6272060f0082fb" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${location === '/wallet/0x65cc602e616ca786bdb4bab00a6272060f0082fb' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
              <WalletIcon className="h-4 w-4 mr-3" />
              Reward US/EU
            </Link>
            <Link href="/wallet/0x22Bc6F7f356F69EE8103475Aa1A864a0D77fC3e6" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${location === '/wallet/0x22Bc6F7f356F69EE8103475Aa1A864a0D77fC3e6' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
              <WalletIcon className="h-4 w-4 mr-3" />
              Reward Asia
            </Link>
          </nav>
        </div>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary mr-2" />
            System Operational
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden h-16 border-b border-border bg-card flex items-center px-4 justify-between">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-primary mr-2" />
            <span className="font-bold text-primary">MiniPay</span>
          </div>
          <div className="flex space-x-2">
            <Link href="/" className="p-2 text-muted-foreground">
              <LayoutDashboard className="h-5 w-5" />
            </Link>
            <Link href="/alerts" className="p-2 text-muted-foreground relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Link>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-background p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
