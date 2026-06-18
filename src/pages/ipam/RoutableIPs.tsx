import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  useIPPools,
  useIPs,
  useCreateIPPool,
  useDeleteIPPool,
  useReserveIP,
  useReleaseIP,
  type IPPool,
  type RoutableIP,
} from "@/api/ipam";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  available: "border-slate-500/30 bg-slate-500/15 text-slate-400",
  reserved: "border-blue-500/30 bg-blue-500/15 text-blue-400",
  attached: "border-green-500/30 bg-green-500/15 text-green-400",
  allocated: "border-amber-500/30 bg-amber-500/15 text-amber-400",
};

export function RoutableIPs() {
  const { data: pools = [] } = useIPPools();
  const { data: ips = [] } = useIPs();
  const createPool = useCreateIPPool();
  const deletePool = useDeleteIPPool();
  const reserve = useReserveIP();
  const release = useReleaseIP();

  const [showPool, setShowPool] = useState(false);
  const [poolForm, setPoolForm] = useState({ name: "", cidr: "", gateway: "", usage: "load-balancer,reserved" });
  const [reserveForm, setReserveForm] = useState({ pool: "", name: "", purpose: "load-balancer" });

  function submitPool(e: React.FormEvent) {
    e.preventDefault();
    createPool.mutate(
      {
        name: poolForm.name,
        cidr: poolForm.cidr,
        gateway: poolForm.gateway || undefined,
        usage: poolForm.usage.split(",").map((u) => u.trim()).filter(Boolean),
        allowAutoAllocate: true,
      },
      { onSuccess: () => { setShowPool(false); setPoolForm({ name: "", cidr: "", gateway: "", usage: "load-balancer,reserved" }); } },
    );
  }

  function submitReserve(e: React.FormEvent) {
    e.preventDefault();
    if (!reserveForm.pool || !reserveForm.name) return;
    reserve.mutate(reserveForm, { onSuccess: () => setReserveForm({ ...reserveForm, name: "" }) });
  }

  return (
    <div>
      <PageHeader
        title="Routable IPs"
        description="Public IP pools and reserved Elastic IPs."
        actions={
          <Button variant="primary" onClick={() => setShowPool((v) => !v)}>
            <Plus className="h-4 w-4" /> New Pool
          </Button>
        }
      />

      {showPool && (
        <Card className="mb-4 max-w-lg">
          <form className="space-y-3" onSubmit={submitPool}>
            <h3 className="font-semibold">Create IP Pool</h3>
            {[
              { k: "name", label: "Name", ph: "public-main" },
              { k: "cidr", label: "CIDR", ph: "203.0.113.0/28" },
              { k: "gateway", label: "Gateway (excluded)", ph: "203.0.113.1" },
              { k: "usage", label: "Usage (comma-separated)", ph: "load-balancer,reserved" },
            ].map((f) => (
              <div key={f.k}>
                <label className="mb-1 block text-sm text-muted">{f.label}</label>
                <input
                  required={f.k === "name" || f.k === "cidr"}
                  value={(poolForm as Record<string, string>)[f.k]}
                  onChange={(e) => setPoolForm({ ...poolForm, [f.k]: e.target.value })}
                  placeholder={f.ph}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={createPool.isPending}>Create</Button>
              <Button type="button" onClick={() => setShowPool(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Pools */}
      <h3 className="mb-2 mt-2 text-sm font-semibold text-muted">Pools</h3>
      {!pools.length ? (
        <EmptyState title="No IP pools" description="Create a pool to allocate routable addresses." />
      ) : (
        <div className="mb-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">CIDR</th>
                <th className="p-3">Usage</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {pools.map((p: IPPool) => (
                <tr key={p.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 font-mono text-xs">{p.cidr}</td>
                  <td className="p-3 text-muted text-xs">{(p.usage || []).join(", ")}</td>
                  <td className="p-3 capitalize">{p.status}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => deletePool.mutate(p.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reserve form */}
      {pools.length > 0 && (
        <Card className="mb-6 max-w-xl">
          <form className="flex flex-wrap items-end gap-2" onSubmit={submitReserve}>
            <div>
              <label className="mb-1 block text-xs text-muted">Pool</label>
              <select
                value={reserveForm.pool}
                onChange={(e) => setReserveForm({ ...reserveForm, pool: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">— select —</option>
                {pools.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Name</label>
              <input
                value={reserveForm.name}
                onChange={(e) => setReserveForm({ ...reserveForm, name: e.target.value })}
                placeholder="api-prod-ip"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Purpose</label>
              <input
                value={reserveForm.purpose}
                onChange={(e) => setReserveForm({ ...reserveForm, purpose: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit" variant="primary" disabled={reserve.isPending}>Reserve</Button>
          </form>
        </Card>
      )}

      {/* Addresses */}
      <h3 className="mb-2 text-sm font-semibold text-muted">Addresses</h3>
      {!ips.length ? (
        <EmptyState title="No addresses" description="Create a pool to materialize addresses." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Address</th>
                <th className="p-3">Status</th>
                <th className="p-3">Name</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Target</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {ips.map((ip: RoutableIP) => (
                <tr key={ip.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 font-mono text-xs">{ip.address}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                        statusStyles[ip.status] ?? statusStyles.available,
                      )}
                    >
                      {ip.status}
                    </span>
                  </td>
                  <td className="p-3">{ip.name || "—"}</td>
                  <td className="p-3 text-muted">{ip.purpose || "—"}</td>
                  <td className="p-3 font-mono text-xs text-muted">{ip.targetId || "—"}</td>
                  <td className="p-3 text-right">
                    {ip.status !== "available" && (
                      <Button size="sm" onClick={() => release.mutate(ip.id)}>Release</Button>
                    )}
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
