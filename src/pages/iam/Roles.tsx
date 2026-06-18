import { useState } from "react";
import { useCreateIAMRole, useIAMRoles } from "@/api/resources";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";
import { IamNav } from "@/pages/iam/IamNav";

export function Roles() {
  const { data: roles } = useIAMRoles();
  const create = useCreateIAMRole();
  const [name, setName] = useState("");

  return (
    <div>
      <PageHeader title="IAM Roles" description="Roles bundle policies for principals." />
      <IamNav active="roles" />
      <Card className="mb-6 max-w-md">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); create.mutate({ name }, { onSuccess: () => setName("") }); }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
          <Button type="submit" variant="primary" disabled={create.isPending}>Create</Button>
        </form>
      </Card>
      {!roles?.length ? <EmptyState title="No roles" /> : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-card text-left text-muted"><th className="p-3">Name</th><th className="p-3">ID</th></tr></thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
