import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useResources, useSyncResources, type Resource } from "@/api/resourcemon";
import { Button, EmptyState, PageHeader } from "@/components/common/ui";
import { cn } from "@/lib/utils";

const healthStyles: Record<string, string> = {
  healthy: "border-green-500/30 bg-green-500/15 text-green-400",
  degraded: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  unhealthy: "border-red-500/30 bg-red-500/15 text-red-400",
  unknown: "border-slate-500/30 bg-slate-500/15 text-slate-400",
};

const TYPES = ["", "instance", "network", "node", "load-balancer"];

export function Resources() {
  const [type, setType] = useState("");
  const { data = [], isLoading, error } = useResources(type ? { type } : {});
  const sync = useSyncResources();

  return (
    <div>
      <PageHeader
        title="Resources"
        description="Unified inventory across every Capper service (capper-observe)."
        actions={
          <Button variant="primary" disabled={sync.isPending} onClick={() => sync.mutate()}>
            <RefreshCw className={cn("h-4 w-4", sync.isPending && "animate-spin")} /> Sync Now
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t || "all"}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm capitalize",
              type === t ? "bg-primary/15 text-primary" : "text-muted hover:bg-slate-800",
            )}
          >
            {t || "all"}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted">Loading inventory…</p>}
      {error && <p className="text-red-400">Failed to load resources.</p>}
      {!isLoading && !data.length && (
        <EmptyState
          title="No resources"
          description="Run a sync to project live resources into the inventory."
        />
      )}

      {!!data.length && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Type</th>
                <th className="p-3">Name</th>
                <th className="p-3">Project</th>
                <th className="p-3">Status</th>
                <th className="p-3">Health</th>
                <th className="p-3">Node</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r: Resource) => (
                <tr key={r.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 capitalize text-muted">{r.resourceType}</td>
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 text-muted">{r.project || "—"}</td>
                  <td className="p-3 capitalize">{r.status}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                        healthStyles[r.health] ?? healthStyles.unknown,
                      )}
                    >
                      {r.health}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted">{r.nodeId || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
