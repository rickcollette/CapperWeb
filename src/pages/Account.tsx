import { useEffect, useState } from "react";
import { useCurrentUser, useUpdateOwnProfile } from "@/api/access";
import { Button, Card, PageHeader } from "@/components/common/ui";
import { ChangePasswordForm } from "@/pages/account/ChangePasswordForm";

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
