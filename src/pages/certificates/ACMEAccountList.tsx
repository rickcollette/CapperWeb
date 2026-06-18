import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  useACMEAccounts,
  useCreateACMEAccount,
  useDeleteACMEAccount,
  type ACMEAccount,
} from "@/api/certificates";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/common/ui";

export function ACMEAccountList() {
  const { data: accounts = [], isLoading } = useACMEAccounts();
  const create = useCreateACMEAccount();
  const del = useDeleteACMEAccount();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    issuer: "letsencrypt" as "staging" | "production" | "letsencrypt",
    directoryUrl: "",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ACMEAccount | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    create.mutate(
      {
        name: form.name,
        email: form.email,
        issuer: form.issuer,
        directoryUrl: form.directoryUrl || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({ name: "", email: "", issuer: "letsencrypt", directoryUrl: "" });
        },
        onError: (err) => setErrorMsg((err as Error).message),
      },
    );
  }

  if (isLoading) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="ACME Accounts"
        description="Registered Let's Encrypt / ACME accounts for certificate issuance."
        actions={
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Register Account
          </Button>
        }
      />

      {!accounts.length && (
        <EmptyState
          title="No ACME accounts"
          description="Register an ACME account to issue Let's Encrypt certificates."
        />
      )}

      {!!accounts.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Directory URL</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((a: ACMEAccount) => (
                <tr key={a.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 font-medium">{a.name}</td>
                  <td className="p-3 text-muted">{a.email}</td>
                  <td className="p-3 font-mono text-xs text-muted truncate max-w-xs">
                    {a.directoryUrl || "—"}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteTarget(a)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Register ACME Account</h3>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-sm text-muted">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="my-acme-account"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">Issuer Type</label>
                <select
                  value={form.issuer}
                  onChange={(e) =>
                    setForm({ ...form, issuer: e.target.value as typeof form.issuer })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="letsencrypt">Let's Encrypt (production)</option>
                  <option value="staging">Let's Encrypt (staging)</option>
                  <option value="production">Production ACME</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">
                  Custom Directory URL (optional)
                </label>
                <input
                  value={form.directoryUrl}
                  onChange={(e) => setForm({ ...form, directoryUrl: e.target.value })}
                  placeholder="https://acme-v02.api.letsencrypt.org/directory"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={create.isPending}>
                  {create.isPending ? "Registering…" : "Register"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete ACME account?"
        description={`Delete account "${deleteTarget?.name}"? Certificates using this account may not be able to renew.`}
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
