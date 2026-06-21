import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  useUFWStatus,
  useUFWAddRule,
  useUFWDeleteRule,
  useUFWSetEnabled,
  useUFWDefaults,
  useUFWSetDefault,
} from "@/api/hostsec";
import { Button, Card, ConfirmDialog, EmptyState, PageHeader } from "@/components/common/ui";

function Defaults() {
  const { data } = useUFWDefaults();
  const save = useUFWSetDefault();
  const dirs: Array<{ key: "incoming" | "outgoing" | "routed"; label: string }> = [
    { key: "incoming", label: "Incoming" },
    { key: "outgoing", label: "Outgoing" },
    { key: "routed", label: "Routed" },
  ];
  return (
    <Card className="mb-6">
      <h3 className="mb-3 text-sm font-medium">Default policies</h3>
      <div className="flex flex-wrap gap-4">
        {dirs.map((d) => {
          const cur = data?.[d.key] ?? "";
          return (
            <label key={d.key} className="flex items-center gap-2 text-sm">
              <span className="text-muted">{d.label}</span>
              <select value={["allow", "deny", "reject"].includes(cur) ? cur : ""}
                onChange={(e) => save.mutate({ direction: d.key, policy: e.target.value })}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm">
                <option value="" disabled>{cur || "—"}</option>
                <option value="allow">allow</option>
                <option value="deny">deny</option>
                <option value="reject">reject</option>
              </select>
            </label>
          );
        })}
      </div>
    </Card>
  );
}

const actionStyle: Record<string, string> = {
  ALLOW: "bg-green-500/15 text-green-400",
  DENY: "bg-red-500/15 text-red-400",
  REJECT: "bg-red-500/15 text-red-400",
  LIMIT: "bg-amber-500/15 text-amber-400",
};

// Firewall manages the host's UFW: status, numbered rules, add/delete, and a
// guarded enable/disable. Host OS only — distinct from per-instance firewalls.
export function Firewall() {
  const { data: status, isLoading, error } = useUFWStatus();
  const add = useUFWAddRule();
  const del = useUFWDeleteRule();
  const setEnabled = useUFWSetEnabled();
  const [form, setForm] = useState({ action: "allow", port: "", proto: "", from: "" });
  const [err, setErr] = useState<string | null>(null);
  const [confirmEnable, setConfirmEnable] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    add.mutate(
      { action: form.action, port: form.port || undefined, proto: form.proto || undefined, from: form.from || undefined },
      {
        onSuccess: () => setForm((f) => ({ ...f, port: "", from: "" })),
        onError: (e: unknown) => setErr(e instanceof Error ? e.message : "failed to add rule"),
      },
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Firewall (UFW)" description="Host perimeter firewall." />
        <EmptyState title="UFW unavailable" description="ufw could not be run on this host." />
      </div>
    );
  }

  const rules = status?.rules ?? [];

  return (
    <div>
      <PageHeader title="Firewall (UFW)" description="The host's UFW perimeter firewall. Applies to the host OS only — separate from per-instance firewalls." />

      {isLoading ? (
        <EmptyState title="Loading…" />
      ) : status && !status.available ? (
        <EmptyState title="UFW not installed" description="Install ufw on the host to manage the firewall here." />
      ) : (
        <>
          <Card className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Status: {status?.enabled ? "Active" : "Inactive"}</div>
              <div className="text-xs text-muted">
                {status?.enabled
                  ? "UFW is filtering host traffic."
                  : "Enabling UFW can lock out SSH/console — ensure an allow rule for those ports first."}
              </div>
            </div>
            {status?.enabled ? (
              <Button variant="danger" disabled={setEnabled.isPending} onClick={() => setEnabled.mutate(false)}>Disable</Button>
            ) : (
              <Button variant="primary" disabled={setEnabled.isPending} onClick={() => setConfirmEnable(true)}>Enable</Button>
            )}
          </Card>

          <Defaults />

          <Card className="mb-6">
            <h3 className="mb-3 text-sm font-medium">Add rule</h3>
            <form className="flex flex-wrap items-end gap-2" onSubmit={submit}>
              <select value={form.action} onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
                className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
                <option value="allow">allow</option>
                <option value="deny">deny</option>
                <option value="reject">reject</option>
                <option value="limit">limit</option>
              </select>
              <input value={form.port} onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
                placeholder="Port (e.g. 22)" className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <select value={form.proto} onChange={(e) => setForm((f) => ({ ...f, proto: e.target.value }))}
                className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
                <option value="">any proto</option>
                <option value="tcp">tcp</option>
                <option value="udp">udp</option>
              </select>
              <input value={form.from} onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))}
                placeholder="From (optional CIDR)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <Button type="submit" variant="primary" disabled={add.isPending}><Plus className="h-3.5 w-3.5" /> Add</Button>
              {err && <span className="text-xs text-red-400">{err}</span>}
            </form>
          </Card>

          {!rules.length ? (
            <EmptyState title="No rules" description="UFW has no numbered rules." />
          ) : (
            <Card className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="p-3">#</th>
                    <th className="p-3">To</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">From</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.num} className="border-b border-border/60">
                      <td className="p-3 text-muted">{r.num}</td>
                      <td className="p-3 font-mono">{r.to}</td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-0.5 text-xs ${actionStyle[r.action] ?? ""}`}>{r.action}</span>
                      </td>
                      <td className="p-3 font-mono text-xs">{r.from}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="danger" disabled={del.isPending} onClick={() => del.mutate(r.num)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      {confirmEnable && (
        <ConfirmDialog
          open
          title="Enable UFW?"
          description="Enabling the firewall may drop existing connections. Make sure you have an allow rule for SSH and the Capper API before continuing."
          confirmLabel="Enable firewall"
          onCancel={() => setConfirmEnable(false)}
          onConfirm={() => { setConfirmEnable(false); setEnabled.mutate(true); }}
        />
      )}
    </div>
  );
}
