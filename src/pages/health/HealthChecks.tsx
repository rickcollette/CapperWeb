import { useHealthChecks } from "@/api/extras";
import { Card, PageHeader } from "@/components/common/ui";
import { cn } from "@/lib/utils";

function HealthBadge({ status }: { status: "healthy" | "unhealthy" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        status === "healthy"
          ? "border-green-500/30 bg-green-500/15 text-green-400"
          : "border-red-500/30 bg-red-500/15 text-red-400",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "healthy" ? "bg-green-400" : "bg-red-400",
        )}
      />
      {status}
    </span>
  );
}

export function HealthChecks() {
  const { data, isLoading, dataUpdatedAt } = useHealthChecks();

  const healthy = data?.filter((r) => r.status === "healthy").length ?? 0;
  const unhealthy = data?.filter((r) => r.status === "unhealthy").length ?? 0;
  const lastRefresh = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";

  return (
    <div>
      <PageHeader
        title="Health Checks"
        description={`Auto-refreshes every 10 seconds. Last refresh: ${lastRefresh}`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-xs text-muted">Total Instances</p>
          <p className="mt-1 text-2xl font-bold">{data?.length ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-green-400">Healthy</p>
          <p className="mt-1 text-2xl font-bold text-green-400">{healthy}</p>
        </Card>
        <Card>
          <p className="text-xs text-red-400">Unhealthy</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{unhealthy}</p>
        </Card>
      </div>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Instance</th>
                <th className="p-3">Status</th>
                <th className="p-3">Message</th>
                <th className="p-3">Checked At</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((r) => (
                <tr
                  key={r.instanceId}
                  className={cn(
                    "border-b border-border/60",
                    r.status === "unhealthy" && "bg-red-500/5",
                  )}
                >
                  <td className="p-3 font-mono text-xs">{r.instanceId}</td>
                  <td className="p-3">
                    <HealthBadge status={r.status} />
                  </td>
                  <td className="p-3 text-muted">{r.message || "—"}</td>
                  <td className="p-3 text-xs text-muted">
                    {new Date(r.checkedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
