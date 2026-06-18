import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { Button, Card, ConfirmDialog, EmptyState, PageHeader } from "@/components/common/ui";

interface Queue {
  id: string;
  name: string;
  depth: number;
  consumers: number;
  createdAt: string;
}

function useQueues() {
  return useQuery({
    queryKey: ["queues"],
    queryFn: () => apiFetch<Queue[]>("/queues"),
    refetchInterval: 5000,
  });
}

function useCreateQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      apiFetch("/queues", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queues"] }),
  });
}

function useDeleteQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiFetch(`/queues/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queues"] }),
  });
}

function usePublishMessage() {
  return useMutation({
    mutationFn: ({ queue, message }: { queue: string; message: string }) =>
      apiFetch(`/queues/${queue}/publish`, { method: "POST", body: JSON.stringify({ message }) }),
  });
}

export function Queues() {
  const { data, isLoading } = useQueues();
  const create = useCreateQueue();
  const del = useDeleteQueue();
  const publish = usePublishMessage();
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [publishTarget, setPublishTarget] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  return (
    <div>
      <PageHeader
        title="Message Queues"
        description="Async message queues for decoupled capsule communication."
      />
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
            placeholder="Queue name"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <Button type="submit" variant="primary" disabled={create.isPending}>Create</Button>
        </form>
      </Card>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && !data?.length && (
        <EmptyState title="No queues" description="Create a message queue to start publishing and consuming messages." />
      )}
      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Depth</th>
                <th className="p-3">Consumers</th>
                <th className="p-3">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((q) => (
                <tr key={q.id} className="border-b border-border/60 hover:bg-card/50">
                  <td className="p-3 font-medium">{q.name}</td>
                  <td className="p-3">{q.depth}</td>
                  <td className="p-3">{q.consumers}</td>
                  <td className="p-3 text-xs text-muted">{q.createdAt ? new Date(q.createdAt).toLocaleString() : "—"}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" onClick={() => setPublishTarget(q.name)}>Publish</Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(q.name)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Publish message modal */}
      {publishTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md">
            <h3 className="mb-3 font-medium">Publish to "{publishTarget}"</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message payload"
              className="mb-3 h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
            />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setPublishTarget(null)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!message || publish.isPending}
                onClick={() => {
                  publish.mutate({ queue: publishTarget, message }, {
                    onSuccess: () => { setPublishTarget(null); setMessage(""); },
                  });
                }}
              >
                Publish
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete queue "${deleteTarget}"?`}
        description="All pending messages will be lost."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { if (deleteTarget) del.mutate(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
