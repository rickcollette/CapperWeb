import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { apiFetch } from "@/api/client";
import { Button, Card, PageHeader } from "@/components/common/ui";

interface SimulateResult {
  nodeName: string;
  score: number;
  status: "eligible" | "rejected";
  reasons: string[];
}

export function PlacementSimulator() {
  const [form, setForm] = useState({
    cpu: 1,
    memory: 512,
    memoryUnit: "MiB",
    gpu: false,
    gpuCount: 1,
    roles: "",
    region: "",
    zone: "",
  });

  const simulate = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<SimulateResult[]>("/scheduler/simulate", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const memBytes =
      form.memory * (form.memoryUnit === "GiB" ? 1024 * 1024 * 1024 : 1024 * 1024);
    simulate.mutate({
      cpu: form.cpu,
      memoryBytes: memBytes,
      gpuCount: form.gpu ? form.gpuCount : 0,
      roles: form.roles ? form.roles.split(",").map((r) => r.trim()) : [],
      region: form.region || undefined,
      zone: form.zone || undefined,
    });
  }

  const results = simulate.data ?? [];

  return (
    <div>
      <PageHeader
        title="Placement Simulator"
        description="Check which nodes are eligible for a workload before scheduling."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold">Requirements</h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-muted">CPU Cores</label>
                <input
                  type="number"
                  min={1}
                  value={form.cpu}
                  onChange={(e) => setForm({ ...form, cpu: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">Memory</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min={1}
                    value={form.memory}
                    onChange={(e) => setForm({ ...form, memory: Number(e.target.value) })}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <select
                    value={form.memoryUnit}
                    onChange={(e) => setForm({ ...form, memoryUnit: e.target.value })}
                    className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
                  >
                    <option>MiB</option>
                    <option>GiB</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.gpu}
                  onChange={(e) => setForm({ ...form, gpu: e.target.checked })}
                  className="rounded"
                />
                GPU Required
              </label>
              {form.gpu && (
                <div>
                  <label className="mb-1 block text-sm text-muted">GPU Count</label>
                  <input
                    type="number"
                    min={1}
                    value={form.gpuCount}
                    onChange={(e) => setForm({ ...form, gpuCount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted">
                Required Roles (comma-separated)
              </label>
              <input
                value={form.roles}
                onChange={(e) => setForm({ ...form, roles: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="worker, gpu"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-muted">Region</label>
                <input
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">Zone</label>
                <input
                  value={form.zone}
                  onChange={(e) => setForm({ ...form, zone: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" disabled={simulate.isPending}>
              <Play className="h-4 w-4" />
              {simulate.isPending ? "Simulating…" : "Simulate"}
            </Button>
          </form>
        </Card>

        <div>
          <h3 className="mb-3 font-semibold">Results</h3>
          {simulate.isIdle && (
            <p className="text-sm text-muted">Run a simulation to see eligible nodes.</p>
          )}
          {simulate.isPending && <p className="text-muted">Simulating…</p>}
          {simulate.isError && (
            <p className="text-sm text-red-400">
              {(simulate.error as Error).message}
            </p>
          )}
          {simulate.isSuccess && !results.length && (
            <p className="text-sm text-amber-400">No eligible nodes found.</p>
          )}
          {simulate.isSuccess && !!results.length && (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card text-left text-muted">
                    <th className="p-3">Node</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Reasons</th>
                  </tr>
                </thead>
                <tbody>
                  {results
                    .sort((a, b) => b.score - a.score)
                    .map((r) => (
                      <tr key={r.nodeName} className="border-b border-border/60">
                        <td className="p-3 font-medium">{r.nodeName}</td>
                        <td className="p-3 font-mono text-xs">{r.score}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                              r.status === "eligible"
                                ? "border-green-500/30 bg-green-500/15 text-green-400"
                                : "border-red-500/30 bg-red-500/15 text-red-400"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-muted">
                          {r.reasons?.join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
