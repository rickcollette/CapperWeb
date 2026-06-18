import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2 } from "lucide-react";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/common/ui";
import {
  listOrgs,
  createOrg,
  deleteOrg,
  type Org,
} from "@/api/orgs";

function useOrgs() {
  return useQuery({ queryKey: ["orgs"], queryFn: listOrgs });
}

function useCreateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; slug?: string; billingEmail?: string }) => createOrg(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orgs"] }),
  });
}

function useDeleteOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrg(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orgs"] }),
  });
}

export function Organizations() {
  const { data, isLoading, error } = useOrgs();
  const create = useCreateOrg();
  const del = useDeleteOrg();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", billingEmail: "" });
  const [deleteTarget, setDeleteTarget] = useState<Org | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      { name: form.name, slug: form.slug || undefined, billingEmail: form.billingEmail || undefined },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm({ name: "", slug: "", billingEmail: "" });
        },
      },
    );
  }

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Manage top-level organizations and their accounts."
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Create Organization
          </Button>
        }
      />

      {isLoading && <p className="text-muted">Loading organizations…</p>}
      {error && <p className="text-red-400">Failed to load organizations.</p>}

      {!isLoading && !data?.length && (
        <EmptyState
          title="No organizations"
          description="Create an organization to start managing accounts and users."
        />
      )}

      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">ID</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Status</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((org) => (
                <tr key={org.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3">
                    <Link
                      to={`/orgs/${org.id}`}
                      className="flex items-center gap-2 font-medium text-primary hover:underline"
                    >
                      <Building2 className="h-4 w-4 shrink-0" />
                      {org.name}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted">{org.id.slice(0, 12)}…</td>
                  <td className="p-3 font-mono text-xs">{org.slug}</td>
                  <td className="p-3">
                    <StatusBadge status={org.status} />
                  </td>
                  <td className="p-3 text-muted">{org.plan || "—"}</td>
                  <td className="p-3 text-xs text-muted">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(org)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Create Organization</h3>
            <form className="space-y-3" onSubmit={handleCreate}>
              <div>
                <label className="mb-1 block text-sm text-muted">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">Slug (optional)</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="acme-corp"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">Billing Email (optional)</label>
                <input
                  type="email"
                  value={form.billingEmail}
                  onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="billing@acme.com"
                />
              </div>
              {create.error && (
                <p className="text-sm text-red-400">{(create.error as Error).message}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={create.isPending}>
                  {create.isPending ? "Creating…" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete organization?"
        description={`Permanently delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) del.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
