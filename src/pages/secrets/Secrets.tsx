import { useState } from "react";
import { Plus, Trash2, KeyRound } from "lucide-react";
import { useSecrets, useCreateSecret, useDeleteSecret, type SecretMeta } from "@/api/secrets";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";

export function Secrets() {
  const { data = [], isLoading } = useSecrets();
  const create = useCreateSecret();
  const del = useDeleteSecret();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", value: "", description: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form, {
      onSuccess: () => { setShowForm(false); setForm({ name: "", value: "", description: "" }); },
    });
  }

  return (
    <div>
      <PageHeader
        title="Secrets"
        description="Encrypted secret values. Values are write-only and never returned."
        actions={
          <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> New Secret
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
              <label className="mb-1 block text-sm text-muted">Value</label>
              <textarea
                required
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Description (optional)</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={create.isPending}>Create</Button>
              <Button type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading && <p className="text-muted">Loading secrets…</p>}
      {!isLoading && !data.length && (
        <EmptyState title="No secrets" description="Store an encrypted secret to reference from instances." />
      )}

      {!!data.length && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Description</th>
                <th className="p-3">Version</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((s: SecretMeta) => (
                <tr key={s.id || s.name} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3">
                    <div className="flex items-center gap-2 font-medium">
                      <KeyRound className="h-3.5 w-3.5 text-muted" /> {s.name}
                    </div>
                  </td>
                  <td className="p-3 text-muted">{s.description || "—"}</td>
                  <td className="p-3 text-muted">{s.version ?? "—"}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => del.mutate(s.name)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
