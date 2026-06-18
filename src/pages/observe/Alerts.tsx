import { useState } from "react";
import { Check, X } from "lucide-react";
import { useAlerts, useAckAlert, useResolveAlert, type Alert } from "@/api/resourcemon";
import { Button, EmptyState, PageHeader } from "@/components/common/ui";
import { cn } from "@/lib/utils";

const severityStyles: Record<string, string> = {
  critical: "border-red-500/30 bg-red-500/15 text-red-400",
  warning: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  info: "border-blue-500/30 bg-blue-500/15 text-blue-400",
};

const STATUSES = ["", "open", "acknowledged", "resolved"];

export function Alerts() {
  const [status, setStatus] = useState("open");
  const { data = [], isLoading } = useAlerts(status);
  const ack = useAckAlert();
  const resolve = useResolveAlert();

  return (
    <div>
      <PageHeader title="Alerts" description="Resource monitor alerts and their lifecycle." />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm capitalize",
              status === s ? "bg-primary/15 text-primary" : "text-muted hover:bg-slate-800",
            )}
          >
            {s || "all"}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted">Loading alerts…</p>}
      {!isLoading && !data.length && (
        <EmptyState title="No alerts" description="No alerts match the selected status." />
      )}

      {!!data.length && (
        <div className="space-y-2">
          {data.map((a: Alert) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                      severityStyles[a.severity] ?? severityStyles.info,
                    )}
                  >
                    {a.severity}
                  </span>
                  <span className="font-medium">{a.title}</span>
                  <span className="text-xs text-muted capitalize">· {a.status}</span>
                </div>
                <div className="mt-0.5 truncate text-sm text-muted">
                  {a.resourceType}/{a.resourceId} — {a.message}
                </div>
              </div>
              {a.status !== "resolved" && (
                <div className="flex shrink-0 gap-2">
                  {a.status === "open" && (
                    <Button size="sm" disabled={ack.isPending} onClick={() => ack.mutate(a.id)}>
                      <Check className="h-3 w-3" /> Ack
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={resolve.isPending}
                    onClick={() => resolve.mutate(a.id)}
                  >
                    <X className="h-3 w-3" /> Resolve
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
