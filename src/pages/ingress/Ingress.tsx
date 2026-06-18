import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, StatusBadge } from "@/components/common/ui";

interface IngressRule {
  id: string;
  name: string;
  host: string;
  path: string;
  backend: string;
  port: number;
  tls: boolean;
  status: string;
}

function useIngressRules() {
  return useQuery({
    queryKey: ["ingress"],
    queryFn: () => apiFetch<IngressRule[]>("/ingress"),
  });
}

function useCreateIngressRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; host: string; path: string; backend: string; port: number; tls: boolean }) =>
      apiFetch("/ingress", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingress"] }),
  });
}

function useDeleteIngressRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/ingress/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingress"] }),
  });
}

export function Ingress() {
  const { data, isLoading } = useIngressRules();
  const create = useCreateIngressRule();
  const del = useDeleteIngressRule();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", host: "", path: "/", backend: "", port: "80", tls: false });

  return (
    <div>
      <PageHeader
        title="Ingress Rules"
        description="HTTP/S routing rules for capsule services."
      />
      <Card className="mb-6 max-w-2xl">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({ ...form, port: Number(form.port) }, { onSuccess: () => setForm({ name: "", host: "", path: "/", backend: "", port: "80", tls: false }) });
          }}
        >
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
          <input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="Host (e.g. app.cap)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
          <input value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} placeholder="Path prefix" className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
          <input value={form.backend} onChange={(e) => setForm({ ...form, backend: e.target.value })} placeholder="Backend service" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
          <input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} placeholder="Port" className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={form.tls} onChange={(e) => setForm({ ...form, tls: e.target.checked })} />
            TLS
          </label>
          <Button type="submit" variant="primary" disabled={create.isPending}>Add Rule</Button>
        </form>
      </Card>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && !data?.length && (
        <EmptyState title="No ingress rules" description="Add a rule to route HTTP traffic to capsule services." />
      )}
      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Host</th>
                <th className="p-3">Path</th>
                <th className="p-3">Backend</th>
                <th className="p-3">Port</th>
                <th className="p-3">TLS</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-b border-border/60 hover:bg-card/50">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 font-mono text-xs">{r.host}</td>
                  <td className="p-3 font-mono text-xs">{r.path}</td>
                  <td className="p-3 font-mono text-xs">{r.backend}</td>
                  <td className="p-3">{r.port}</td>
                  <td className="p-3">{r.tls ? "✓" : "—"}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => setDeleteId(r.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete ingress rule?"
        description="Traffic will no longer be routed through this rule."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { if (deleteId) del.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
