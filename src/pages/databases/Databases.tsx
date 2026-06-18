import { useState } from "react";
import { useParams } from "react-router-dom";
import { useDatabases, useCreateDatabase, useDeleteDatabase } from "@/api/extras";
import type { DBEngine } from "@/types/capper";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/common/ui";

export const ENGINE_LABELS: Record<DBEngine, string> = {
  postgres: "PostgreSQL",
  redis: "Redis",
  mariadb: "MariaDB",
  capdb: "CapDB",
};

const ENGINE_COLORS: Record<DBEngine, string> = {
  postgres: "text-blue-400",
  redis: "text-red-400",
  mariadb: "text-amber-400",
  capdb: "text-green-400",
};

const ENGINE_DEFAULT_VERSION: Record<DBEngine, string> = {
  postgres: "16",
  redis: "7",
  mariadb: "11",
  capdb: "1",
};

const ALL_ENGINES: DBEngine[] = ["postgres", "mariadb", "redis", "capdb"];

export function Databases() {
  // Optional :engine route param scopes the page to one engine type.
  const params = useParams();
  const engineParam = (params.engine as DBEngine | undefined);
  const scoped = engineParam && ALL_ENGINES.includes(engineParam) ? engineParam : undefined;

  const { data, isLoading } = useDatabases();
  const create = useCreateDatabase();
  const del = useDeleteDatabase();
  const [form, setForm] = useState<{ name: string; engine: DBEngine; version: string }>({
    name: "",
    engine: scoped ?? "postgres",
    version: ENGINE_DEFAULT_VERSION[scoped ?? "postgres"],
  });
  const [confirmName, setConfirmName] = useState<string | null>(null);

  // When scoped to an engine, keep the create form locked to it.
  const formEngine = scoped ?? form.engine;
  const list = (data ?? []).filter((db) => !scoped || db.engine === scoped);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      { name: form.name, engine: formEngine, version: form.version },
      { onSuccess: () => setForm({ name: "", engine: formEngine, version: ENGINE_DEFAULT_VERSION[formEngine] }) },
    );
  }

  const title = scoped ? `${ENGINE_LABELS[scoped]} Databases` : "Databases";
  const desc = scoped
    ? `Managed ${ENGINE_LABELS[scoped]} instances. Each runs in a dedicated capsule.`
    : "Managed database instances across all engines.";

  return (
    <div>
      <PageHeader title={title} description={desc} />

      <Card className="mb-6 max-w-xl">
        <p className="mb-3 text-sm font-medium">Create {scoped ? ENGINE_LABELS[scoped] : "Database"}</p>
        <form className="flex flex-wrap items-end gap-2" onSubmit={handleCreate}>
          <input
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Database name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          {!scoped && (
            <select
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={form.engine}
              onChange={(e) => {
                const eng = e.target.value as DBEngine;
                setForm({ ...form, engine: eng, version: ENGINE_DEFAULT_VERSION[eng] });
              }}
            >
              {ALL_ENGINES.map((eng) => (
                <option key={eng} value={eng}>{ENGINE_LABELS[eng]}</option>
              ))}
            </select>
          )}
          <input
            className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="version"
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
          />
          <Button type="submit" variant="primary" disabled={create.isPending}>Create</Button>
        </form>
        {create.isError && <p className="mt-2 text-xs text-red-400">{String(create.error)}</p>}
      </Card>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && !list.length && (
        <EmptyState title={`No ${scoped ? ENGINE_LABELS[scoped] : ""} databases`} description="Create one above." />
      )}
      {!isLoading && !!list.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Engine</th>
                <th className="p-3">Version</th>
                <th className="p-3">Status</th>
                <th className="p-3">Port</th>
                <th className="p-3">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((db) => (
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
                  <td className="p-3 text-xs">{db.version || "—"}</td>
                  <td className="p-3"><StatusBadge status={db.status} /></td>
                  <td className="p-3 text-xs">{db.port || "—"}</td>
                  <td className="p-3 text-xs text-muted">{new Date(db.createdAt).toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <Button variant="danger" size="sm" disabled={del.isPending} onClick={() => setConfirmName(db.name)}>
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
