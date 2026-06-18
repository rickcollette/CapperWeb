import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { useNetworks, useCreateNetwork, useNetwork, useDeleteNetwork, usePeerNetworks } from "@/api/resources";
import { useInstances } from "@/api/instances";
import { Button, Card, ConfirmDialog, PageHeader, StatusBadge } from "@/components/common/ui";

const MODES = [
  { value: "nat", label: "NAT", description: "Outbound internet via host masquerade" },
  { value: "isolated", label: "Isolated", description: "No external access; instances only" },
  { value: "host-exposed", label: "Host-Exposed", description: "Routes reachable from host" },
];

function StatusCell({ status, error }: { status: string; error?: string }) {
  if (status !== "error" || !error) {
    return <StatusBadge status={status} />;
  }
  return (
    <span className="group relative inline-flex items-center gap-1.5">
      <StatusBadge status={status} />
      <span className="cursor-help text-xs text-red-400 underline decoration-dotted">why?</span>
      <span className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 hidden w-72 rounded-lg border border-red-500/30 bg-slate-900 p-2.5 text-xs text-red-300 shadow-xl group-hover:block">
        {error}
      </span>
    </span>
  );
}

export function NetworkList() {
  const { data, isLoading } = useNetworks();
  const create = useCreateNetwork();
  const deleteNet = useDeleteNetwork();
  const [form, setForm] = useState({ name: "", subnet: "10.42.0.0/24", mode: "nat" });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      { name: form.name, subnet: form.subnet, mode: form.mode },
      { onSuccess: () => setForm({ name: "", subnet: "10.42.0.0/24", mode: "nat" }) }
    );
  }

  return (
    <div>
      <PageHeader title="Networks" description="Virtual networks for capsule instances." />

      <Card className="mb-6 max-w-xl">
        <h2 className="mb-3 text-sm font-medium text-muted">Create Network</h2>
        <form className="space-y-3" onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="my-network"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">CIDR</label>
              <input
                value={form.subnet}
                onChange={(e) => setForm({ ...form, subnet: e.target.value })}
                placeholder="10.42.0.0/24"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm({ ...form, mode: m.value })}
                  className={`rounded-lg border p-2 text-left transition ${
                    form.mode === m.value
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-card text-muted hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  <div className="text-xs font-medium">{m.label}</div>
                  <div className="mt-0.5 text-xs opacity-70">{m.description}</div>
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" variant="primary" disabled={create.isPending}>Create Network</Button>
          {create.isError && <p className="text-xs text-red-400">{String(create.error)}</p>}
        </form>
      </Card>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">CIDR</th>
                <th className="p-3">Gateway</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {!data?.length && (
                <tr><td colSpan={6} className="p-6 text-center text-muted">No networks yet.</td></tr>
              )}
              {data?.map((n) => (
                <tr key={n.id} className="border-b border-border/60 last:border-0 hover:bg-card/50">
                  <td className="p-3">
                    <Link to={`/networks/${n.name}`} className="font-medium text-primary hover:underline">{n.name}</Link>
                  </td>
                  <td className="p-3 font-mono text-xs">{n.subnet}</td>
                  <td className="p-3 font-mono text-xs">{n.gateway}</td>
                  <td className="p-3 capitalize">{n.mode}</td>
                  <td className="p-3"><StatusCell status={n.status} error={n.error} /></td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => setConfirmDelete(n.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Network"
        description="Remove this network and all its IPAM leases. Running instances will lose connectivity."
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmDelete) deleteNet.mutate(confirmDelete);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ── Network topology card ──────────────────────────────────────────────────

function TopologyCard({ network, leases }: { network: { name: string; subnet: string; gateway: string; bridge: string; mode: string }; leases: { ip: string; instanceId: string }[] }) {
  const modeColor: Record<string, string> = {
    nat: "text-green-400",
    isolated: "text-amber-400",
    "host-exposed": "text-blue-400",
  };
  const modeIcon: Record<string, string> = {
    nat: "⇅",
    isolated: "⊘",
    "host-exposed": "⊕",
  };

  return (
    <div className="rounded-xl border border-border bg-slate-900/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium">{network.name}</span>
        <span className={`text-xs font-medium ${modeColor[network.mode] ?? "text-muted"}`}>
          {modeIcon[network.mode]} {network.mode}
        </span>
      </div>

      {/* Subnet block */}
      <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-primary">{network.subnet}</span>
          <span className="text-xs text-muted">bridge: {network.bridge}</span>
        </div>
        <div className="mt-1 text-xs text-muted">gateway {network.gateway}</div>
      </div>

      {/* Connected instances */}
      {leases.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-muted">Connected instances</div>
          {leases.map((l) => (
            <div key={l.instanceId} className="flex items-center gap-2">
              <div className="h-px flex-1 border-t border-dashed border-border/60" />
              <span className="rounded border border-border bg-card px-2 py-0.5 font-mono text-xs">
                {l.ip}
              </span>
              <Link to={`/instances/${l.instanceId}`} className="text-xs text-primary hover:underline">
                {l.instanceId.slice(0, 8)}
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Internet egress indicator for NAT */}
      {network.mode === "nat" && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <div className="h-px flex-1 border-t border-dashed border-border/40" />
          <span className="rounded border border-green-500/20 bg-green-500/5 px-2 py-0.5 text-green-400">
            ↑ internet
          </span>
        </div>
      )}
    </div>
  );
}

export function NetworkDetail() {
  const { name = "" } = useParams();
  const { data, isLoading } = useNetwork(name);
  const { data: instances } = useInstances();
  const peerNetworks = usePeerNetworks?.() ?? { data: [] };
  const [showPeer, setShowPeer] = useState(false);

  const leases = Array.isArray(data?.leases) ? data.leases : [];
  const attached = (instances ?? []).filter((i) => i.networkId === data?.network.id || i.networkIp);

  if (isLoading) return <p className="text-muted">Loading...</p>;
  if (!data) return <p className="text-red-400">Network not found.</p>;

  const { network } = data;

  return (
    <div>
      <PageHeader
        title={network.name}
        description={network.subnet}
        actions={
          <div className="flex items-center gap-2">
            <StatusCell status={network.status} error={network.error} />
          </div>
        }
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Info card */}
        <Card>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted">Bridge</p>
              <p className="font-mono">{network.bridge}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Gateway</p>
              <p className="font-mono">{network.gateway}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Mode</p>
              <p className="capitalize">{network.mode}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Leases</p>
              <p>{leases.length}</p>
            </div>
            {network.error && (
              <div className="col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <span className="font-medium">Bridge error: </span>{network.error}
              </div>
            )}
          </div>
        </Card>

        {/* Visual topology */}
        <TopologyCard network={network} leases={leases} />
      </div>

      {/* Peering section */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Network Peering</h2>
          <Button size="sm" variant="primary" onClick={() => setShowPeer(!showPeer)}>
            {showPeer ? "Cancel" : "Add Peer"}
          </Button>
        </div>
        {showPeer && (
          <Card className="mb-3 max-w-md">
            <p className="mb-2 text-xs text-muted">
              Peering routes traffic between two networks via host routing rules (requires CAP_NET_ADMIN).
            </p>
            <div className="space-y-2">
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                size={3}
                defaultValue=""
              >
                <option value="" disabled>Select peer network…</option>
                {(peerNetworks.data ?? [])
                  .filter((n: { id: string }) => n.id !== network.id)
                  .map((n: { id: string; name: string; subnet: string }) => (
                    <option key={n.id} value={n.id}>{n.name} ({n.subnet})</option>
                  ))}
              </select>
              <Button size="sm" variant="primary">Establish Peer Route</Button>
            </div>
          </Card>
        )}
        <p className="text-sm text-muted">No peering rules configured.</p>
      </div>

      {/* Instances */}
      {attached.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-medium">Instances on Network</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card text-left text-muted">
                  <th className="p-3">Instance</th>
                  <th className="p-3">IP</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {attached.map((i) => (
                  <tr key={i.id} className="border-b border-border/60 last:border-0 hover:bg-card/50">
                    <td className="p-3">
                      <Link to={`/instances/${i.id}`} className="text-primary hover:underline">{i.name}</Link>
                    </td>
                    <td className="p-3 font-mono text-xs">{i.networkIp ?? "—"}</td>
                    <td className="p-3"><StatusBadge status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {leases.length > 0 && (
        <>
          <h2 className="mb-3 mt-6 text-lg font-medium">DHCP Leases</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card text-left text-muted">
                  <th className="p-3">Instance ID</th>
                  <th className="p-3">IP</th>
                  <th className="p-3">MAC</th>
                  <th className="p-3">Since</th>
                </tr>
              </thead>
              <tbody>
                {leases.map((l: { instanceId: string; ip: string; mac: string; createdAt: string }) => (
                  <tr key={l.instanceId} className="border-b border-border/60 last:border-0 hover:bg-card/50">
                    <td className="p-3 font-mono text-xs">{l.instanceId}</td>
                    <td className="p-3 font-mono text-xs">{l.ip}</td>
                    <td className="p-3 font-mono text-xs">{l.mac}</td>
                    <td className="p-3 text-xs text-muted">{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Link to="/networks" className="mt-6 inline-block text-sm text-primary hover:underline">← All Networks</Link>
    </div>
  );
}
