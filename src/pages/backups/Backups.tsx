import { useState } from "react";
import {
  useBackups,
  useCreateBackup,
  useRestoreBackup,
  useBackupPolicies,
  useCreateBackupPolicy,
  useDeleteBackupPolicy,
} from "@/api/extras";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
} from "@/components/common/ui";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, exp);
  return `${val.toFixed(1)} ${units[exp]}`;
}

type Tab = "backups" | "policies";

function BackupsTab() {
  const { data, isLoading } = useBackups();
  const create = useCreateBackup();
  const restore = useRestoreBackup();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">{data?.length ?? 0} backup(s)</p>
        <Button
          variant="primary"
          disabled={create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending ? "Creating..." : "Create Backup"}
        </Button>
      </div>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && !data?.length && (
        <EmptyState title="No backups" description="Create a backup to protect your data." />
      )}
      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">ID</th>
                <th className="p-3">Path</th>
                <th className="p-3">Size</th>
                <th className="p-3">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id} className="border-b border-border/60 hover:bg-card/50">
                  <td className="p-3 font-mono text-xs">{b.id}</td>
                  <td className="p-3 font-mono text-xs text-muted">{b.path}</td>
                  <td className="p-3">{formatBytes(b.sizeBytes)}</td>
                  <td className="p-3 text-xs text-muted">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={restore.isPending}
                      onClick={() => setRestoringId(b.id)}
                    >
                      Restore
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!restoringId}
        title="Restore backup?"
        description="Restoring will overwrite current state. Proceed with caution."
        confirmLabel="Restore"
        variant="primary"
        onConfirm={() => {
          if (restoringId) restore.mutate(restoringId);
          setRestoringId(null);
        }}
        onCancel={() => setRestoringId(null)}
      />
    </div>
  );
}

function PoliciesTab() {
  const { data, isLoading } = useBackupPolicies();
  const create = useCreateBackupPolicy();
  const del = useDeleteBackupPolicy();
  const [form, setForm] = useState({ name: "", type: "full", intervalValue: 24, intervalUnit: "h", retention: 7 });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function buildInterval() {
    return `${form.intervalValue}${form.intervalUnit}`;
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({ ...form, interval: buildInterval() }, {
      onSuccess: () => setForm({ name: "", type: "full", intervalValue: 24, intervalUnit: "h", retention: 7 }),
    });
  }

  return (
    <div>
      <Card className="mb-4 max-w-md">
        <form className="space-y-3" onSubmit={handleCreate}>
          <div>
            <label className="mb-1 block text-xs text-muted">Name</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Policy name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Type</label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="full">Full</option>
              <option value="incremental">Incremental</option>
              <option value="snapshot">Snapshot</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Interval</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                placeholder="interval"
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.intervalValue}
                onChange={(e) => setForm({ ...form, intervalValue: Math.max(1, Number(e.target.value)) })}
                required
              />
              <select
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.intervalUnit}
                onChange={(e) => setForm({ ...form, intervalUnit: e.target.value })}
              >
                <option value="m">Minutes</option>
                <option value="h">Hours</option>
                <option value="d">Days</option>
                <option value="w">Weeks</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Retention (days)</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Retention days"
              value={form.retention}
              onChange={(e) => setForm({ ...form, retention: Number(e.target.value) })}
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={create.isPending}>
            Create Policy
          </Button>
        </form>
      </Card>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && !data?.length && (
        <EmptyState title="No backup policies" description="Create a policy to schedule automatic backups." />
      )}
      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Interval</th>
                <th className="p-3">Retention</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-b border-border/60 hover:bg-card/50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 capitalize">{p.type}</td>
                  <td className="p-3">{p.interval}</td>
                  <td className="p-3">{p.retention}d</td>
                  <td className="p-3 text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={del.isPending}
                      onClick={() => setConfirmId(p.id)}
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
        open={!!confirmId}
        title="Delete backup policy?"
        description="Scheduled backups using this policy will stop."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (confirmId) del.mutate(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: "backups", label: "Backups" },
  { id: "policies", label: "Policies" },
];

export function Backups() {
  const [tab, setTab] = useState<Tab>("backups");

  return (
    <div>
      <PageHeader
        title="Backups"
        description="Manage on-demand backups and automatic backup policies."
      />

      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition",
              tab === t.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-slate-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "backups" && <BackupsTab />}
      {tab === "policies" && <PoliciesTab />}
    </div>
  );
}
