import { useState } from "react";
import { useDatabases, useCreateDatabase, useDeleteDatabase } from "@/api/extras";
import type { DBEngine } from "@/types/capper";
import {
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
  StatusBadge,
} from "@/components/common/ui";

const ENGINE_LABELS: Record<DBEngine, string> = {
  postgres: "PostgreSQL",
  redis: "Redis",
  mariadb: "MariaDB",
};

const ENGINE_COLORS: Record<DBEngine, string> = {
  postgres: "text-blue-400",
  redis: "text-red-400",
  mariadb: "text-amber-400",
};

export function Databases() {
  const { data, isLoading } = useDatabases();
  const create = useCreateDatabase();
  const del = useDeleteDatabase();
  const [form, setForm] = useState({ name: "", engine: "postgres" as DBEngine });
  const [confirmName, setConfirmName] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => setForm({ name: "", engine: "postgres" }) });
  }

  return (
    <div>
      <PageHeader
        title="Databases"
        description="Managed database instances for your capsule workloads."
      />

      <Card className="mb-6 max-w-md">
        <p className="mb-3 text-sm font-medium">Create Database</p>
        <form className="flex flex-wrap gap-2" onSubmit={handleCreate}>
          <input
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Database name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={form.engine}
            onChange={(e) => setForm({ ...form, engine: e.target.value as DBEngine })}
            size={3}
          >
            <option value="postgres">PostgreSQL</option>
            <option value="redis">Redis</option>
            <option value="mariadb">MariaDB</option>
          </select>
          <Button type="submit" variant="primary" disabled={create.isPending}>
            Create Database
          </Button>
        </form>
        {create.isError && (
          <p className="mt-2 text-xs text-red-400">{String(create.error)}</p>
        )}
      </Card>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Engine</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data?.map((db) => (
                <tr key={db.id} className="border-b border-border/60 hover:bg-card/50">
                  <td className="p-3">
                    <span className="font-medium">{db.name}</span>
                    <div className="text-xs text-muted">{db.id}</div>
                  </td>
                  <td className="p-3">
                    <span className={ENGINE_COLORS[db.engine] ?? ""}>
                      {ENGINE_LABELS[db.engine] ?? db.engine}
                    </span>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={db.status} />
                  </td>
                  <td className="p-3 text-xs text-muted">
                    {new Date(db.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={del.isPending}
                      onClick={() => setConfirmName(db.name)}
                    >
                      Delete
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
        title={`Delete database "${confirmName}"?`}
        description="All data will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (confirmName) del.mutate(confirmName);
          setConfirmName(null);
        }}
        onCancel={() => setConfirmName(null)}
      />
    </div>
  );
}
