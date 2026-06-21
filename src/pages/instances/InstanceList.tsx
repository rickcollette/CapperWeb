import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Plus, Play, Square, RotateCcw, Trash2, Terminal } from "lucide-react";
import { useInstances, useInstanceActions, useBulkInstanceActions, type BulkInstanceAction } from "@/api/instances";
import { Button, ConfirmDialog, PageHeader, Pagination, StatusBadge, usePagination } from "@/components/common/ui";
import { DeleteResourceModal } from "@/components/DeleteResourceModal";
import { DeletionProgressModal } from "@/components/DeletionProgressModal";
import { useDeletionFlow } from "@/hooks/useDeletionFlow";
import { formatBytes, formatUptime, imageDisplayName } from "@/lib/utils";
import type { CapperInstance } from "@/types/capper";

export function InstanceList() {
  const { data, isLoading, error, refetch } = useInstances();
  const bulk = useBulkInstanceActions();
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<BulkInstanceAction | null>(null);
  const navigate = useNavigate();
  const deletion = useDeletionFlow({
    onDeletionComplete: () => {
      refetch();
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data;
    return data.filter((i) => i.status === filter);
  }, [data, filter]);

  const { page, setPage, total, paginated } = usePagination(filtered, 25);
  const pageIds = paginated.map((i) => i.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const somePageSelected = pageIds.some((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function runBulk(action: BulkInstanceAction) {
    const ids = [...selected];
    bulk.mutate({ ids, action }, {
      onSuccess: () => {
        clearSelection();
        setBulkConfirm(null);
      },
    });
  }

  const selectedInstances = (data ?? []).filter((i) => selected.has(i.id));
  const canBulkStart = selectedInstances.some((i) => i.status !== "running");
  const canBulkStop = selectedInstances.some((i) => i.status === "running");

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
            onClick={() => { setFilter(f); setPage(0); }}
            className={`rounded-lg px-3 py-1 text-sm capitalize ${filter === f ? "bg-primary/15 text-primary" : "text-muted hover:bg-slate-800"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" disabled={!canBulkStart || bulk.isPending} onClick={() => runBulk("start")}>
            <Play className="h-3 w-3" /> Start
          </Button>
          <Button size="sm" disabled={!canBulkStop || bulk.isPending} onClick={() => runBulk("stop")}>
            <Square className="h-3 w-3" /> Stop
          </Button>
          <Button size="sm" disabled={bulk.isPending} onClick={() => runBulk("restart")}>
            <RotateCcw className={`h-3 w-3 ${bulk.isPending ? "animate-spin" : ""}`} /> Restart
          </Button>
          <Button size="sm" variant="danger" disabled={bulk.isPending} onClick={() => setBulkConfirm("delete")}>
            <Trash2 className="h-3 w-3" /> Delete
          </Button>
          <Button size="sm" onClick={clearSelection}>Clear</Button>
          {bulk.isError && <span className="text-xs text-red-400">{String(bulk.error)}</span>}
        </div>
      )}

      {isLoading && <p className="text-muted">Loading instances...</p>}
      {error && <p className="text-red-400">Failed to load instances.</p>}
      {!isLoading && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => { if (el) el.indeterminate = !allPageSelected && somePageSelected; }}
                    onChange={togglePage}
                    aria-label="Select all on page"
                    className="rounded border-border"
                  />
                </th>
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
                  selected={selected.has(inst.id)}
                  onToggle={() => toggleOne(inst.id)}
                  onDelete={() => deletion.startDeletion('instance', inst.id, inst.name)}
                  onConnect={() => navigate(`/instances/${inst.id}?tab=console`)}
                />
              ))}
            </tbody>
          </table>
          {!!filtered.length && <Pagination page={page} total={total} onChange={setPage} />}
        </div>
      )}
      {/* New deletion flow modals */}
      <DeleteResourceModal
        open={deletion.showConfirmModal}
        resourceType={deletion.state.resourceType}
        resourceId={deletion.state.resourceId}
        resourceName={deletion.state.resourceName}
        onClose={deletion.closeConfirmModal}
        onSuccess={(jobId) => {
          deletion.closeConfirmModal();
          deletion.onConfirmSuccess(jobId);
        }}
      />

      {deletion.state.jobId && (
        <DeletionProgressModal
          open={deletion.showProgressModal}
          jobId={deletion.state.jobId}
          resourceType={deletion.state.resourceType}
          resourceId={deletion.state.resourceId}
          onClose={deletion.closeModal}
          onComplete={(job) => {
            deletion.onDeletionComplete(job);
            if (job.status === 'completed') {
              setTimeout(() => deletion.closeModal(), 2000);
            }
          }}
        />
      )}

      {/* Old bulk delete confirmation - keep for bulk operations for now */}
      <ConfirmDialog
        open={bulkConfirm === "delete"}
        title={`Delete ${selected.size} instance${selected.size === 1 ? "" : "s"}?`}
        description="This permanently deletes the selected instances and their root filesystems."
        confirmLabel="Delete all"
        pending={bulk.isPending}
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => runBulk("delete")}
      />
    </div>
  );
}


function InstanceRow({
  inst,
  selected,
  onToggle,
  onDelete,
  onConnect,
}: {
  inst: CapperInstance;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onConnect: () => void;
}) {
  const actions = useInstanceActions(inst.id);
  return (
    <tr className={`border-b border-border/60 hover:bg-slate-800/30 ${selected ? "bg-primary/5" : ""}`}>
      <td className="p-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${inst.name}`}
          className="rounded border-border"
        />
      </td>
      <td className="p-3">
        <Link to={`/instances/${inst.id}`} className="font-medium text-primary hover:underline">{inst.name}</Link>
      </td>
      <td className="p-3 font-mono text-xs text-muted">{inst.id.slice(0, 12)}…</td>
      <td className="p-3"><StatusBadge status={inst.status} /></td>
      <td className="p-3 font-mono text-xs">{imageDisplayName(inst.image)}</td>
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
          <Button size="sm" variant="danger" onClick={onDelete} data-testid="instance-delete"><Trash2 className="h-3 w-3" /></Button>
        </div>
      </td>
    </tr>
  );
}
