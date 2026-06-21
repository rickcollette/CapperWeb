import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  useHostDisks,
  useStoragePools,
  useCreateStoragePool,
  useDeleteStoragePool,
  usePoolAllocations,
  useReleaseAllocation,
  useStorageSettings,
  useSetStorageSettings,
  type StoragePool,
} from "@/api/admin";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";
import { formatBytes } from "@/lib/utils";

function DefaultInstancePool({ pools }: { pools: StoragePool[] }) {
  const { data: settings } = useStorageSettings();
  const save = useSetStorageSettings();
  const current = settings?.defaultInstancePool ?? "";
  return (
    <Card className="mb-6">
      <h3 className="mb-1 text-sm font-medium">Default instance disk pool</h3>
      <p className="mb-3 text-xs text-muted">
        When set, new instance disks are drawn from this pool (accounted against real host capacity). Unset uses the control-plane store path.
      </p>
      <select
        value={current}
        onChange={(e) => save.mutate({ defaultInstancePool: e.target.value })}
        className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
      >
        <option value="">None (store path)</option>
        {pools.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.backend})</option>)}
      </select>
    </Card>
  );
}

const diskStateStyle: Record<string, string> = {
  unallocated: "bg-green-500/15 text-green-400",
  "pool-member": "bg-blue-500/15 text-blue-400",
  "in-use-by-host": "bg-slate-500/15 text-slate-400",
};

function DiskInventory() {
  const { data: disks = [], isLoading, error } = useHostDisks();
  if (error) {
    return <EmptyState title="Disk discovery unavailable" description="lsblk could not be run on this host." />;
  }
  return (
    <Card className="mb-8 p-0">
      <div className="border-b border-border p-3 text-sm font-medium">Physical disks</div>
      {isLoading ? (
        <div className="p-4 text-sm text-muted">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="p-3">Device</th>
                <th className="p-3">Size</th>
                <th className="p-3">Type</th>
                <th className="p-3">State</th>
                <th className="p-3">Mount</th>
                <th className="p-3">Model</th>
              </tr>
            </thead>
            <tbody>
              {disks.map((d) => (
                <tr key={d.path} className="border-b border-border/60">
                  <td className="p-3 font-mono">{d.path}</td>
                  <td className="p-3">{formatBytes(d.sizeBytes)}</td>
                  <td className="p-3">{d.rotational ? "HDD" : "SSD"}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${diskStateStyle[d.state] ?? ""}`}>{d.state}</span>
                  </td>
                  <td className="p-3 text-xs text-muted">{d.mountpoint || "—"}</td>
                  <td className="p-3 text-xs text-muted">{d.model || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function PoolAllocations({ pool }: { pool: StoragePool }) {
  const { data: allocs = [] } = usePoolAllocations(pool.id);
  const release = useReleaseAllocation();
  if (!allocs.length) return <div className="px-3 pb-3 text-xs text-muted">No allocations.</div>;
  return (
    <div className="px-3 pb-3">
      <table className="w-full text-xs">
        <tbody>
          {allocs.map((a) => (
            <tr key={a.id} className="border-t border-border/40">
              <td className="py-1.5">{a.name}</td>
              <td className="py-1.5 text-muted">{a.owner || "—"}</td>
              <td className="py-1.5">{formatBytes(a.sizeBytes)}</td>
              <td className="py-1.5 text-right">
                <Button size="sm" variant="danger" disabled={release.isPending} onClick={() => release.mutate(a.id)}>
                  Release
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// HostStorage manages the host's physical disks as capacity pools. Pools are
// registered over an already-mounted path — Capper never formats a disk.
export function HostStorage() {
  const { data: pools = [], isLoading } = useStoragePools();
  const create = useCreateStoragePool();
  const del = useDeleteStoragePool();
  const [form, setForm] = useState({ name: "", backend: "directory", mountpoint: "", device: "", vgName: "" });
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const body = form.backend === "lvm"
      ? { name: form.name, backend: "lvm", vgName: form.vgName }
      : { name: form.name, backend: "directory", mountpoint: form.mountpoint, device: form.device || undefined };
    create.mutate(body, {
      onSuccess: () => setForm({ name: "", backend: form.backend, mountpoint: "", device: "", vgName: "" }),
      onError: (e: unknown) => setErr(e instanceof Error ? e.message : "failed to create pool"),
    });
  }

  return (
    <div>
      <PageHeader
        title="Storage"
        description="Manage the host's physical disks as allocatable capacity pools. Pools draw from an already-mounted path; Capper never formats or partitions a disk."
      />

      <DiskInventory />

      <DefaultInstancePool pools={pools} />

      <Card className="mb-6">
        <h3 className="mb-3 text-sm font-medium">Register a pool</h3>
        <form className="flex flex-wrap items-end gap-2" onSubmit={submit}>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Pool name" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
          <select value={form.backend} onChange={(e) => setForm((f) => ({ ...f, backend: e.target.value }))}
            className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
            <option value="directory">directory</option>
            <option value="lvm">lvm</option>
          </select>
          {form.backend === "lvm" ? (
            <input value={form.vgName} onChange={(e) => setForm((f) => ({ ...f, vgName: e.target.value }))}
              placeholder="volume group (e.g. capvg)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
          ) : (
            <>
              <input value={form.mountpoint} onChange={(e) => setForm((f) => ({ ...f, mountpoint: e.target.value }))}
                placeholder="/mnt/data" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
              <input value={form.device} onChange={(e) => setForm((f) => ({ ...f, device: e.target.value }))}
                placeholder="/dev/sdb (optional)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </>
          )}
          <Button type="submit" variant="primary" disabled={create.isPending}><Plus className="h-3.5 w-3.5" /> Register</Button>
          {err && <span className="text-xs text-red-400">{err}</span>}
        </form>
      </Card>

      {isLoading ? (
        <EmptyState title="Loading…" />
      ) : !pools.length ? (
        <EmptyState title="No storage pools" description="Register a pool over a mounted disk to allocate capacity from it." />
      ) : (
        <div className="space-y-3">
          {pools.map((p) => {
            const pct = p.totalBytes > 0 ? Math.min(100, Math.round((p.allocatedBytes / p.totalBytes) * 100)) : 0;
            return (
              <Card key={p.id} className="p-0">
                <div className="flex items-center justify-between p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      <span className="rounded bg-slate-500/15 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">{p.backend}</span>
                      {p.health === "degraded" && (
                        <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] uppercase text-red-400">degraded</span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-muted">
                      {p.backend === "lvm" ? `vg:${p.vgName}` : `${p.mountpoint}${p.device ? ` · ${p.device}` : ""}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-48">
                      <div className="text-xs text-muted">
                        {formatBytes(p.allocatedBytes)} / {formatBytes(p.totalBytes)} ({formatBytes(p.availableBytes)} free)
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-700/50">
                        <div className={`h-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <Button size="sm" onClick={() => setExpanded((x) => (x === p.id ? null : p.id))}>
                      {expanded === p.id ? "Hide" : "Allocations"}
                    </Button>
                    <Button size="sm" variant="danger" disabled={del.isPending} onClick={() => del.mutate(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {expanded === p.id && <PoolAllocations pool={p} />}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
