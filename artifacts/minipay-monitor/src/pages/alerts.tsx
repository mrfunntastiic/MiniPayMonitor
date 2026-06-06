import { useGetAlerts, getGetAlertsQueryKey, useMarkAlertRead, getGetUnreadAlertCountQueryKey } from "@workspace/api-client-react";
import { AddressLink } from "@/components/address-link";
import { timeAgo } from "@/lib/format";
import { ArrowDownLeft, TrendingDown, Bell, Check, BellRing } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

function formatUsdValue(val: string) {
  const n = parseFloat(val);
  if (isNaN(n)) return "$0.00";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

type AlertItem = {
  id: number;
  walletAddress: string;
  walletLabel: string;
  token: string;
  changeType: string;
  oldValue: string;
  newValue: string;
  changePercent?: number | null;
  isRead: boolean;
  createdAt: string;
};

function AlertCard({
  alert,
  isMarking,
  onMarkRead,
}: {
  alert: AlertItem;
  isMarking: boolean;
  onMarkRead: (id: number) => void;
}) {
  const isIncrease = alert.changeType === "increase";

  const accentColor = isIncrease ? "#06b6d4" : "#ef4444";
  const bgColor = isIncrease ? "hsl(185 70% 50% / 0.08)" : "hsl(0 84% 60% / 0.08)";
  const borderColor = isIncrease ? "hsl(185 70% 50% / 0.25)" : "hsl(0 84% 60% / 0.25)";

  return (
    <div
      className="relative rounded-xl p-5 transition-all duration-200"
      style={{
        background: alert.isRead ? "hsl(230 25% 11%)" : bgColor,
        border: `1px solid ${alert.isRead ? "hsl(230 20% 18%)" : borderColor}`,
      }}
    >
      {/* left accent */}
      {!alert.isRead && (
        <div
          className="absolute top-0 left-0 bottom-0 w-[3px] rounded-l-xl"
          style={{ background: accentColor }}
        />
      )}

      <div className="flex items-start justify-between gap-4 pl-1">
        <div className="flex items-start gap-4">
          {/* icon */}
          <div
            className="mt-0.5 h-9 w-9 shrink-0 rounded-full flex items-center justify-center"
            style={{ background: accentColor + "22", border: `1px solid ${accentColor}44` }}
          >
            {isIncrease
              ? <ArrowDownLeft className="h-4 w-4" style={{ color: accentColor }} />
              : <TrendingDown className="h-4 w-4" style={{ color: accentColor }} />
            }
          </div>

          <div className="min-w-0">
            {/* title row */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">
                {isIncrease ? "Saldo Masuk > $1.000" : "Saldo Di Bawah $1.000"}
              </h3>
              {!alert.isRead && (
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ background: accentColor + "22", color: accentColor, border: `1px solid ${accentColor}44` }}
                >
                  Baru
                </span>
              )}
            </div>

            {/* description */}
            <p className="text-xs mt-1" style={{ color: "hsl(220 12% 55%)" }}>
              {isIncrease ? (
                <>
                  Transaksi masuk terdeteksi di{" "}
                  <span className="text-white font-medium">{alert.walletLabel}</span>
                  {" "}senilai{" "}
                  <span className="font-mono font-bold" style={{ color: accentColor }}>
                    {formatUsdValue(alert.newValue)}
                  </span>
                </>
              ) : (
                <>
                  Saldo{" "}
                  <span className="text-white font-medium">{alert.walletLabel}</span>
                  {" "}turun ke{" "}
                  <span className="font-mono font-bold" style={{ color: accentColor }}>
                    {formatUsdValue(alert.newValue)}
                  </span>
                  {" "}(batas: {formatUsdValue(alert.oldValue)})
                </>
              )}
            </p>

            {/* amount pills */}
            {isIncrease && (
              <div className="flex items-center gap-2 mt-2.5">
                <span
                  className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md"
                  style={{ background: accentColor + "15", color: accentColor }}
                >
                  + {formatUsdValue(alert.newValue)}
                </span>
                <span className="text-[11px]" style={{ color: "hsl(220 12% 40%)" }}>
                  {alert.token}
                </span>
              </div>
            )}

            {/* footer */}
            <div className="mt-3 flex items-center gap-2 text-[11px]" style={{ color: "hsl(220 12% 42%)" }}>
              <AddressLink address={alert.walletAddress} />
              <span>·</span>
              <span>{timeAgo(alert.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* mark read button */}
        {!alert.isRead && (
          <button
            onClick={() => onMarkRead(alert.id)}
            disabled={isMarking}
            className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            style={{
              color: "hsl(220 12% 50%)",
              background: "hsl(230 20% 16%)",
              border: "1px solid hsl(230 20% 22%)",
            }}
            data-testid={`btn-mark-read-${alert.id}`}
          >
            <Check className="h-3.5 w-3.5" />
            Tandai dibaca
          </button>
        )}
      </div>
    </div>
  );
}

export default function Alerts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [markingIds, setMarkingIds] = useState<Set<number>>(new Set());

  const { data: alerts, isLoading } = useGetAlerts({
    query: {
      queryKey: getGetAlertsQueryKey(),
      refetchInterval: 30000,
    },
  });

  const markReadMutation = useMarkAlertRead({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetAlertsQueryKey(), (old: AlertItem[] | undefined) => {
          if (!old) return old;
          return old.map((a) => (a.id === data.id ? { ...a, isRead: true } : a));
        });
        queryClient.invalidateQueries({ queryKey: getGetUnreadAlertCountQueryKey() });
        toast({ title: "Alert ditandai sudah dibaca", duration: 2000 });
      },
      onSettled: (_, __, variables) => {
        setMarkingIds((prev) => {
          const next = new Set(prev);
          next.delete(variables.id);
          return next;
        });
      },
    },
  });

  const handleMarkRead = (id: number) => {
    setMarkingIds((prev) => new Set(prev).add(id));
    markReadMutation.mutate({ id });
  };

  const handleMarkAllRead = () => {
    alerts?.filter((a) => !a.isRead).forEach((a) => handleMarkRead(a.id));
  };

  const unreadCount = alerts?.filter((a) => !a.isRead).length ?? 0;

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BellRing className="h-6 w-6" style={{ color: "hsl(180 80% 55%)" }} />
            Alerts
          </h1>
          <p className="text-xs mt-1.5" style={{ color: "hsl(220 12% 50%)" }}>
            Notifikasi saldo masuk &gt; $1.000 dan saldo di bawah $1.000
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg transition-colors"
            style={{
              color: "hsl(220 12% 60%)",
              background: "hsl(230 20% 16%)",
              border: "1px solid hsl(230 20% 22%)",
            }}
          >
            <Check className="h-3.5 w-3.5" />
            Tandai semua dibaca ({unreadCount})
          </button>
        )}
      </div>

      {/* alert rules info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: "hsl(185 70% 50% / 0.07)", border: "1px solid hsl(185 70% 50% / 0.2)" }}
        >
          <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "hsl(185 70% 50% / 0.15)" }}>
            <ArrowDownLeft className="h-4 w-4" style={{ color: "#06b6d4" }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Saldo Masuk Besar</p>
            <p className="text-[11px] mt-0.5" style={{ color: "hsl(220 12% 52%)" }}>
              Transaksi masuk &gt; <span className="font-mono font-bold" style={{ color: "#06b6d4" }}>$1.000</span>
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: "hsl(0 84% 60% / 0.07)", border: "1px solid hsl(0 84% 60% / 0.2)" }}
        >
          <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "hsl(0 84% 60% / 0.15)" }}>
            <TrendingDown className="h-4 w-4" style={{ color: "#ef4444" }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Saldo Rendah</p>
            <p className="text-[11px] mt-0.5" style={{ color: "hsl(220 12% 52%)" }}>
              Balance turun di bawah <span className="font-mono font-bold" style={{ color: "#ef4444" }}>$1.000</span>
            </p>
          </div>
        </div>
      </div>

      {/* list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl p-5" style={{ background: "hsl(230 25% 11%)", border: "1px solid hsl(230 20% 18%)" }}>
              <div className="flex gap-4">
                <Skeleton className="h-9 w-9 rounded-full" style={{ background: "hsl(230 20% 18%)" }} />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" style={{ background: "hsl(230 20% 18%)" }} />
                  <Skeleton className="h-3 w-64" style={{ background: "hsl(230 20% 18%)" }} />
                  <Skeleton className="h-3 w-32" style={{ background: "hsl(230 20% 18%)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              isMarking={markingIds.has(alert.id)}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl p-14 text-center flex flex-col items-center"
          style={{ background: "hsl(230 25% 11%)", border: "1px solid hsl(230 20% 18%)" }}
        >
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: "hsl(230 20% 16%)" }}
          >
            <Bell className="h-7 w-7" style={{ color: "hsl(220 12% 40%)" }} />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Belum ada alert</h3>
          <p className="text-sm" style={{ color: "hsl(220 12% 45%)" }}>
            Alert akan muncul di sini ketika kondisi terpenuhi.
          </p>
        </div>
      )}
    </div>
  );
}
