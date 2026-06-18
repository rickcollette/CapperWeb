import { useState } from "react";
import {
  useFirewalls,
  useCreateFirewall,
  useApplyFirewall,
  useFirewallRules,
  useCreateFirewallRule,
  useDeleteFirewallRule,
} from "@/api/extras";
import {
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
  StatusBadge,
} from "@/components/common/ui";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import type { Firewall } from "@/types/capper";

const PROTOCOLS = ["tcp", "udp", "icmp", "any"];

function RulePanel({ fw }: { fw: Firewall }) {
  const { data: rules } = useFirewallRules(fw.name);
  const addRule = useCreateFirewallRule(fw.name);
  const deleteRule = useDeleteFirewallRule(fw.name);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    direction: "inbound" as "inbound" | "outbound",
    protocol: "tcp",
    portRange: "",
    source: "",
    action: "allow" as "allow" | "deny",
    priority: 100,
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    addRule.mutate(form, {
      onSuccess: () => setForm({ direction: "inbound", protocol: "tcp", portRange: "", source: "", action: "allow", priority: 100 }),
    });
  }

  return (
    <div className="space-y-3 px-6 py-3" onClick={(e) => e.stopPropagation()}>
      {/* Rule list */}
      {!rules?.length ? (
        <p className="text-xs text-muted">No rules yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-card/50 text-left text-muted">
                <th className="px-3 py-2">Direction</th>
                <th className="px-3 py-2">Protocol</th>
                <th className="px-3 py-2">Port</th>
                <th className="px-3 py-2">Source/Dest</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-border/40">
                  <td className="px-3 py-2 capitalize">{r.direction}</td>
                  <td className="px-3 py-2 uppercase">{r.protocol}</td>
                  <td className="px-3 py-2 font-mono">{r.portRange || "—"}</td>
                  <td className="px-3 py-2 font-mono">{r.source || "—"}</td>
                  <td className="px-3 py-2">
                    <span className={r.action === "allow" ? "text-green-400" : "text-red-400"}>{r.action}</span>
                  </td>
                  <td className="px-3 py-2">{r.priority}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="text-muted hover:text-red-400"
                      onClick={() => setDeleteId(r.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add rule form */}
      <form className="flex flex-wrap items-end gap-2" onSubmit={handleAdd}>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Direction</label>
          <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as "inbound" | "outbound" })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Protocol</label>
          <select value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
            {PROTOCOLS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Port range</label>
          <input value={form.portRange} onChange={(e) => setForm({ ...form, portRange: e.target.value })} placeholder="80 or 8000-9000" className="w-28 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-mono" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Source / dest CIDR</label>
          <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="0.0.0.0/0" className="w-32 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-mono" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Action</label>
          <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value as "allow" | "deny" })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
            <option value="allow">Allow</option>
            <option value="deny">Deny</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Priority</label>
          <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-xs" />
        </div>
        <Button type="submit" size="sm" variant="primary" disabled={addRule.isPending}>
          Add Rule
        </Button>
      </form>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete firewall rule?"
        description="This rule will be removed from the firewall."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { if (deleteId) deleteRule.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function FirewallRow({ fw }: { fw: Firewall }) {
  const apply = useApplyFirewall();
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border/60 hover:bg-card/50"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="p-3">
          <span className="mr-2 inline-block text-muted">
            {open ? <ChevronDown className="inline h-3.5 w-3.5" /> : <ChevronRight className="inline h-3.5 w-3.5" />}
          </span>
          <span className="font-medium">{fw.name}</span>
        </td>
        <td className="p-3 text-muted">{fw.network || "—"}</td>
        <td className="p-3">{fw.rulesCount}</td>
        <td className="p-3"><StatusBadge status={fw.status} /></td>
        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
          <Button variant="primary" size="sm" disabled={apply.isPending} onClick={() => apply.mutate(fw.name)}>
            Apply
          </Button>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-border/60 bg-card/20">
          <td colSpan={5}>
            <RulePanel fw={fw} />
          </td>
        </tr>
      )}
    </>
  );
}

export function Firewalls() {
  const { data, isLoading } = useFirewalls();
  const create = useCreateFirewall();
  const [form, setForm] = useState({ name: "", network: "" });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => setForm({ name: "", network: "" }) });
  }

  return (
    <div>
      <PageHeader
        title="Firewalls"
        description="Network-level firewall rules for your capsule environments."
      />

      <Card className="mb-6 max-w-lg">
        <p className="mb-3 text-sm font-medium">Create Firewall</p>
        <form className="flex flex-wrap gap-2" onSubmit={handleCreate}>
          <input
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Firewall name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Network"
            value={form.network}
            onChange={(e) => setForm({ ...form, network: e.target.value })}
          />
          <Button type="submit" variant="primary" disabled={create.isPending}>
            Create Firewall
          </Button>
        </form>
        {create.isError && (
          <p className="mt-2 text-xs text-red-400">{String(create.error)}</p>
        )}
      </Card>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Network</th>
                <th className="p-3">Rules</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {!data?.length ? (
                <tr><td colSpan={5} className="p-6 text-center text-sm text-muted">No firewalls — create one above.</td></tr>
              ) : (
                data.map((fw) => <FirewallRow key={fw.id} fw={fw} />)
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
