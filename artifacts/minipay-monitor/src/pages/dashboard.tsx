import { useGetWallets, getGetWalletsQueryKey, useGetWalletsSummary, getGetWalletsSummaryQueryKey, useGetAlerts, getGetAlertsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AddressLink } from "@/components/address-link";
import { formatUsd, formatTokenAmount, timeAgo, formatPercent } from "@/lib/format";
import { Link } from "wouter";
import { ArrowUpRight, ArrowDownRight, Bell, Clock, Wallet as WalletIcon, RefreshCw, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetWalletsSummary({
    query: {
      queryKey: getGetWalletsSummaryQueryKey(),
      refetchInterval: 30000,
    }
  });

  const { data: wallets, isLoading: loadingWallets } = useGetWallets({
    query: {
      queryKey: getGetWalletsQueryKey(),
      refetchInterval: 30000,
    }
  });
  
  const { data: alerts, isLoading: loadingAlerts } = useGetAlerts({
    query: {
      queryKey: getGetAlertsQueryKey(),
      refetchInterval: 30000,
    }
  });

  const recentAlerts = alerts?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Global Monitor</h1>
          <p className="text-muted-foreground text-sm flex items-center mt-1">
            <RefreshCw className="h-3 w-3 mr-1" /> Auto-refreshing every 30s
            {summary?.lastUpdated && (
              <span className="ml-2 pl-2 border-l border-border">
                Last updated: {timeAgo(summary.lastUpdated)}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {/* Action buttons could go here */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value Managed</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <div className="text-3xl font-bold font-mono tracking-tight text-primary">
                {formatUsd(summary?.totalUsdValue)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Across {summary?.walletCount || 0} active wallets
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deposit Total</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <div className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {formatUsd(summary?.depositTotal)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Inbound user deposits globally
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reward Total</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <div className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {formatUsd(summary?.rewardTotal)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Outbound rewards by region
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle>Wallets</CardTitle>
              <CardDescription>Monitored deposit and reward wallets</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingWallets ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {wallets?.map(wallet => (
                    <div key={wallet.address} className="p-4 hover:bg-secondary/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full mt-0.5 ${wallet.group === 'deposit' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'}`}>
                          <WalletIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <Link href={`/wallet/${wallet.address}`} className="font-semibold text-foreground hover:text-primary transition-colors flex items-center">
                            {wallet.label}
                            <ArrowUpRight className="h-3 w-3 ml-1 opacity-50" />
                          </Link>
                          <div className="flex items-center mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground uppercase font-semibold tracking-wider mr-2">
                              {wallet.group}
                            </span>
                            <AddressLink address={wallet.address} showCopy={true} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                        <div className="text-lg font-mono font-bold text-foreground">
                          {formatUsd(wallet.totalUsdValue)}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {wallet.lastUpdated ? timeAgo(wallet.lastUpdated) : 'Never'}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {wallets?.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No wallets configured.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle>Token Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               {loadingSummary ? (
                 <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                 </div>
               ) : (
                 <div className="divide-y divide-border">
                   {summary?.tokenBreakdown?.map(token => (
                     <div key={token.symbol} className="p-4 flex items-center justify-between">
                       <div className="flex items-center space-x-3">
                         <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                           {token.symbol.substring(0, 2)}
                         </div>
                         <div className="font-medium">{token.symbol}</div>
                       </div>
                       <div className="text-right">
                         <div className="font-mono font-medium">{formatUsd(token.totalUsdValue)}</div>
                         <div className="text-xs text-muted-foreground font-mono">
                           {formatTokenAmount(token.totalBalance)} {token.symbol}
                         </div>
                       </div>
                     </div>
                   ))}
                   {(!summary?.tokenBreakdown || summary.tokenBreakdown.length === 0) && (
                     <div className="p-8 text-center text-muted-foreground">No token data available.</div>
                   )}
                 </div>
               )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-4 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Balance anomalies</CardDescription>
              </div>
              <Link href="/alerts" className="text-sm font-medium text-primary hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAlerts ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentAlerts.map(alert => (
                    <div key={alert.id} className={`p-4 ${!alert.isRead ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          {alert.changeType === 'increase' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500 mt-0.5" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-destructive mt-0.5" />
                          )}
                          <div>
                            <div className="text-sm font-medium">
                              {alert.changeType === 'increase' ? 'Large Deposit' : 'Large Withdrawal'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {alert.walletLabel}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-mono font-bold ${alert.changeType === 'increase' ? 'text-green-500' : 'text-destructive'}`}>
                            {alert.changeType === 'increase' ? '+' : '-'}{alert.changePercent ? formatPercent(alert.changePercent) : ''}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {timeAgo(alert.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {recentAlerts.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                      <Bell className="h-8 w-8 mb-2 opacity-20" />
                      <p>No recent alerts</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500"></div>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
              <h3 className="font-bold mb-1">System Health</h3>
              <p className="text-sm text-muted-foreground">All Celo RPC nodes and indexers are fully operational.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
