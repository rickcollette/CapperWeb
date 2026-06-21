import { useState } from "react";
import {
  useApproveUser,
  useCreateUser,
  useDisableUser,
  useGrantRole,
  useRBACUsers,
  useRevokeRole,
  useSetUserPassword,
  type RBACUser,
} from "@/api/access";
import { useCreateIAMUser, useDeleteIAMUser, useIAMUsers } from "@/api/resources";
import { Button, Card, ConfirmDialog, EmptyState } from "@/components/common/ui";
import { IamNav } from "@/pages/iam/IamNav";
import { IamPageHeader } from "@/pages/iam/IamPageHeader";

function CreateSignInUser() {
  const create = useCreateUser();
  const [provider, setProvider] = useState<"local" | "google">("local");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    create.mutate(
      {
        provider,
        name: name || undefined,
        email: email || undefined,
        password: provider === "local" ? password : undefined,
        role,
      },
      {
        onSuccess: () => { setName(""); setEmail(""); setPassword(""); },
        onError: (e: unknown) => setErr(e instanceof Error ? e.message : "failed"),
      },
    );
  }

  return (
    <Card className="mb-6">
      <h3 className="mb-3 text-sm font-medium">Add user</h3>
      <form className="flex flex-wrap items-center gap-2" onSubmit={submit}>
        <select value={provider} onChange={(e) => setProvider(e.target.value as "local" | "google")}
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
          <option value="local">Local (password)</option>
          <option value="google">Google (SSO)</option>
        </select>
        {provider === "local" ? (
          <>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Username"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </>
        ) : (
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Google email"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
        )}
        <select value={role} onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
          <option value="member">member</option>
          <option value="admin">admin</option>
        </select>
        <Button type="submit" variant="primary" disabled={create.isPending}>Add</Button>
        {err && <span className="text-xs text-red-400">{err}</span>}
      </form>
    </Card>
  );
}

function SetPassword({ user }: { user: RBACUser }) {
  const setPw = useSetUserPassword();
  return (
    <Button size="sm" onClick={() => {
      const pw = window.prompt(`Set new password for ${user.name}`);
      if (pw) setPw.mutate({ id: user.id, password: pw });
    }}>
      Set password
    </Button>
  );
}

const statusStyle: Record<string, string> = {
  active: "bg-green-500/15 text-green-400",
  pending: "bg-amber-500/15 text-amber-400",
  disabled: "bg-slate-500/15 text-slate-400",
};

function SignInUserTable({ users, render }: { users: RBACUser[]; render: (u: RBACUser) => React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="p-3">Email</th>
            <th className="p-3">Provider</th>
            <th className="p-3">Status</th>
            <th className="p-3">Roles</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border/60">
              <td className="p-3">{u.email || u.name}</td>
              <td className="p-3 capitalize">{u.provider ?? "—"}</td>
              <td className="p-3">
                <span className={`rounded px-2 py-0.5 text-xs ${statusStyle[u.status ?? ""] ?? "bg-slate-500/15 text-slate-400"}`}>
                  {u.status ?? "—"}
                </span>
              </td>
              <td className="p-3 text-xs">{u.roles?.length ? u.roles.join(", ") : "—"}</td>
              <td className="p-3">{render(u)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IAMPolicyUsers() {
  const { data: users } = useIAMUsers();
  const create = useCreateIAMUser();
  const [name, setName] = useState("");
  const [deleteName, setDeleteName] = useState<string | null>(null);

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-lg font-medium">Policy principals</h2>
      <p className="mb-4 text-sm text-muted">
        IAM user names referenced by groups, roles, and policies (separate from sign-in accounts above).
      </p>
      <Card className="mb-4 max-w-md">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); create.mutate({ name }, { onSuccess: () => setName("") }); }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="IAM username" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
          <Button type="submit" variant="primary" disabled={create.isPending}>Create</Button>
        </form>
      </Card>
      {!users?.length ? (
        <EmptyState title="No policy principals" description="Create IAM users to attach to groups and roles." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">ID</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/60">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3 font-mono text-xs">{u.id}</td>
                  <td className="p-3">
                    <Button size="sm" variant="danger" onClick={() => setDeleteName(u.name)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {deleteName && (
        <DeleteIAMUser name={deleteName} onClose={() => setDeleteName(null)} />
      )}
    </section>
  );
}

function DeleteIAMUser({ name, onClose }: { name: string; onClose: () => void }) {
  const del = useDeleteIAMUser();
  return (
    <ConfirmDialog
      open
      title="Delete IAM user?"
      description={`Remove policy principal ${name}?`}
      confirmLabel="Delete"
      onCancel={onClose}
      onConfirm={() => del.mutate(name, { onSuccess: onClose })}
    />
  );
}

export function Users() {
  const { data: users, isLoading } = useRBACUsers();
  const approve = useApproveUser();
  const disable = useDisableUser();
  const grant = useGrantRole();
  const revoke = useRevokeRole();

  // Platform operators (admins) live under the Admin → Local Users section;
  // IAM lists everyone else (members and not-yet-approved sign-in users).
  const managed = (users ?? []).filter(
    (u) => (u.provider === "google" || u.provider === "local") && !u.roles?.includes("admin"),
  );

  return (
    <div>
      <IamPageHeader />
      <IamNav active="users" />

      <CreateSignInUser />

      {isLoading ? (
        <EmptyState title="Loading…" />
      ) : !managed.length ? (
        <EmptyState title="No users yet" description="Add a user above to grant access." />
      ) : (
        <Card className="p-0">
          <SignInUserTable
            users={managed}
            render={(u) => {
              const isAdmin = u.roles?.includes("admin");
              const disabled = u.status === "disabled";
              return (
                <div className="flex flex-wrap gap-2">
                  {isAdmin ? (
                    <Button size="sm" onClick={() => revoke.mutate({ id: u.id, role: "admin" })}>Make member</Button>
                  ) : (
                    <Button size="sm" onClick={() => grant.mutate({ id: u.id, role: "admin" })}>Make admin</Button>
                  )}
                  {u.provider === "local" && <SetPassword user={u} />}
                  {disabled ? (
                    <Button size="sm" variant="primary" onClick={() => approve.mutate({ id: u.id, role: "member" })}>Enable</Button>
                  ) : (
                    <Button size="sm" variant="danger" disabled={disable.isPending} onClick={() => disable.mutate(u.id)}>Disable</Button>
                  )}
                </div>
              );
            }}
          />
        </Card>
      )}

      <IAMPolicyUsers />
    </div>
  );
}
