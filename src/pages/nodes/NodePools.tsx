import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  useNodePools,
  useCreateNodePool,
  useDeleteNodePool,
} from "@/api/topology";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/common/ui";

export function NodePools() {
  const { data, isLoading, error } = useNodePools();
  const create = useCreateNodePool();
  const del = useDeleteNodePool();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    roles: "",
    region: "",
    minNodes: 0,
    desiredNodes: 1,
    maxNodes: 10,
  });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      {
        name: form.name,
        roles: form.roles ? form.roles.split(",").map((r) => r.trim()) : [],
        region: form.region || undefined,
        minNodes: Number(form.minNodes),
        desiredNodes: Number(form.desiredNodes),
        maxNodes: Number(form.maxNodes),
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm({ name: "", roles: "", region: "", minNodes: 0, desiredNodes: 1, maxNodes: 10 });
        },
      },
    );
  }

  return (
    <div>
      <PageHeader
        title="Node Pools"
        description="Managed groups of nodes with shared configuration."
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Create Pool
          </Button>
        }
      />

      {isLoading && <p className="text-muted">Loading pools…</p>}
      {error && <p className="text-red-400">Failed to load pools.</p>}
      {!isLoading && !data?.length && (
        <EmptyState title="No node pools" description="Create a pool to manage groups of nodes." />
      )}
      {!isLoading && !!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Roles</th>
                <th className="p-3">Region</th>
                <th className="p-3">Min</th>
                <th className="p-3">Desired</th>
                <th className="p-3">Max</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((pool: any) => {
                const roles: string[] = pool.roles ?? [];
                return (
                  <tr key={pool.name ?? pool.id} className="border-b border-border/60 hover:bg-slate-800/30">
                    <td className="p-3 font-medium">{pool.name ?? pool.id}</td>
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
                    <td className="p-3 text-muted">{pool.region ?? "—"}</td>
                    <td className="p-3 text-xs">{pool.minNodes ?? "—"}</td>
                    <td className="p-3 text-xs">{pool.desiredNodes ?? "—"}</td>
                    <td className="p-3 text-xs">{pool.maxNodes ?? "—"}</td>
                    <td className="p-3">
                      <StatusBadge status={pool.status ?? "unknown"} />
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteTarget(pool)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Create Node Pool</h3>
            <form className="space-y-3" onSubmit={handleCreate}>
              <Field label="Name *">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Roles (comma-separated)">
                <input
                  value={form.roles}
                  onChange={(e) => setForm({ ...form, roles: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="worker, gpu"
                />
              </Field>
              <Field label="Region">
                <input
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Min">
                  <input
                    type="number"
                    min={0}
                    value={form.minNodes}
                    onChange={(e) => setForm({ ...form, minNodes: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Desired">
                  <input
                    type="number"
                    min={0}
                    value={form.desiredNodes}
                    onChange={(e) => setForm({ ...form, desiredNodes: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Max">
                  <input
                    type="number"
                    min={0}
                    value={form.maxNodes}
                    onChange={(e) => setForm({ ...form, maxNodes: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </Field>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={create.isPending}>
                  {create.isPending ? "Creating…" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete node pool?"
        description={`Delete pool "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) del.mutate(deleteTarget.name ?? deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted">{label}</label>
      {children}
    </div>
  );
}
