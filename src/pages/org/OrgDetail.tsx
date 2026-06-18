import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, UserPlus } from "lucide-react";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/common/ui";
import {
  getOrg,
  patchOrg,
  listOrgAccounts,
  createOrgAccount,
  suspendAccount,
  reactivateAccount,
  listOrgRootUsers,
  addOrgRootUser,
  removeOrgRootUser,
  listGuardrails,
  createGuardrail,
  deleteGuardrail,
  type Account,
  type OrgRootUser,
  type Guardrail,
} from "@/api/orgs";

type Tab = "accounts" | "root-users" | "guardrails" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "accounts", label: "Accounts" },
  { id: "root-users", label: "Root Users" },
  { id: "guardrails", label: "Guardrails" },
  { id: "settings", label: "Settings" },
];

export function OrgDetail() {
  const { orgId } = useParams<{ orgId: string }>();
  const [tab, setTab] = useState<Tab>("accounts");

  const { data: org, isLoading } = useQuery({
    queryKey: ["orgs", orgId],
    queryFn: () => getOrg(orgId!),
    enabled: !!orgId,
  });

  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (!org) return <p className="text-red-400">Organization not found.</p>;

  return (
    <div>
      <PageHeader title={org.name} description={`Organization · ${org.slug}`} />

      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "accounts" && <AccountsTab orgId={org.id} />}
      {tab === "root-users" && <RootUsersTab orgId={org.id} />}
      {tab === "guardrails" && <GuardrailsTab orgId={org.id} />}
      {tab === "settings" && <SettingsTab orgId={org.id} name={org.name} />}
    </div>
  );
}

// ── Accounts Tab ────────────────────────────────────────────────────────────

