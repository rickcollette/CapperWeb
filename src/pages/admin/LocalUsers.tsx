import { useState } from "react";
import {
  useCreateUser,
  useDisableUser,
  useApproveUser,
  useRevokeRole,
  useRBACUsers,
  useSetUserPassword,
  type RBACUser,
} from "@/api/access";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";

const statusStyle: Record<string, string> = {
  active: "bg-green-500/15 text-green-400",
  pending: "bg-amber-500/15 text-amber-400",
  disabled: "bg-slate-500/15 text-slate-400",
};

function CreateOperator() {
  const create = useCreateUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    create.mutate(
      { provider: "local", name: name || undefined, email: email || undefined, password, role: "admin" },
      {
        onSuccess: () => { setName(""); setEmail(""); setPassword(""); },
        onError: (e: unknown) => setErr(e instanceof Error ? e.message : "failed"),
      },
    );
  }

  return (
    <Card className="mb-6">
      <h3 className="mb-3 text-sm font-medium">Add operator</h3>
      <form className="flex flex-wrap items-center gap-2" onSubmit={submit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Username"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <Button type="submit" variant="primary" disabled={create.isPending}>Add operator</Button>
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

// LocalUsers manages platform operator accounts (users holding the admin role).
// Ordinary users (members, SSO) are managed under IAM → Users & Access.
export function LocalUsers() {
  const { data: operators = [], isLoading } = useRBACUsers("admin");
  const disable = useDisableUser();
  const approve = useApproveUser();
  const revoke = useRevokeRole();

  return (
    <div>
      <PageHeader
        title="Local Users"
        description="Platform operator accounts with administrative access. Everyone else is managed under IAM."
      />

      <CreateOperator />

      {isLoading ? (
        <EmptyState title="Loading…" />
      ) : !operators.length ? (
        <EmptyState title="No operators" description="Add an operator above to grant administrative access." />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="p-3">User</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((u) => {
                  const disabled = u.status === "disabled";
                  return (
                    <tr key={u.id} className="border-b border-border/60">
                      <td className="p-3">{u.email || u.name}</td>
                      <td className="p-3 capitalize">{u.provider ?? "—"}</td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-0.5 text-xs ${statusStyle[u.status ?? ""] ?? "bg-slate-500/15 text-slate-400"}`}>
                          {u.status ?? "—"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => revoke.mutate({ id: u.id, role: "admin" })}>
                            Revoke admin
                          </Button>
                          {u.provider === "local" && <SetPassword user={u} />}
                          {disabled ? (
                            <Button size="sm" variant="primary" onClick={() => approve.mutate({ id: u.id, role: "admin" })}>Enable</Button>
                          ) : (
                            <Button size="sm" variant="danger" disabled={disable.isPending} onClick={() => disable.mutate(u.id)}>Disable</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
