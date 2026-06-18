import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/common/ui";

interface GPUDevice {
  id: string;
  model: string;
  vendor: string;
  devicePath?: string;
  memoryBytes: number;
  status: "available" | "assigned";
  assignedInstanceId?: string;
}

function formatMemory(bytes: number): string {
  const gib = bytes / (1024 * 1024 * 1024);
  if (gib >= 1) return `${gib.toFixed(0)} GiB`;
  return `${Math.round(bytes / (1024 * 1024))} MiB`;
}

function useGPUs() {
  return useQuery({
    queryKey: ["gpu-inventory"],
    queryFn: () => apiFetch<GPUDevice[]>("/gpu"),
  });
}

function useReleaseGPU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gpuId: string) =>
      apiFetch(`/gpu/${gpuId}/release`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gpu-inventory"] }),
  });
}

const STATUS_FILTER_OPTIONS = ["all", "available", "assigned"] as const;
type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number];

export function GPUInventory() {
  const { data: gpus = [], isLoading } = useGPUs();
  const releaseGPU = useReleaseGPU();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered =
    statusFilter === "all" ? gpus : gpus.filter((g) => g.status === statusFilter);

  const counts = {
    available: gpus.filter((g) => g.status === "available").length,
    assigned: gpus.filter((g) => g.status === "assigned").length,
  };

  return (
    <div>
      <PageHeader
        title="GPU Inventory"
        description="Hardware GPU devices managed by Capper."
      />

      {/* Summary stats */}
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-muted">Total GPUs</p>
          <p className="mt-1 text-2xl font-semibold">{gpus.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Available</p>
          <p className="mt-1 text-2xl font-semibold text-green-400">{counts.available}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Assigned</p>
          <p className="mt-1 text-2xl font-semibold text-amber-400">{counts.assigned}</p>
        </Card>
      </div>

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setStatusFilter(opt)}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
              statusFilter === opt
                ? "bg-primary/15 text-primary"
                : "text-muted hover:bg-slate-800"
            }`}
          >
            {opt}
            {opt !== "all" && (
              <span className="ml-1.5 text-xs opacity-60">{counts[opt]}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted">Loading...</p>}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          title="No GPUs"
          description={
            statusFilter === "all"
              ? "Register hardware to enable GPU workloads."
              : `Filter: ${statusFilter} — none present.`
          }
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Device</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Memory</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned To</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((gpu) => (
                <tr
                  key={gpu.id}
                  className="border-b border-border/60 last:border-0 hover:bg-card/50"
                >
                  <td className="p-3 font-medium">{gpu.model || gpu.devicePath || gpu.id}</td>
                  <td className="p-3 text-muted">{gpu.vendor}</td>
                  <td className="p-3">{formatMemory(gpu.memoryBytes)}</td>
                  <td className="p-3">
                    <StatusBadge status={gpu.status} />
                  </td>
                  <td className="p-3">
                    {gpu.assignedInstanceId ? (
                      <Link
                        to={`/instances/${gpu.assignedInstanceId}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {gpu.assignedInstanceId}
                      </Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {gpu.status === "assigned" && (
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={releaseGPU.isPending}
                        onClick={() => releaseGPU.mutate(gpu.id)}
                      >
                        Release
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {releaseGPU.isError && (
        <p className="mt-3 text-sm text-red-400">{String(releaseGPU.error)}</p>
      )}
    </div>
  );
}
