import { useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import {
  useGovernancePolicies,
  useCreateGovernancePolicy,
  type GovernancePolicy,
} from "@/api/secrets";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";

export function Governance() {
  const { data = [], isLoading } = useGovernancePolicies();
  const create = useCreateGovernancePolicy();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", rule: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      { name: form.name, description: form.description, rule: form.rule, enabled: true },
      { onSuccess: () => { setShowForm(false); setForm({ name: "", description: "", rule: "" }); } },
    );
  }

  return (
    <div>
      <PageHeader
        title="Governance"
        description="Organization policy rules enforced across resources."
        actions={
          <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> New Policy
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-4 max-w-lg">
          <form className="space-y-3" onSubmit={submit}>
            <div>
              <label className="mb-1 block text-sm text-muted">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Rule</label>
              <textarea
                value={form.rule}
                onChange={(e) => setForm({ ...form, rule: e.target.value })}
                rows={3}
                placeholder="e.g. require image signature"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={create.isPending}>Create</Button>
              <Button type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading && <p className="text-muted">Loading policies…</p>}
      {!isLoading && !data.length && (
        <EmptyState title="No governance policies" description="Define a policy to enforce organizational rules." />
      )}

      {!!data.length && (
        <div className="space-y-2">
          {data.map((p: GovernancePolicy, i: number) => (
            <Card key={p.id || p.name || i}>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">{p.name}</div>
                  {p.description && <div className="text-sm text-muted">{p.description}</div>}
                  {p.rule && <div className="mt-1 font-mono text-xs text-muted">{p.rule}</div>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
