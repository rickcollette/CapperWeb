import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  useNodes,
  useApproveNode,
  useCordonNode,
  useUncordonNode,
} from "@/api/topology";
import {
  Button,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/common/ui";

export function NodeList() {
  const { data, isLoading, error } = useNodes();
  const approve = useApproveNode();
  const cordon = useCordonNode();
  const uncordon = useUncordonNode();

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const allRoles = useMemo(() => {
    if (!data) return [] as string[];
    const set = new Set<string>();
    data.forEach((n: any) => (n.roles ?? []).forEach((r: string) => set.add(r)));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((n: any) => {
      const roleOk = roleFilter === "all" || (n.roles ?? []).includes(roleFilter);
      const statusOk = statusFilter === "all" || n.status === statusFilter;
      return roleOk && statusOk;
    });
  }, [data, roleFilter, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Nodes"
        description="Physical and virtual nodes registered with the control plane."
        actions={
          <Link to="/nodes/new">
            <Button variant="primary">
              <Plus className="h-4 w-4" /> Register Node
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted">Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value="all">All</option>
            {allRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value="all">All</option>
            {["ready", "pending", "cordoned", "draining", "offline"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <p className="text-muted">Loading nodes…</p>}
      {error && <p className="text-red-400">Failed to load nodes.</p>}
      {!isLoading && !filtered.length && (
        <EmptyState title="No nodes" description="No nodes match the current filters." />
      )}
      {!isLoading && !!filtered.length && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Status</th>
                <th className="p-3">Roles</th>
                <th className="p-3">Region / Zone</th>
                <th className="p-3">CPU</th>
                <th className="p-3">Memory</th>
                <th className="p-3">GPUs</th>
                <th className="p-3">Last Heartbeat</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((node: any) => (
                <NodeRow
                  key={node.name ?? node.id}
                  node={node}
                  onApprove={() => approve.mutate(node.name ?? node.id)}
                  onCordon={() => cordon.mutate(node.name ?? node.id)}
                  onUncordon={() => uncordon.mutate(node.name ?? node.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NodeRow({
  node,
  onApprove,
  onCordon,
  onUncordon,
}: {
  node: any;
  onApprove: () => void;
  onCordon: () => void;
  onUncordon: () => void;
}) {
  const id = node.name ?? node.id;
  const roles: string[] = node.roles ?? [];
  const memory = node.memory ?? node.inventory?.memoryBytes;
  const cpu = node.cpu ?? node.inventory?.cpuCount;
  const gpus = node.gpuCount ?? node.inventory?.gpuCount ?? 0;
  const heartbeat = node.lastHeartbeat ?? node.lastSeenAt;

  return (
    <tr className="border-b border-border/60 hover:bg-slate-800/30">
      <td className="p-3">
        <Link to={`/nodes/${id}`} className="font-medium text-primary hover:underline">
          {id}
        </Link>
      </td>
      <td className="p-3">
        <StatusBadge status={node.status ?? "unknown"} />
      </td>
      <td className="p-3">
        <div className="flex flex-wrap gap-1">
          {roles.map((r) => (
            <span
              key={r}
              className="rounded-md border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-xs text-blue-400"
            >
              {r}
            </span>
          ))}
          {roles.length === 0 && <span className="text-muted">—</span>}
        </div>
      </td>
      <td className="p-3 text-xs text-muted">
        {[node.region, node.zone].filter(Boolean).join(" / ") || "—"}
      </td>
      <td className="p-3 text-xs">{cpu ?? "—"}</td>
      <td className="p-3 text-xs">
        {memory ? `${Math.round(memory / 1024 / 1024 / 1024)} GiB` : "—"}
      </td>
      <td className="p-3 text-xs">{gpus > 0 ? gpus : "—"}</td>
      <td className="p-3 text-xs text-muted">
        {heartbeat ? new Date(heartbeat).toLocaleString() : "—"}
      </td>
      <td className="p-3">
        <div className="flex gap-1">
          {node.status === "pending" && (
            <Button size="sm" variant="primary" onClick={onApprove}>
              Approve
            </Button>
          )}
          {node.status !== "cordoned" && node.status !== "pending" && (
            <Button size="sm" onClick={onCordon}>
              Cordon
            </Button>
          )}
          {node.status === "cordoned" && (
            <Button size="sm" variant="primary" onClick={onUncordon}>
              Uncordon
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
