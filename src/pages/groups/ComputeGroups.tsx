import { useState } from "react";
import { useGroups, useCreateGroup, useDeleteGroup, useScaleGroup, useGroupInstances } from "@/api/topology";
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, StatusBadge } from "@/components/common/ui";
import { ChevronDown, ChevronRight, Layers, Minus, Plus, Trash2 } from "lucide-react";

function InstancesPanel({ groupName }: { groupName: string }) {
  const { data: instances = [] } = useGroupInstances(groupName);
  if (!instances.length) return <p className="px-6 py-3 text-xs text-muted">No instances in this group.</p>;
  return (
    <div className="overflow-hidden border-t border-border" onClick={(e) => e.stopPropagation()}>
      <table className="w-full text-sm">
        <thead className="bg-slate-800/50">
          <tr>
            {["ID", "Status", "Node"].map((h) => (
              <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {instances.map((inst: any) => (
            <tr key={inst.id} className="hover:bg-slate-800/30">
              <td className="px-4 py-2 font-mono text-xs">{inst.id}</td>
              <td className="px-4 py-2"><StatusBadge status={inst.state || "unknown"} /></td>
              <td className="px-4 py-2 text-xs text-muted">{inst.node || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupRow({ group }: { group: any }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const deleteGroup = useDeleteGroup();
  const scale = useScaleGroup();
  const desired = group.desired ?? group.minSize ?? 1;

  return (
    <>
      <div
        className="cursor-pointer rounded-xl border border-border bg-card transition hover:border-primary/30"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {open ? <ChevronDown className="h-4 w-4 text-muted" /> : <ChevronRight className="h-4 w-4 text-muted" />}
            <Layers className="h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">{group.name}</p>
              <p className="text-xs text-muted">
                {group.capsuleType || group.image || "—"} · {group.desired ?? "?"} desired / {group.running ?? "?"} running
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-background">
              <button
                className="px-2 py-1 text-muted hover:text-slate-200 disabled:opacity-30"
                disabled={desired <= 0}
                onClick={() => scale.mutate({ name: group.name, desired: Math.max(0, desired - 1) })}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[2rem] text-center text-sm font-medium">{desired}</span>
              <button
                className="px-2 py-1 text-muted hover:text-slate-200"
                onClick={() => scale.mutate({ name: group.name, desired: desired + 1 })}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <StatusBadge status={group.status || "active"} />
            <button
              className="rounded p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
              onClick={() => setConfirm(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {open && <InstancesPanel groupName={group.name} />}
      </div>
      <ConfirmDialog
        open={confirm}
        title={`Delete group "${group.name}"?`}
        description="All instances in this group will be terminated."
        onConfirm={() => { deleteGroup.mutate(group.name); setConfirm(false); }}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}

export function ComputeGroups() {
  const { data: groups = [], isLoading } = useGroups();
  const create = useCreateGroup();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", capsuleType: "", desired: 1, minSize: 1, maxSize: 10 });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => { setForm({ name: "", capsuleType: "", desired: 1, minSize: 1, maxSize: 10 }); setShowCreate(false); } });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compute Groups"
        description="Managed groups of instances with autoscaling support."
        actions={<Button onClick={() => setShowCreate((s) => !s)}>Create Group</Button>}
      />

      {showCreate && (
        <Card className="p-4">
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Group name" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
            <input value={form.capsuleType} onChange={(e) => setForm((f) => ({ ...f, capsuleType: e.target.value }))}
              placeholder="Capsule type" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input type="number" min={0} value={form.desired} onChange={(e) => setForm((f) => ({ ...f, desired: +e.target.value }))}
              placeholder="Desired" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input type="number" min={0} value={form.minSize} onChange={(e) => setForm((f) => ({ ...f, minSize: +e.target.value }))}
              placeholder="Min" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <input type="number" min={1} value={form.maxSize} onChange={(e) => setForm((f) => ({ ...f, maxSize: +e.target.value }))}
                placeholder="Max" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <Button type="submit">Create</Button>
            </div>
            <div className="col-span-2 sm:col-span-5 flex justify-end">
              <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : groups.length === 0 ? (
        <EmptyState title="No Compute Groups" description="Create a group to manage scaled sets of instances." />
      ) : (
        <div className="space-y-3">
          {groups.map((g: any) => <GroupRow key={g.id || g.name} group={g} />)}
        </div>
      )}
    </div>
  );
}
