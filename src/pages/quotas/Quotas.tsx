import { useState } from "react";
import { useQuotas, useSetQuota } from "@/api/extras";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";
import { cn } from "@/lib/utils";

const RESOURCE_OPTIONS = ["instance", "storage", "network", "gpu"] as const;
type QuotaResource = (typeof RESOURCE_OPTIONS)[number];

function QuotaBar({ used, limit }: { used: number; limit: number }) {
  if (limit <= 0) {
    return <span className="text-xs text-muted">Unlimited</span>;
  }
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const color =
    pct >= 90
      ? "bg-red-500"
      : pct >= 70
        ? "bg-amber-500"
        : "bg-primary";

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-700/50">
        <div
          className={cn("h-2 rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted">
        {used} / {limit} ({pct}%)
      </span>
    </div>
  );
}

export function Quotas() {
  const { data, isLoading } = useQuotas();
  const set = useSetQuota();
  const [form, setForm] = useState<{ resource: QuotaResource; limit: string }>({
    resource: "instance",
    limit: "",
  });
  function handleSet(e: React.FormEvent) {
    e.preventDefault();
    set.mutate(
      { resource: form.resource, limit: Number(form.limit) },
      {
        onSuccess: () => setForm({ resource: "instance", limit: "" }),
      },
    );
  }

  return (
    <div>
      <PageHeader
        title="Quotas"
        description="Resource limits and current usage across your project."
      />

      <Card className="mb-6 max-w-sm">
        <p className="mb-3 text-sm font-medium">Set Quota</p>
        <form className="space-y-3" onSubmit={handleSet}>
          <div>
            <label className="mb-1 block text-xs text-muted">Resource</label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm capitalize"
              value={form.resource}
              onChange={(e) => setForm({ ...form, resource: e.target.value as QuotaResource })}
              size={4}
            >
              {RESOURCE_OPTIONS.map((r) => (
                <option key={r} value={r} className="capitalize">
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Limit</label>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Limit (0 = unlimited)"
              value={form.limit}
              onChange={(e) => setForm({ ...form, limit: e.target.value })}
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={set.isPending}>
            Set Quota
          </Button>
        </form>
      </Card>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && !data?.length && (
        <EmptyState
          title="No quotas configured"
          description="Set quotas to limit resource consumption."
        />
      )}
      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Resource</th>
                <th className="p-3">Usage</th>
                <th className="p-3">Used</th>
                <th className="p-3">Limit</th>
              </tr>
            </thead>
            <tbody>
              {data.map((q) => (
                <tr key={q.resource} className="border-b border-border/60 hover:bg-card/50">
                  <td className="p-3 font-medium capitalize">{q.resource}</td>
                  <td className="p-3">
                    <QuotaBar used={q.used} limit={q.limit} />
                  </td>
                  <td className="p-3">{q.used}</td>
                  <td className="p-3">{q.limit <= 0 ? "∞" : q.limit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
