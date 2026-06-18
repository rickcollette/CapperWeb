import { Activity } from "lucide-react";
import { useMonitoring } from "@/api/resourcemon";
import { Card } from "@/components/common/ui";

const severityColor: Record<string, string> = {
  critical: "text-red-400",
  warning: "text-amber-400",
  error: "text-red-400",
  info: "text-muted",
};

// MonitoringPanel renders the latest metrics and recent events for a resource
// using its service-specific monitoring endpoint (capper-observe §6.6).
// `service` is the route prefix (e.g. "nodes", "instances"); `id` is the
// native resource id that metrics are tagged with.
export function MonitoringPanel({ service, id }: { service: string; id: string }) {
  const { data, isLoading, error } = useMonitoring(service, id);

  if (isLoading) return <p className="text-muted text-sm">Loading monitoring…</p>;
  if (error) return <p className="text-red-400 text-sm">Failed to load monitoring data.</p>;

  const metrics = data?.metrics ?? {};
  const metricNames = Object.keys(metrics).sort();
  const events = data?.events ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Live Metrics</h3>
        </div>
        {metricNames.length === 0 ? (
          <p className="text-sm text-muted">
            No metrics reported yet. The node agent pushes metrics on its heartbeat interval.
          </p>
        ) : (
          <dl className="space-y-2 text-sm">
            {metricNames.map((name) => (
              <div key={name} className="flex items-center justify-between">
                <dt className="text-muted font-mono text-xs">{name}</dt>
                <dd className="font-medium">
                  {metrics[name].value.toFixed(2)}
                  {metrics[name].unit ? ` ${metrics[name].unit}` : ""}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold">Recent Events</h3>
        {events.length === 0 ? (
          <p className="text-sm text-muted">No events recorded.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id} className="border-b border-border/60 pb-2 last:border-0">
                <div className="flex items-center justify-between">
                  <span className={severityColor[e.severity] ?? "text-muted"}>{e.eventType}</span>
                  <span className="text-xs text-muted">{new Date(e.createdAt).toLocaleString()}</span>
                </div>
                {e.message && <div className="text-xs text-muted">{e.message}</div>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
