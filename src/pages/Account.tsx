import { useEffect, useState } from "react";
import { useCurrentUser, useChangeOwnPassword, useUpdateOwnProfile } from "@/api/access";
import { Button, Card, PageHeader } from "@/components/common/ui";

// Account is the signed-in user's self-service page: view identity, update email,
// and change password.
export function Account() {
  const { data: me } = useCurrentUser();
  const user = me?.user;

  return (
    <div className="max-w-xl">
      <PageHeader title="My Account" description="Manage your profile and password." />
      <Card className="mb-6">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted">Username</span><span>{user?.name ?? "—"}</span>
          <span className="text-muted">Provider</span><span>{user?.provider ?? "—"}</span>
          <span className="text-muted">Roles</span><span>{me?.roles?.join(", ") || "—"}</span>
        </div>
      </Card>
      <EmailForm currentEmail={user?.email ?? ""} />
      <ChangePasswordForm />
    </div>
  );
}

function EmailForm({ currentEmail }: { currentEmail: string }) {
  const update = useUpdateOwnProfile();
  const [email, setEmail] = useState(currentEmail);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => setEmail(currentEmail), [currentEmail]);

  return (
    <Card className="mb-6">
      <h3 className="mb-3 text-sm font-medium">Email</h3>
      <form className="flex gap-2" onSubmit={(e) => {
        e.preventDefault(); setMsg(null);
        update.mutate({ email }, { onSuccess: () => setMsg("Saved."), onError: () => setMsg("Failed to save.") });
      }}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <Button type="submit" variant="primary" disabled={update.isPending}>Save</Button>
      </form>
      {msg && <p className="mt-2 text-xs text-muted">{msg}</p>}
    </Card>
  );
}

// ChangePasswordForm is reused on the Account page and the forced-change gate.
export function ChangePasswordForm({ forced = false, onDone }: { forced?: boolean; onDone?: () => void }) {
  const change = useChangeOwnPassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setOk(false);
    if (next !== confirm) { setErr("Passwords do not match."); return; }
    if (next.length < 8) { setErr("Password must be at least 8 characters."); return; }
    change.mutate({ currentPassword: current, newPassword: next }, {
      onSuccess: () => { setOk(true); setCurrent(""); setNext(""); setConfirm(""); onDone?.(); },
      onError: (e: unknown) => setErr(e instanceof Error ? e.message : "Failed to change password."),
    });
  }

  return (
    <Card>
      <h3 className="mb-3 text-sm font-medium">{forced ? "Set a new password" : "Change password"}</h3>
      <form className="space-y-3" onSubmit={submit}>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
          placeholder="Current password" autoComplete="current-password"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)}
          placeholder="New password" autoComplete="new-password"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password" autoComplete="new-password"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
        {err && <p className="text-xs text-red-400">{err}</p>}
        {ok && <p className="text-xs text-green-400">Password updated.</p>}
        <Button type="submit" variant="primary" disabled={change.isPending}>
          {change.isPending ? "Saving…" : "Update password"}
        </Button>
      </form>
    </Card>
  );
}
