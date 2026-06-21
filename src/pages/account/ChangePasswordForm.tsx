import { useState } from "react";
import { useChangeOwnPassword } from "@/api/access";
import { Button, Card } from "@/components/common/ui";

// ChangePasswordForm is reused on the Account page and the forced-change gate in
// AppShell. It lives in its own module so AppShell (in the main bundle) can
// import it without statically pulling in the whole lazy-loaded Account page.
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
