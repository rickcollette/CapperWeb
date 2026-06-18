import { useState } from "react";
import { Plus, Play, Trash2 } from "lucide-react";
import {
  useFunctions,
  useCreateFunction,
  useDeleteFunction,
  useInvokeFunction,
  type FunctionDef,
  type InvokeResult,
} from "@/api/serverless";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";

export function Functions() {
  const { data = [], isLoading } = useFunctions();
  const create = useCreateFunction();
  const del = useDeleteFunction();
  const invoke = useInvokeFunction();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", runtime: "native", command: "" });
  const [result, setResult] = useState<InvokeResult | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      {
        name: form.name,
        runtime: form.runtime,
        command: form.command ? form.command.split(" ").filter(Boolean) : undefined,
      },
      { onSuccess: () => { setShowForm(false); setForm({ name: "", runtime: "native", command: "" }); } },
    );
  }

  return (
    <div>
      <PageHeader
        title="Functions"
        description="Lambda-style serverless functions."
        actions={
          <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> New Function
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
              <label className="mb-1 block text-sm text-muted">Runtime</label>
              <input
                value={form.runtime}
                onChange={(e) => setForm({ ...form, runtime: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Command (space-separated)</label>
              <input
                value={form.command}
                onChange={(e) => setForm({ ...form, command: e.target.value })}
                placeholder="/bin/cat"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={create.isPending}>Create</Button>
              <Button type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {result && (
        <Card className="mb-4">
          <div className="mb-1 text-sm font-semibold">
            Invocation {result.status} ({result.durationMs} ms)
          </div>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs text-slate-300">
            {result.output || result.error || "(no output)"}
          </pre>
        </Card>
      )}

      {isLoading && <p className="text-muted">Loading functions…</p>}
      {!isLoading && !data.length && (
        <EmptyState title="No functions" description="Create a function to get started." />
      )}

      {!!data.length && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Runtime</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((fn: FunctionDef) => (
                <tr key={fn.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 font-medium">{fn.name}</td>
                  <td className="p-3 text-muted">{fn.runtime}</td>
                  <td className="p-3 capitalize">{fn.status}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={invoke.isPending}
                        onClick={() =>
                          invoke.mutate(
                            { id: fn.id, payload: "" },
                            { onSuccess: (r) => setResult(r) },
                          )
                        }
                      >
                        <Play className="h-3 w-3" /> Invoke
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => del.mutate(fn.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
