import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useInstances, useEvents, useDaemonStatus } from "@/api/instances";
import { useImages } from "@/api/images";
import { useNetworks, useVolumes } from "@/api/resources";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/common/ui";

const STATE_COLORS: Record<string, string> = {
  running: "#4ade80",
  stopped: "#94a3b8",
  failed: "#f87171",
  starting: "#fbbf24",
  stopping: "#fbbf24",
  created: "#22d3ee",
};

export function Dashboard() {
  const { data: instances } = useInstances();
  const { data: events } = useEvents(15);
  const { data: daemon } = useDaemonStatus();
  const { data: images } = useImages();
  const { data: networks } = useNetworks();
  const { data: volumes } = useVolumes();

  const counts = (instances ?? []).reduce(
    (acc, i) => {
      acc[i.status] = (acc[i.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const pieData = Object.entries(counts).map(([name, value]) => ({ name, value }));
  const activityData = (events ?? []).slice(0, 8).map((e, i) => ({
    name: `#${i + 1}`,
    action: e.action.split(".").pop() ?? e.action,
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="What is running, what is broken, and what needs attention."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card>
          <div className="text-sm text-muted">Running</div>
          <div className="mt-1 text-3xl font-semibold text-green-400">{counts.running ?? 0}</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">Stopped</div>
          <div className="mt-1 text-3xl font-semibold">{counts.stopped ?? 0}</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">Failed</div>
          <div className="mt-1 text-3xl font-semibold text-red-400">{counts.failed ?? 0}</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">Images</div>
          <div className="mt-1 text-3xl font-semibold">{images?.length ?? 0}</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">Networks</div>
          <div className="mt-1 text-3xl font-semibold">{networks?.length ?? 0}</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">Daemon</div>
          <div className="mt-1 text-lg font-medium capitalize">{daemon?.status ?? "offline"}</div>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-4 text-lg font-medium">Instance States</h2>
          {pieData.length === 0 ? (
            <EmptyState title="No instances" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATE_COLORS[entry.name] ?? "#64748b"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-medium">Recent Activity</h2>
          {activityData.length === 0 ? (
            <EmptyState title="No events yet" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="action" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-medium">Recent Instances</h2>
          {!instances?.length ? (
            <EmptyState title="No instances" description="Launch an instance to get started." />
          ) : (
            <div className="space-y-2">
              {instances.slice(0, 8).map((inst) => (
                <Link
                  key={inst.id}
                  to={`/instances/${inst.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 hover:bg-slate-800/40"
                >
                  <span className="font-medium">{inst.name}</span>
                  <StatusBadge status={inst.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-medium">Storage</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted">Volumes</span><div className="text-xl font-semibold">{volumes?.length ?? 0}</div></div>
            <div><span className="text-muted">Attached</span><div className="text-xl font-semibold">{volumes?.filter((v) => v.attachedInstanceId).length ?? 0}</div></div>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {(events ?? []).slice(0, 5).map((e) => (
              <li key={e.id} className="rounded-lg border border-border/60 px-3 py-2">
                <div className="font-mono text-xs text-muted">{e.timestamp}</div>
                <div>{e.principalId} · {e.action}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
