import { useState } from "react";
import {
  useCreateIAMGroup,
  useIAMGroups,
  useIAMUsers,
  useAddGroupMember,
  useRemoveGroupMember,
} from "@/api/resources";
import { Button, Card, ConfirmDialog, EmptyState, PageHeader } from "@/components/common/ui";
import { IamNav } from "@/pages/iam/IamNav";
import { ChevronDown, ChevronRight, UserPlus, X } from "lucide-react";
import type { IAMGroup } from "@/types/capper";

function GroupRow({ g }: { g: IAMGroup }) {
  const [open, setOpen] = useState(false);
  const { data: allUsers } = useIAMUsers();
  const addMember = useAddGroupMember();
  const removeMember = useRemoveGroupMember();
  const [addUser, setAddUser] = useState("");
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const availableUsers = (allUsers ?? []).filter(
    (u) => !(g.members ?? []).includes(u.name),
  );

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border/60 hover:bg-card/50"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="p-3">
          <span className="mr-2 inline-block text-muted">
            {open ? <ChevronDown className="inline h-3.5 w-3.5" /> : <ChevronRight className="inline h-3.5 w-3.5" />}
          </span>
          {g.name}
        </td>
        <td className="p-3">{g.members?.length ?? 0}</td>
      </tr>

      {open && (
        <tr className="border-b border-border/60 bg-card/30">
          <td colSpan={2} className="px-6 py-3">
            <div className="space-y-3">
              {/* Member list */}
              {(g.members ?? []).length === 0 ? (
                <p className="text-xs text-muted">No members yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(g.members ?? []).map((m) => (
                    <span
                      key={m}
                      className="flex items-center gap-1 rounded-full bg-slate-700 px-2.5 py-1 text-xs"
                    >
                      {m}
                      <button
                        type="button"
                        className="ml-1 text-muted hover:text-red-400"
                        title={`Remove ${m}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRemoveTarget(m);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add member */}
              <form
                className="flex gap-2"
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!addUser) return;
                  addMember.mutate(
                    { group: g.name, user: addUser },
                    { onSuccess: () => setAddUser("") },
                  );
                }}
              >
                <select
                  value={addUser}
                  onChange={(e) => setAddUser(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                >
                  <option value="">Add member…</option>
                  {availableUsers.map((u) => (
                    <option key={u.name} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={!addUser || addMember.isPending}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>

            <ConfirmDialog
              open={!!removeTarget}
              title={`Remove "${removeTarget}" from "${g.name}"?`}
              description="The user will lose any permissions granted through this group."
              confirmLabel="Remove"
              variant="danger"
              onConfirm={() => {
                if (removeTarget)
                  removeMember.mutate({ group: g.name, user: removeTarget });
                setRemoveTarget(null);
              }}
              onCancel={() => setRemoveTarget(null)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export function Groups() {
  const { data: groups } = useIAMGroups();
  const create = useCreateIAMGroup();
  const [name, setName] = useState("");

  return (
    <div>
      <PageHeader title="IAM Groups" description="Group membership for policy assignment." />
      <IamNav active="groups" />
      <Card className="mb-6 max-w-md">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({ name }, { onSuccess: () => setName("") });
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
            Create
          </Button>
        </form>
      </Card>
      {!groups?.length ? (
        <EmptyState title="No groups" description="Create a group to assign policies to multiple users." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Members</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <GroupRow key={g.id} g={g} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
