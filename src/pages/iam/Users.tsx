import { useState } from "react";
import { useCreateIAMUser, useDeleteIAMUser, useIAMUsers } from "@/api/resources";
import { Button, Card, ConfirmDialog, EmptyState, PageHeader } from "@/components/common/ui";
import { IamNav } from "@/pages/iam/IamNav";

export function Users() {
  const { data: users } = useIAMUsers();
  const create = useCreateIAMUser();
  const [name, setName] = useState("");
  const [deleteName, setDeleteName] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="IAM Users" description="Users, groups, roles, and policies." />
      <IamNav active="users" />
      <Card className="mb-6 max-w-md">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); create.mutate({ name }, { onSuccess: () => setName("") }); }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Username" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
          <Button type="submit" variant="primary" disabled={create.isPending}>Create</Button>
        </form>
      </Card>
      {!users?.length ? <EmptyState title="No users" /> : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-card text-left text-muted"><th className="p-3">Name</th><th className="p-3">ID</th><th className="p-3">Actions</th></tr></thead>
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
      {deleteName && <DeleteUser name={deleteName} onClose={() => setDeleteName(null)} />}
    </div>
  );
}

function DeleteUser({ name, onClose }: { name: string; onClose: () => void }) {
  const del = useDeleteIAMUser();
  return (
    <ConfirmDialog
      open
      title="Delete user?"
      description={`Remove IAM user ${name}?`}
      confirmLabel="Delete"
      onCancel={onClose}
      onConfirm={() => del.mutate(name, { onSuccess: onClose })}
    />
  );
}
