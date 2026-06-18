import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Key } from "lucide-react";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/common/ui";
import { getOrgAccount } from "@/api/orgs";
import {
  listAccountIAMUsers,
  createAccountIAMUser,
  deleteAccountIAMUser,
  listAccountIAMGroups,
  createAccountIAMGroup,
  deleteAccountIAMGroup,
  listAccountIAMRoles,
  createAccountIAMRole,
  deleteAccountIAMRole,
  listAccountIAMPolicies,
  createAccountIAMPolicy,
  deleteAccountIAMPolicy,
  listServiceAccounts,
  createServiceAccount,
  deleteServiceAccount,
  issueServiceAccountToken,
  type IAMUser,
  type IAMGroup,
  type IAMRole,
  type IAMPolicy,
  type IAMServiceAccount,
} from "@/api/iam";
import { useAuditEvents } from "@/api/audit";
import { useQuotas } from "@/api/extras";

type Tab = "users" | "groups" | "roles" | "policies" | "service-accounts" | "audit" | "quotas";

const TABS: { id: Tab; label: string }[] = [
  { id: "users", label: "IAM Users" },
  { id: "groups", label: "Groups" },
  { id: "roles", label: "Roles" },
  { id: "policies", label: "Policies" },
  { id: "service-accounts", label: "Service Accounts" },
  { id: "audit", label: "Audit" },
  { id: "quotas", label: "Quotas" },
];

export function AccountDetail() {
  const { orgId, accountId } = useParams<{ orgId: string; accountId: string }>();
  const [tab, setTab] = useState<Tab>("users");

  const { data: account, isLoading } = useQuery({
    queryKey: ["orgs", orgId, "accounts", accountId],
    queryFn: () => getOrgAccount(orgId!, accountId!),
    enabled: !!orgId && !!accountId,
  });

  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (!account) return <p className="text-red-400">Account not found.</p>;

  return (
    <div>
      <PageHeader
        title={account.name}
        description={`Account · ${account.accountType || "standard"}`}
      />

      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
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

      {tab === "users" && <IAMUsersTab accountId={account.id} />}
      {tab === "groups" && <IAMGroupsTab accountId={account.id} />}
      {tab === "roles" && <IAMRolesTab accountId={account.id} />}
      {tab === "policies" && <IAMPoliciesTab accountId={account.id} />}
      {tab === "service-accounts" && <ServiceAccountsTab accountId={account.id} />}
      {tab === "audit" && <AuditTab accountId={account.id} />}
      {tab === "quotas" && <QuotasTab />}
    </div>
  );
}

// ── IAM Users Tab ────────────────────────────────────────────────────────────

