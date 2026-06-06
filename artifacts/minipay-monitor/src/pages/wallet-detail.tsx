import { useParams } from "wouter";
import { useGetWalletBalances, getGetWalletBalancesQueryKey, useGetTransactions, getGetTransactionsQueryKey, useGetWallets, getGetWalletsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AddressLink } from "@/components/address-link";
import { formatUsd, formatTokenAmount, timeAgo } from "@/lib/format";
import { ArrowUpRight, ArrowDownRight, Wallet as WalletIcon, RefreshCw, ExternalLink, ArrowRight, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function WalletDetail() {
  const params = useParams();
  const address = params.address || "";
  
  const { data: wallets } = useGetWallets({
    query: { queryKey: getGetWalletsQueryKey() }
  });
  
  const wallet = wallets?.find(w => w.address.toLowerCase() === address.toLowerCase());
  
  const { data: balances, isLoading: loadingBalances } = useGetWalletBalances(address, {
    query: {
      enabled: !!address,
      queryKey: getGetWalletBalancesQueryKey(address),
      refetchInterval: 30000,
    }
  });

  const { data: txData, isLoading: loadingTxs } = useGetTransactions(address, {
    query: {
      enabled: !!address,
      queryKey: getGetTransactionsQueryKey(address),
      refetchInterval: 30000,
    }
  });

  const transactions = txData?.transactions || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {wallet ? wallet.label : 'Wallet Detail'}
            </h1>
            {wallet && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground uppercase font-semibold tracking-wider">
                {wallet.group}
              </span>
            )}
          </div>
          <div className="mt-2">
            <AddressLink address={address} className="text-base" />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Balance</div>
            <div className="text-2xl font-mono font-bold text-primary">
              {wallet ? formatUsd(wallet.totalUsdValue) : <Skeleton className="h-8 w-24 inline-block" />}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle>Token Balances</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingBalances ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {balances?.map(token => (
                    <div key={token.contractAddress || token.symbol} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                            {token.symbol.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium">{token.name || token.symbol}</div>
                            <div className="text-xs text-muted-foreground">{token.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-medium">{formatUsd(token.usdValue)}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {formatTokenAmount(token.balance)} {token.symbol}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono flex items-center justify-between bg-background p-1.5 rounded">
                        <span>Contract:</span>
                        <AddressLink address={token.contractAddress} showCopy={true} />
                      </div>
                    </div>
                  ))}
                  
                  {(!balances || balances.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground">
                      No tokens found in this wallet.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-4 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Recent inbound and outbound activity</CardDescription>
              </div>
              <a 
                href={`https://celoscan.io/address/${address}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs flex items-center text-muted-foreground hover:text-primary transition-colors"
              >
                View on Celoscan <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </CardHeader>
            <CardContent className="p-0">
              {loadingTxs ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Hash</th>
                          <th className="px-4 py-3">Asset</th>
                          <th className="px-4 py-3 text-right">Value (USD)</th>
                          <th className="px-4 py-3 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {transactions.map(tx => (
                          <tr key={tx.hash} className="hover:bg-secondary/30 transition-colors group">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <div className={`p-1.5 rounded-full ${tx.type === 'in' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                                  {tx.type === 'in' ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                </div>
                                <span className="capitalize font-medium">{tx.type}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <AddressLink address={tx.hash} type="tx" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-mono text-xs">{formatTokenAmount(tx.value)} {tx.token}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-mono font-medium ${tx.type === 'in' ? 'text-green-500' : ''}`}>
                                {tx.type === 'in' ? '+' : '-'}{formatUsd(tx.usdValue)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                              {timeAgo(tx.timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {transactions.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No recent transactions found.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
