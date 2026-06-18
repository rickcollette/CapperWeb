import { useState } from "react";
import { useVPCs, useCreateVPC, useDeleteVPC, useVPCSubnets, useCreateVPCSubnet } from "@/api/topology";
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, StatusBadge } from "@/components/common/ui";
import { ChevronDown, ChevronRight, Network, Plus, Trash2 } from "lucide-react";

function SubnetPanel({ vpcSlug }: { vpcSlug: string }) {
  const { data: subnets = [] } = useVPCSubnets(vpcSlug);
  const create = useCreateVPCSubnet(vpcSlug);
  const [form, setForm] = useState({ name: "", cidr: "", zone: "" });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    create.mutate(form, { onSuccess: () => setForm({ name: "", cidr: "", zone: "" }) });
  }

  return (
    <div className="space-y-3 px-6 py-3" onClick={(e) => e.stopPropagation()}>
      {subnets.length === 0 ? (
        <p className="text-xs text-muted">No subnets yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                {["Name", "CIDR", "Zone"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subnets.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-2 font-mono text-xs">{s.name || s.id}</td>
                  <td className="px-4 py-2 font-mono text-xs text-primary">{s.cidr}</td>
                  <td className="px-4 py-2 text-xs text-muted">{s.zone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Subnet name" className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
        <input value={form.cidr} onChange={(e) => setForm((f) => ({ ...f, cidr: e.target.value }))}
          placeholder="CIDR (e.g. 10.0.1.0/24)" className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm" required />
        <input value={form.zone} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))}
          placeholder="Zone (optional)" className="w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
        <Button type="submit" size="sm"><Plus className="h-3 w-3" />Add Subnet</Button>
      </form>
    </div>
  );
}

function VPCRow({ vpc }: { vpc: any }) {
  const [open, setOpen] = useState(false);
  const deleteVPC = useDeleteVPC();
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <div
        className="cursor-pointer rounded-xl border border-border bg-card p-4 transition hover:border-primary/30"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {open ? <ChevronDown className="h-4 w-4 text-muted" /> : <ChevronRight className="h-4 w-4 text-muted" />}
            <Network className="h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">{vpc.name || vpc.slug}</p>
              <p className="text-xs text-muted font-mono">{vpc.cidr || vpc.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={vpc.status || "active"} />
            <button
              className="rounded p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
              onClick={(e) => { e.stopPropagation(); setConfirm(true); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {open && <SubnetPanel vpcSlug={vpc.slug} />}
      </div>
      <ConfirmDialog
        open={confirm}
        title={`Delete VPC "${vpc.name || vpc.slug}"?`}
        description="All subnets and routes in this VPC will be removed."
        onConfirm={() => { deleteVPC.mutate(vpc.slug); setConfirm(false); }}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}

export function VPCs() {
  const { data: vpcs = [], isLoading } = useVPCs();
  const create = useCreateVPC();
  const [form, setForm] = useState({ name: "", cidr: "" });
  const [showCreate, setShowCreate] = useState(false);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      { slug: form.name.toLowerCase().replace(/\s+/g, "-"), name: form.name, cidr: form.cidr, status: "active" },
      { onSuccess: () => { setForm({ name: "", cidr: "" }); setShowCreate(false); } },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="VPCs"
        description="Virtual private cloud networks for tenant isolation."
        actions={<Button onClick={() => setShowCreate((s) => !s)}>Create VPC</Button>}
      />

      {showCreate && (
        <Card className="p-4">
          <form onSubmit={handleCreate} className="flex items-center gap-3">
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="VPC name" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
            <input value={form.cidr} onChange={(e) => setForm((f) => ({ ...f, cidr: e.target.value }))}
              placeholder="CIDR (e.g. 10.0.0.0/16)" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <Button type="submit">Create</Button>
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
          </form>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : vpcs.length === 0 ? (
        <EmptyState title="No VPCs" description="Create a VPC to isolate your workloads." />
      ) : (
        <div className="space-y-3">
          {vpcs.map((vpc: any) => <VPCRow key={vpc.id || vpc.slug} vpc={vpc} />)}
        </div>
      )}
    </div>
  );
}
