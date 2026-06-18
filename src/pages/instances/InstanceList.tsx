import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Plus, Play, Square, RotateCcw, Trash2, Terminal } from "lucide-react";
import { useInstances, useInstanceActions } from "@/api/instances";
import { Button, ConfirmDialog, PageHeader, Pagination, StatusBadge, usePagination } from "@/components/common/ui";
import { formatBytes, formatUptime } from "@/lib/utils";
import type { CapperInstance } from "@/types/capper";

export function InstanceList() {
  const { data, isLoading, error } = useInstances();
  const [filter, setFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<CapperInstance | null>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data;
    return data.filter((i) => i.status === filter);
  }, [data, filter]);

  const { page, setPage, total, paginated } = usePagination(filtered, 25);

  return (
    <div>
      <PageHeader
        title="Instances"
        description="Run, inspect, connect to, and manage Capper capsule instances."
        actions={
          <Link to="/instances/new">
            <Button variant="primary"><Plus className="h-4 w-4" /> Launch Instance</Button>
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "running", "stopped", "failed"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1 text-sm capitalize ${filter === f ? "bg-primary/15 text-primary" : "text-muted hover:bg-slate-800"}`}
          >
            {f}
          </button>
        ))}
      </div>
      {isLoading && <p className="text-muted">Loading instances...</p>}
      {error && <p className="text-red-400">Failed to load instances.</p>}
      {!isLoading && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">ID</th>
                <th className="p-3">State</th>
                <th className="p-3">Image</th>
                <th className="p-3">Type</th>
                <th className="p-3">Network</th>
                <th className="p-3">Memory</th>
                <th className="p-3">Uptime</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((inst) => (
                <InstanceRow
                  key={inst.id}
                  inst={inst}
                  onDelete={() => setDeleteTarget(inst)}
                  onConnect={() => navigate(`/instances/${inst.id}?tab=console`)}
                />
              ))}
            </tbody>
          </table>
          {!!filtered.length && <Pagination page={page} total={total} onChange={setPage} />}
        </div>
      )}
      {deleteTarget && (
        <DeleteConfirm
          inst={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function DeleteConfirm({ inst, onClose }: { inst: CapperInstance; onClose: () => void }) {
  const actions = useInstanceActions(inst.id);
  return (
    <ConfirmDialog
      open
      title="Delete instance?"
      description={`Permanently delete ${inst.name}?`}
      confirmLabel="Delete"
      onCancel={onClose}
      onConfirm={() => actions.remove.mutate(undefined, { onSuccess: onClose })}
    />
  );
}

function InstanceRow({
  inst,
  onDelete,
  onConnect,
}: {
  inst: CapperInstance;
  onDelete: () => void;
  onConnect: () => void;
}) {
  const actions = useInstanceActions(inst.id);
  return (
    <tr className="border-b border-border/60 hover:bg-slate-800/30">
      <td className="p-3">
        <Link to={`/instances/${inst.id}`} className="font-medium text-primary hover:underline">{inst.name}</Link>
      </td>
      <td className="p-3 font-mono text-xs text-muted">{inst.id.slice(0, 12)}…</td>
      <td className="p-3"><StatusBadge status={inst.status} /></td>
      <td className="p-3 font-mono text-xs">{inst.image}</td>
      <td className="p-3">{inst.capsuleType ?? "—"}</td>
      <td className="p-3">{inst.networkIp ?? "none"}</td>
      <td className="p-3">{inst.resources?.memoryBytes ? formatBytes(inst.resources.memoryBytes) : "—"}</td>
      <td className="p-3">{formatUptime(inst.startedAt)}</td>
      <td className="p-3">
        <div className="flex gap-1">
          <Button size="sm" disabled={inst.status === "running" || actions.start.isPending} title="Start" onClick={() => actions.start.mutate()}>
            {actions.start.isPending ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button size="sm" disabled={inst.status !== "running" || actions.stop.isPending} onClick={() => actions.stop.mutate()}>
            {actions.stop.isPending ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Square className="h-3 w-3" />}
          </Button>
          <Button size="sm" disabled={actions.restart.isPending} onClick={() => actions.restart.mutate()}>
            <RotateCcw className={`h-3 w-3 ${actions.restart.isPending ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" disabled={inst.status !== "running"} onClick={onConnect}><Terminal className="h-3 w-3" /></Button>
          <Button size="sm" variant="danger" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </td>
    </tr>
  );
}