function AccountsTab({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["orgs", orgId, "accounts"],
    queryFn: () => listOrgAccounts(orgId),
  });

  const suspend = useMutation({
    mutationFn: (accountId: string) => suspendAccount(orgId, accountId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orgs", orgId, "accounts"] }),
  });

  const reactivate = useMutation({
    mutationFn: (accountId: string) => reactivateAccount(orgId, accountId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orgs", orgId, "accounts"] }),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const create = useMutation({
    mutationFn: (body: { name: string; email?: string }) => createOrgAccount(orgId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "accounts"] });
      setShowCreate(false);
      setForm({ name: "", email: "" });
    },
  });

  if (isLoading) return <p className="text-muted">Loading accounts…</p>;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <UserPlus className="h-4 w-4" /> Add Account
        </Button>
      </div>

      {!data?.length && (
        <EmptyState title="No accounts" description="Add accounts to this organization." />
      )}

      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">ID</th>
                <th className="p-3">Email</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((acct: Account) => (
                <tr key={acct.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 font-medium">{acct.name}</td>
                  <td className="p-3 font-mono text-xs text-muted">{acct.id.slice(0, 12)}…</td>
                  <td className="p-3 text-muted">{acct.email || "—"}</td>
                  <td className="p-3 text-muted">{acct.accountType || "standard"}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${
                        acct.status === "active"
                          ? "border-green-500/30 bg-green-500/15 text-green-400"
                          : acct.status === "suspended"
                          ? "border-red-500/30 bg-red-500/15 text-red-400"
                          : "border-slate-500/30 bg-slate-500/15 text-slate-400"
                      }`}
                    >
                      {acct.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {acct.status !== "suspended" && (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={suspend.isPending}
                          onClick={() => suspend.mutate(acct.id)}
                        >
                          Suspend
                        </Button>
                      )}
                      {acct.status === "suspended" && (
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={reactivate.isPending}
                          onClick={() => reactivate.mutate(acct.id)}
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Add Account</h3>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate({ name: form.name, email: form.email || undefined });
              }}
            >
              <div>
                <label className="mb-1 block text-sm text-muted">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={create.isPending}>
                  {create.isPending ? "Adding…" : "Add"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root Users Tab ───────────────────────────────────────────────────────────

function RootUsersTab({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["orgs", orgId, "root-users"],
    queryFn: () => listOrgRootUsers(orgId),
  });

  const [email, setEmail] = useState("");
  const add = useMutation({
    mutationFn: (e: string) => addOrgRootUser(orgId, { userId: e, email: e }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "root-users"] });
      setEmail("");
    },
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeOrgRootUser(orgId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orgs", orgId, "root-users"] }),
  });

  const [removeTarget, setRemoveTarget] = useState<OrgRootUser | null>(null);

  if (isLoading) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <Card className="mb-6 max-w-lg">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) add.mutate(email.trim());
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <Button type="submit" variant="primary" disabled={add.isPending}>
            Add Root User
          </Button>
        </form>
      </Card>

      {!data?.length && (
        <EmptyState title="No root users" description="Add root users to manage this organization." />
      )}

      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Email</th>
                <th className="p-3">User ID</th>
                <th className="p-3">Status</th>
                <th className="p-3">MFA</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((u: OrgRootUser) => (
                <tr key={u.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 font-medium">{u.email}</td>
                  <td className="p-3 font-mono text-xs text-muted">{u.userId.slice(0, 12)}…</td>
                  <td className="p-3"><StatusBadge status={u.status} /></td>
                  <td className="p-3 text-xs text-muted">{u.mfaRequired ? "Required" : "Optional"}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => setRemoveTarget(u)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove root user?"
        description={`Remove ${removeTarget?.email} from root users?`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => {
          if (removeTarget) remove.mutate(removeTarget.userId);
          setRemoveTarget(null);
        }}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}

// ── Guardrails Tab ───────────────────────────────────────────────────────────

function GuardrailsTab({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["orgs", orgId, "guardrails"],
    queryFn: () => listGuardrails(orgId),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", document: "" });
  const create = useMutation({
    mutationFn: (body: { name: string; description?: string; document?: string }) =>
      createGuardrail(orgId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "guardrails"] });
      setShowCreate(false);
      setForm({ name: "", description: "", document: "" });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteGuardrail(orgId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orgs", orgId, "guardrails"] }),
  });

  const [deleteTarget, setDeleteTarget] = useState<Guardrail | null>(null);

  if (isLoading) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Add Guardrail
        </Button>
      </div>

      {!data?.length && (
        <EmptyState
          title="No guardrails"
          description="Guardrails define policy constraints for this organization."
        />
      )}

      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Description</th>
                <th className="p-3">Enabled</th>
                <th className="p-3">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((g: Guardrail) => (
                <tr key={g.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 font-medium">{g.name}</td>
                  <td className="p-3 text-muted">{g.description || "—"}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                        g.enabled
                          ? "border-green-500/30 bg-green-500/15 text-green-400"
                          : "border-slate-500/30 bg-slate-500/15 text-slate-400"
                      }`}
                    >
                      {g.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted">
                    {new Date(g.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(g)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Add Guardrail</h3>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate({
                  name: form.name,
                  description: form.description || undefined,
                  document: form.document || undefined,
                });
              }}
            >
              <div>
                <label className="mb-1 block text-sm text-muted">Name *</label>
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
                <label className="mb-1 block text-sm text-muted">Policy Document (JSON)</label>
                <textarea
                  rows={5}
                  value={form.document}
                  onChange={(e) => setForm({ ...form, document: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
                  placeholder='{"Version":"2024-01-01","Statement":[]}'
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={create.isPending}>
                  {create.isPending ? "Adding…" : "Add"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete guardrail?"
        description={`Delete guardrail "${deleteTarget?.name}"?`}
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

// ── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ orgId, name }: { orgId: string; name: string }) {
  const qc = useQueryClient();
  const [orgName, setOrgName] = useState(name);
  const patch = useMutation({
    mutationFn: (updates: Record<string, string>) => patchOrg(orgId, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orgs", orgId] }),
  });

  return (
    <Card className="max-w-lg">
      <h3 className="mb-4 font-semibold">Organization Settings</h3>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          patch.mutate({ name: orgName });
        }}
      >
        <div>
          <label className="mb-1 block text-sm text-muted">Organization Name</label>
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        {patch.isSuccess && <p className="text-sm text-green-400">Saved.</p>}
        {patch.error && (
          <p className="text-sm text-red-400">{(patch.error as Error).message}</p>
        )}
        <Button type="submit" variant="primary" disabled={patch.isPending}>
          {patch.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </Card>
  );
}
