import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  useIPExclusions,
  useAddIPExclusion,
  useRemoveIPExclusion,
  useIPPools,
} from "@/api/ipam";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";

// IpExclusions manages admin-unlisted routable addresses. An excluded address is
// never auto-allocated to the app stack — e.g. an address already in use by the
// Capper Server Host inside a small routable subnet.
export function IpExclusions() {
  const { data: exclusions = [], isLoading } = useIPExclusions();
  const { data: pools = [] } = useIPPools();
  const add = useAddIPExclusion();
  const remove = useRemoveIPExclusion();

  const [form, setForm] = useState({ address: "", poolId: "", reason: "" });
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    add.mutate(
      { address: form.address, poolId: form.poolId || undefined, reason: form.reason || undefined },
      {
        onSuccess: () => setForm({ address: "", poolId: "", reason: "" }),
        onError: (e: unknown) => setErr(e instanceof Error ? e.message : "failed to exclude"),
      },
    );
  }

  return (
    <div>
      <PageHeader
        title="IP Exclusions"
        description="Unlist routable addresses so the app stack never auto-allocates them (e.g. the Capper Server Host address in a /29)."
      />

      <Card className="mb-6">
        <h3 className="mb-3 text-sm font-medium">Exclude an address</h3>
        <form className="flex flex-wrap items-end gap-2" onSubmit={submit}>
          <input
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="203.0.113.2"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <select
            value={form.poolId}
            onChange={(e) => setForm((f) => ({ ...f, poolId: e.target.value }))}
            className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
          >
            <option value="">Global (all pools)</option>
            {pools.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.cidr})</option>
            ))}
          </select>
          <input
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="Reason (e.g. Capper Server Host)"
            className="min-w-[16rem] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <Button type="submit" variant="primary" disabled={add.isPending}>
            <Plus className="h-3.5 w-3.5" /> Exclude
          </Button>
          {err && <span className="text-xs text-red-400">{err}</span>}
        </form>
      </Card>

      {isLoading ? (
        <EmptyState title="Loading…" />
      ) : !exclusions.length ? (
        <EmptyState title="No exclusions" description="Every materialized address is eligible for auto-allocation." />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="p-3">Address</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Added by</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exclusions.map((e) => {
                  const pool = pools.find((p) => p.id === e.poolId);
                  return (
                    <tr key={e.id} className="border-b border-border/60">
                      <td className="p-3 font-mono">{e.address}</td>
                      <td className="p-3 text-xs">{pool ? `${pool.name} (${pool.cidr})` : "Global"}</td>
                      <td className="p-3">{e.reason || "—"}</td>
                      <td className="p-3 text-xs text-muted">{e.createdBy || "—"}</td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(e.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Re-list
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
