import { useEffect, useState } from "react";
import { useHostLimits, useSetHostLimits, type HostLimit } from "@/api/admin";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";

// Limits manages host-wide caps (e.g. max capsule deployments). Per-account
// quotas remain under System → Quotas; this page is the host-level surface.
export function Limits() {
  const { data: limits = [], isLoading } = useHostLimits();
  const save = useSetHostLimits();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);

  // Seed editable fields from the current overrides (blank = auto/default).
  useEffect(() => {
    const seed: Record<string, string> = {};
    for (const l of limits) seed[l.key] = l.override > 0 ? String(l.override) : "";
    setDraft(seed);
  }, [limits]);

  function submit(l: HostLimit) {
    setErr(null);
    const raw = (draft[l.key] ?? "").trim();
    const value = raw === "" ? null : Number(raw);
    if (value !== null && (!Number.isFinite(value) || value <= 0)) {
      setErr("Enter a positive number, or leave blank to use the default.");
      return;
    }
    save.mutate(
      { [l.key]: value },
      { onError: (e: unknown) => setErr(e instanceof Error ? e.message : "failed to save") },
    );
  }

  return (
    <div>
      <PageHeader
        title="Limits"
        description="Host-wide caps for the control plane. Leave a field blank to use the built-in default. Per-account quotas live under System → Quotas."
      />

      {isLoading ? (
        <EmptyState title="Loading…" />
      ) : !limits.length ? (
        <EmptyState title="No host limits" description="No configurable host limits are available." />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="p-3">Limit</th>
                  <th className="p-3">In use</th>
                  <th className="p-3">Effective cap</th>
                  <th className="p-3">Default</th>
                  <th className="p-3">Override</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {limits.map((l) => {
                  const pct = l.limit > 0 ? Math.min(100, Math.round((l.used / l.limit) * 100)) : 0;
                  return (
                    <tr key={l.key} className="border-b border-border/60">
                      <td className="p-3">
                        <div>{l.label}</div>
                        <div className="font-mono text-xs text-muted">{l.key}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs">{l.used} / {l.limit} {l.unit}</div>
                        <div className="mt-1 h-1.5 w-28 overflow-hidden rounded bg-slate-700/50">
                          <div className={`h-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="p-3 font-medium">{l.limit}</td>
                      <td className="p-3 text-muted">{l.default}</td>
                      <td className="p-3">
                        <input
                          value={draft[l.key] ?? ""}
                          onChange={(e) => setDraft((d) => ({ ...d, [l.key]: e.target.value }))}
                          placeholder="auto"
                          inputMode="numeric"
                          className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <Button size="sm" variant="primary" disabled={save.isPending} onClick={() => submit(l)}>
                          Save
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {err && <div className="border-t border-border p-3 text-xs text-red-400">{err}</div>}
        </Card>
      )}
    </div>
  );
}
