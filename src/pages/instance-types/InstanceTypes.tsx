import { useState } from "react";
import { useCapsuleTypes } from "@/api/resources";
import type { CapsuleType } from "@/types/capper";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";
import { cn } from "@/lib/utils";

type Tab = "types" | "gpu";

function formatGB(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(0)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function RecommendedBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-xs font-medium text-cyan-400">
      Recommended
    </span>
  );
}

function isRecommended(ct: CapsuleType): boolean {
  return !ct.gpuEligible && !ct.locked && ct.family === "standard";
}

function TypesTab() {
  const { data, isLoading } = useCapsuleTypes();
  const [familyFilter, setFamilyFilter] = useState("all");

  const families = data
    ? ["all", ...Array.from(new Set(data.map((ct) => ct.family)))]
    : ["all"];

  const filtered = data?.filter(
    (ct) => familyFilter === "all" || ct.family === familyFilter,
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Filter by family:</span>
        {families.map((f) => (
          <button
            key={f}
            onClick={() => setFamilyFilter(f)}
            className={cn(
              "rounded-md border px-2 py-1 text-xs transition capitalize",
              familyFilter === f
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted hover:border-slate-500 hover:text-slate-200",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Family</th>
                <th className="p-3">CPU</th>
                <th className="p-3">Memory</th>
                <th className="p-3">GPU</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((ct) => (
                <tr key={ct.id} className="border-b border-border/60 hover:bg-card/50">
                  <td className="p-3">
                    <span className="font-medium">{ct.name}</span>
                    {isRecommended(ct) && <RecommendedBadge />}
                  </td>
                  <td className="p-3 capitalize text-muted">{ct.family}</td>
                  <td className="p-3">{ct.cpuCount} vCPU</td>
                  <td className="p-3">{formatGB(ct.memoryBytes)}</td>
                  <td className="p-3">
                    {ct.gpuEligible ? (
                      <span className="text-purple-400">{ct.gpuCount} GPU</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    {ct.locked ? (
                      <span className="text-xs text-amber-400">Locked</span>
                    ) : (
                      <span className="text-xs text-green-400">Available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GPUTab() {
  const { data, isLoading } = useCapsuleTypes();

  const gpuTypes = data?.filter((ct) => ct.gpuEligible) ?? [];

  return (
    <div>
      {isLoading && <p className="text-muted">Loading...</p>}
      {!isLoading && !gpuTypes.length && (
        <EmptyState
          title="No GPU-eligible instance types"
          description="GPU-eligible capsule types will appear here."
        />
      )}

      {gpuTypes.length > 0 && (
        <>
          <Card className="mb-6 border-purple-500/20 bg-purple-500/5">
            <p className="text-sm text-purple-300">
              GPU instance types are available for workloads requiring hardware acceleration.
              Contact your administrator to enable GPU scheduling.
            </p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gpuTypes.map((ct) => (
              <Card key={ct.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{ct.name}</p>
                    <p className="text-xs capitalize text-muted">{ct.family}</p>
                  </div>
                  <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">
                    {ct.gpuCount} GPU
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                  <div>CPU: <span className="text-slate-200">{ct.cpuCount} vCPU</span></div>
                  <div>RAM: <span className="text-slate-200">{formatGB(ct.memoryBytes)}</span></div>
                </div>
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Contact administrator to enable GPU access"
                    onClick={() => {}}
                  >
                    Request GPU Access
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: "types", label: "Types" },
  { id: "gpu", label: "GPU" },
];

export function InstanceTypes() {
  const [tab, setTab] = useState<Tab>("types");

  return (
    <div>
      <PageHeader
        title="Instance Types"
        description="Available capsule hardware profiles and GPU-eligible configurations."
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

      {tab === "types" && <TypesTab />}
      {tab === "gpu" && <GPUTab />}
    </div>
  );
}
