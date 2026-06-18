import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStacks, useStack, useDestroyStack } from "@/api/extras";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/common/ui";

export function Stacks() {
  const { data, isLoading } = useStacks();
  const destroy = useDestroyStack();
  const [confirmName, setConfirmName] = useState<string | null>(null);

  return (
    <div>
      <PageHeader
        title="Stacks"
        description="Manage grouped resource stacks deployed via CapInit or factory templates."
      />

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">ID</th>
                <th className="p-3">Status</th>
                <th className="p-3">Resources</th>
                <th className="p-3">Updated</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data?.map((s) => (
                <tr key={s.id} className="border-b border-border/60 hover:bg-card/50">
                  <td className="p-3">
                    <Link to={`/stacks/${s.name}`} className="text-primary hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted">{s.id}</td>
                  <td className="p-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="p-3">{s.resources?.length ?? 0}</td>
                  <td className="p-3 text-xs text-muted">
                    {new Date(s.updatedAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={destroy.isPending}
                      onClick={() => setConfirmName(s.name)}
                    >
                      Destroy
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmName}
        title={`Destroy stack "${confirmName}"?`}
        description="This will permanently delete all resources in this stack. This action cannot be undone."
        confirmLabel="Destroy"
        variant="danger"
        onConfirm={() => {
          if (confirmName) destroy.mutate(confirmName);
          setConfirmName(null);
        }}
        onCancel={() => setConfirmName(null)}
      />
    </div>
  );
}

export function StackDetail() {
  const { name = "" } = useParams();
  const { data, isLoading } = useStack(name);
  const destroy = useDestroyStack();
  const [confirm, setConfirm] = useState(false);

  if (isLoading) return <p className="text-muted">Loading...</p>;
  if (!data) return <p className="text-red-400">Stack not found.</p>;

  return (
    <div>
      <PageHeader
        title={data.name}
        description={data.id}
        actions={
          <Button variant="danger" onClick={() => setConfirm(true)}>
            Destroy Stack
          </Button>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs text-muted">Status</p>
            <div className="mt-1">
              <StatusBadge status={data.status} />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted">Resources</p>
            <p className="mt-1 font-medium">{data.resources?.length ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Last Updated</p>
            <p className="mt-1">{new Date(data.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </Card>

      <h2 className="mb-3 text-lg font-medium">Resources</h2>
      {!data.resources?.length ? (
        <EmptyState title="No resources in this stack" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Type</th>
                <th className="p-3">Name</th>
                <th className="p-3">ID</th>
              </tr>
            </thead>
            <tbody>
              {data.resources.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="p-3 capitalize text-muted">{r.type}</td>
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 font-mono text-xs text-muted">{r.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link to="/stacks" className="mt-4 inline-block text-sm text-primary hover:underline">
        ← Back to Stacks
      </Link>

      <ConfirmDialog
        open={confirm}
        title={`Destroy stack "${data.name}"?`}
        description="This will permanently delete all resources in this stack."
        confirmLabel="Destroy"
        variant="danger"
        onConfirm={() => {
          destroy.mutate(data.name);
          setConfirm(false);
        }}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