function IAMUsersTab({ accountId }: { accountId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["accounts", accountId, "iam", "users"],
    queryFn: () => listAccountIAMUsers(accountId),
  });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const create = useMutation({
    mutationFn: (body: { name: string; email?: string }) => createAccountIAMUser(accountId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts", accountId, "iam", "users"] });
      setShowCreate(false);
      setForm({ name: "", email: "" });
    },
  });
  const del = useMutation({
    mutationFn: (userId: string) => deleteAccountIAMUser(accountId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts", accountId, "iam", "users"] }),
  });
  const [deleteTarget, setDeleteTarget] = useState<IAMUser | null>(null);

  if (isLoading) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>
      {!data?.length ? (
        <EmptyState title="No IAM users" description="Create IAM users for routine access." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">ID</th>
                <th className="p-3">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((u: IAMUser) => (
                <tr key={u.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 text-muted">{u.email || "—"}</td>
                  <td className="p-3 font-mono text-xs text-muted">{u.id.slice(0, 12)}…</td>
                  <td className="p-3 text-xs text-muted">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(u)}>
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
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Add IAM User</h3>
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
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete IAM user?"
        description={`Delete user "${deleteTarget?.name}"?`}
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

// ── IAM Groups Tab ───────────────────────────────────────────────────────────

function IAMGroupsTab({ accountId }: { accountId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["accounts", accountId, "iam", "groups"],
    queryFn: () => listAccountIAMGroups(accountId),
  });
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: (n: string) => createAccountIAMGroup(accountId, { name: n }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts", accountId, "iam", "groups"] });
      setName("");
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteAccountIAMGroup(accountId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts", accountId, "iam", "groups"] }),
  });
  const [deleteTarget, setDeleteTarget] = useState<IAMGroup | null>(null);

  if (isLoading) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <Card className="mb-6 max-w-sm">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) create.mutate(name.trim());
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <Button type="submit" variant="primary" disabled={create.isPending}>
            Add
          </Button>
        </form>
      </Card>
      {!data?.length ? (
        <EmptyState title="No groups" description="Create groups to organize IAM users." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Members</th>
                <th className="p-3">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((g: IAMGroup) => (
                <tr key={g.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 font-medium">{g.name}</td>
                  <td className="p-3 text-muted">{g.members?.length ?? 0}</td>
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
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete group?"
        description={`Delete group "${deleteTarget?.name}"?`}
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

// ── IAM Roles Tab ────────────────────────────────────────────────────────────

function IAMRolesTab({ accountId }: { accountId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["accounts", accountId, "iam", "roles"],
    queryFn: () => listAccountIAMRoles(accountId),
  });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const create = useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      createAccountIAMRole(accountId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts", accountId, "iam", "roles"] });
      setShowCreate(false);
      setForm({ name: "", description: "" });
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteAccountIAMRole(accountId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts", accountId, "iam", "roles"] }),
  });
  const [deleteTarget, setDeleteTarget] = useState<IAMRole | null>(null);

  if (isLoading) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Create Role
        </Button>
      </div>
      {!data?.length ? (
        <EmptyState title="No roles" description="Create roles to delegate access." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Description</th>
                <th className="p-3">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((r: IAMRole) => (
                <tr key={r.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 text-muted">{r.description || "—"}</td>
                  <td className="p-3 text-xs text-muted">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(r)}>
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
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Create Role</h3>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate({ name: form.name, description: form.description || undefined });
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
        title="Delete role?"
        description={`Delete role "${deleteTarget?.name}"?`}
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

// ── IAM Policies Tab ─────────────────────────────────────────────────────────

function IAMPoliciesTab({ accountId }: { accountId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["accounts", accountId, "iam", "policies"],
    queryFn: () => listAccountIAMPolicies(accountId),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteAccountIAMPolicy(accountId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts", accountId, "iam", "policies"] }),
  });
  const create = useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      createAccountIAMPolicy(accountId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts", accountId, "iam", "policies"] }),
  });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "" });
  const [deleteTarget, setDeleteTarget] = useState<IAMPolicy | null>(null);

  if (isLoading) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Create Policy
        </Button>
      </div>
      {!data?.length ? (
        <EmptyState title="No policies" description="Create policies to define permissions." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((p: IAMPolicy) => (
                <tr key={p.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                        p.managed
                          ? "border-slate-600/30 bg-slate-600/15 text-slate-500"
                          : "border-blue-500/30 bg-blue-500/15 text-blue-400"
                      }`}
                    >
                      {p.managed ? "Managed" : "Custom"}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    {!p.managed && (
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
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
            <h3 className="mb-4 text-lg font-semibold">Create Policy</h3>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate({ name: form.name });
                setShowCreate(false);
                setForm({ name: "" });
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
        title="Delete policy?"
        description={`Delete policy "${deleteTarget?.name}"?`}
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

// ── Service Accounts Tab ─────────────────────────────────────────────────────

function ServiceAccountsTab({ accountId }: { accountId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["accounts", accountId, "iam", "service-accounts"],
    queryFn: () => listServiceAccounts(accountId),
  });
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: (n: string) => createServiceAccount(accountId, { name: n }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts", accountId, "iam", "service-accounts"] });
      setName("");
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteServiceAccount(accountId, id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["accounts", accountId, "iam", "service-accounts"] }),
  });
  const issueToken = useMutation({
    mutationFn: (id: string) => issueServiceAccountToken(accountId, id),
  });
  const [issuedToken, setIssuedToken] = useState<{ token: string; sa: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IAMServiceAccount | null>(null);

  if (isLoading) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <Card className="mb-6 max-w-sm">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) create.mutate(name.trim());
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Service account name"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <Button type="submit" variant="primary" disabled={create.isPending}>
            Create
          </Button>
        </form>
      </Card>
      {!data?.length ? (
        <EmptyState
          title="No service accounts"
          description="Service accounts provide machine identities."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">ID</th>
                <th className="p-3">Created</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((sa: IAMServiceAccount) => (
                <tr key={sa.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 font-medium">{sa.name}</td>
                  <td className="p-3 font-mono text-xs text-muted">{sa.id.slice(0, 12)}…</td>
                  <td className="p-3 text-xs text-muted">
                    {new Date(sa.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={issueToken.isPending}
                        onClick={() =>
                          issueToken.mutate(sa.id, {
                            onSuccess: (r) =>
                              setIssuedToken({ token: r.token, sa: sa.name }),
                          })
                        }
                      >
                        <Key className="h-3 w-3" /> Issue Token
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(sa)}>
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
      {issuedToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Token Issued for {issuedToken.sa}</h3>
            <p className="mb-3 text-sm text-amber-400">
              Copy this token now — it will not be shown again.
            </p>
            <code className="block w-full break-all rounded-lg border border-border bg-background p-3 text-xs">
              {issuedToken.token}
            </code>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setIssuedToken(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete service account?"
        description={`Delete service account "${deleteTarget?.name}"?`}
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

// ── Audit Tab ────────────────────────────────────────────────────────────────

function AuditTab({ accountId }: { accountId: string }) {
  const { data, isLoading } = useAuditEvents(accountId, { limit: 50 });

  if (isLoading) return <p className="text-muted">Loading audit events…</p>;
  if (!data?.length)
    return <EmptyState title="No audit events" description="No events recorded for this account." />;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-card text-left text-muted">
            <th className="p-3">Time</th>
            <th className="p-3">Actor</th>
            <th className="p-3">Action</th>
            <th className="p-3">Resource</th>
            <th className="p-3">Decision</th>
            <th className="p-3">Source IP</th>
          </tr>
        </thead>
        <tbody>
          {data.map((e) => (
            <tr key={e.id} className="border-b border-border/60 hover:bg-slate-800/30">
              <td className="p-3 text-xs text-muted">{new Date(e.createdAt).toLocaleString()}</td>
              <td className="p-3 font-mono text-xs">{e.actorUrn || e.actorId}</td>
              <td className="p-3 font-mono text-xs">{e.action}</td>
              <td className="p-3 font-mono text-xs text-muted">{e.resourceCrn || "—"}</td>
              <td className="p-3">
                <StatusBadge status={e.decision} />
              </td>
              <td className="p-3 text-xs text-muted">{e.sourceIp || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Quotas Tab ───────────────────────────────────────────────────────────────

function QuotasTab() {
  const { data, isLoading } = useQuotas();

  if (isLoading) return <p className="text-muted">Loading quotas…</p>;
  if (!data?.length)
    return <EmptyState title="No quotas configured" description="No quota limits have been set." />;

  return (
    <div className="space-y-4">
      {data.map((q) => {
        const pct = q.limit > 0 ? Math.min(100, Math.round((q.used / q.limit) * 100)) : 0;
        const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-green-500";
        return (
          <div key={q.resource} className="rounded-xl border border-border p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium capitalize">{q.resource}</span>
              <span className="text-muted">
                {q.used} / {q.limit}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-700">
              <div
                className={`h-2 rounded-full ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
