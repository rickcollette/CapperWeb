import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, StatusBadge } from "@/components/common/ui";
import { ShieldCheck } from "lucide-react";

interface Certificate {
  id: string;
  name: string;
  domain: string;
  issuer: string;
  expiresAt: string;
  status: string;
}

function useCertificates() {
  return useQuery({
    queryKey: ["certs"],
    queryFn: () => apiFetch<Certificate[]>("/certs"),
  });
}

function useCreateCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; domain: string }) =>
      apiFetch("/certs", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certs"] }),
  });
}

function useDeleteCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/certs/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certs"] }),
  });
}

export function Certificates() {
  const { data, isLoading } = useCertificates();
  const create = useCreateCertificate();
  const del = useDeleteCertificate();
  const [form, setForm] = useState({ name: "", domain: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div>
      <PageHeader
        title="Certificates"
        description="TLS certificates for encrypted capsule services."
        actions={<ShieldCheck className="h-6 w-6 text-muted" />}
      />
      <Card className="mb-6 max-w-lg">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(form, { onSuccess: () => setForm({ name: "", domain: "" }) });
          }}
        >
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Certificate name"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <input
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
            placeholder="Domain (e.g. example.cap)"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <Button type="submit" variant="primary" disabled={create.isPending}>
            Create
          </Button>
        </form>
      </Card>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && !data?.length && (
        <EmptyState title="No certificates" description="Create a certificate to enable TLS on capsule services." />
      )}
      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Domain</th>
                <th className="p-3">Issuer</th>
                <th className="p-3">Expires</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="border-b border-border/60 hover:bg-card/50">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 font-mono text-xs">{c.domain}</td>
                  <td className="p-3 text-muted">{c.issuer || "—"}</td>
                  <td className="p-3 text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</td>
                  <td className="p-3"><StatusBadge status={c.status} /></td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => setDeleteId(c.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete certificate?"
        description="This will permanently remove the certificate."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { if (deleteId) del.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
