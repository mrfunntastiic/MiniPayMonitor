import { useGetAlerts, getGetAlertsQueryKey, useMarkAlertRead, getGetUnreadAlertCountQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AddressLink } from "@/components/address-link";
import { formatUsd, formatPercent, timeAgo } from "@/lib/format";
import { ArrowUpRight, ArrowDownRight, Bell, Check, BellRing } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";

export default function Alerts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [markingIds, setMarkingIds] = useState<Set<number>>(new Set());
  
  const { data: alerts, isLoading } = useGetAlerts({
    query: {
      queryKey: getGetAlertsQueryKey(),
      refetchInterval: 30000,
    }
  });

  const markReadMutation = useMarkAlertRead({
    mutation: {
      onSuccess: (data) => {
        // Optimistically update the cache
        queryClient.setQueryData(getGetAlertsQueryKey(), (old: any) => {
          if (!old) return old;
          return old.map((alert: any) => 
            alert.id === data.id ? { ...alert, isRead: true } : alert
          );
        });
        // Invalidate unread count
        queryClient.invalidateQueries({ queryKey: getGetUnreadAlertCountQueryKey() });
        
        toast({
          title: "Alert marked as read",
          duration: 2000,
        });
      },
      onSettled: (_, __, variables) => {
        setMarkingIds(prev => {
          const next = new Set(prev);
          next.delete(variables.id);
          return next;
        });
      }
    }
  });

  const handleMarkRead = (id: number) => {
    setMarkingIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    markReadMutation.mutate({ id });
  };

  const handleMarkAllRead = () => {
    if (!alerts) return;
    const unread = alerts.filter(a => !a.isRead);
    unread.forEach(a => handleMarkRead(a.id));
  };

  const unreadCount = alerts?.filter(a => !a.isRead).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
            <BellRing className="h-6 w-6 mr-2 text-primary" />
            System Alerts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Significant balance changes and anomalous activity
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllRead} variant="outline" className="border-border">
            <Check className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {alerts?.map(alert => (
                <div 
                  key={alert.id} 
                  className={`p-4 md:p-6 transition-colors ${!alert.isRead ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2.5 rounded-full mt-1 ${alert.changeType === 'increase' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                        {alert.changeType === 'increase' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-semibold">
                            {alert.changeType === 'increase' ? 'Significant Inflow' : 'Significant Outflow'}
                          </h3>
                          {!alert.isRead && (
                            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">New</span>
                          )}
                        </div>
                        
                        <div className="mt-1 text-sm">
                          <span className="font-medium text-foreground">{alert.walletLabel}</span> experienced a 
                          <span className={`font-mono font-bold mx-1 ${alert.changeType === 'increase' ? 'text-green-500' : 'text-destructive'}`}>
                            {alert.changePercent ? formatPercent(alert.changePercent) : ''}
                          </span>
                          change in {alert.token} balance.
                        </div>
                        
                        <div className="mt-2 flex items-center text-xs text-muted-foreground space-x-4 font-mono">
                          <div>
                            <span className="opacity-70">From: </span>
                            {formatUsd(parseFloat(alert.oldValue))}
                          </div>
                          <div>
                            <span className="opacity-70">To: </span>
                            <span className="font-medium text-foreground">{formatUsd(parseFloat(alert.newValue))}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2 pt-2 border-t border-border/50 flex items-center space-x-3 text-xs">
                          <AddressLink address={alert.walletAddress} />
                          <span className="text-muted-foreground">&bull;</span>
                          <span className="text-muted-foreground">{timeAgo(alert.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end">
                      {!alert.isRead && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleMarkRead(alert.id)}
                          disabled={markingIds.has(alert.id)}
                          className="text-muted-foreground hover:text-foreground"
                          data-testid={`btn-mark-read-${alert.id}`}
                        >
                          <Check className="h-4 w-4 mr-1.5" />
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!alerts || alerts.length === 0) && (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                  <div className="p-4 rounded-full bg-secondary/50 mb-4">
                    <Bell className="h-8 w-8 opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">No alerts yet</h3>
                  <p>When anomalous balance changes occur, they will appear here.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
