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
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";
import { IamNav } from "@/pages/iam/IamNav";

function CreateUser() {
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

export function AccessRequests() {
  const { data: users, isLoading } = useRBACUsers();
  const approve = useApproveUser();
  const disable = useDisableUser();
  const grant = useGrantRole();
  const revoke = useRevokeRole();

  // Show provisioned users (exclude the local OS/CLI 'root' break-glass account).
  const managed = (users ?? []).filter((u) => u.provider === "google" || u.provider === "local");

  return (
    <div>
      <PageHeader
        title="Users & Access"
        description="Provision who can sign in (Google SSO or local username/password) and manage their roles. There is no self-registration."
      />
      <IamNav active="access" />

      <CreateUser />

      {isLoading ? (
        <EmptyState title="Loading…" />
      ) : !managed.length ? (
        <EmptyState title="No users yet" description="Add a user above to grant access." />
      ) : (
        <Card className="p-0">
          <UserTable
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
    </div>
  );
}

function UserTable({ users, render }: { users: RBACUser[]; render: (u: RBACUser) => React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="p-3">Email</th>
            <th className="p-3">Status</th>
            <th className="p-3">Roles</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border/60">
              <td className="p-3">{u.email || u.name}</td>
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
