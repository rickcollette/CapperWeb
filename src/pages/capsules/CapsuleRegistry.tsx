import { useState } from "react";
import { useCapsuleTypes, useDeprecateCapsuleType } from "@/api/resources";
import { Button, ConfirmDialog, PageHeader } from "@/components/common/ui";
import { formatBytes } from "@/lib/utils";

export function CapsuleRegistry() {
  const { data, isLoading } = useCapsuleTypes();
  const deprecate = useDeprecateCapsuleType();
  const [target, setTarget] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Capsule Types" description="Locked resource envelopes for instances." />
      <ConfirmDialog
        open={!!target}
        title="Deprecate capsule type?"
        description={`Mark ${target} as deprecated. Existing instances are unaffected.`}
        confirmLabel="Deprecate"
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          if (target) deprecate.mutate(target);
          setTarget(null);
        }}
      />
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
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((t) => (
                <tr key={t.id} className="border-b border-border/60">
                  <td className="p-3 font-medium">
                    <span className={t.deprecated || t.description?.includes("[deprecated]") ? "text-muted line-through" : undefined}>
                      {t.name}
                    </span>
                    {(t.deprecated || t.description?.includes("[deprecated]")) && (
                      <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-medium text-amber-400">deprecated</span>
                    )}
                  </td>
                  <td className="p-3">{t.family}</td>
                  <td className="p-3">{t.cpuCount}</td>
                  <td className="p-3">{formatBytes(t.memoryBytes)}</td>
                  <td className="p-3">{t.gpuEligible ? t.gpuCount : "—"}</td>
                  <td className="p-3">
                    {!t.locked && !t.deprecated && !t.description?.includes("[deprecated]") && (
                      <Button size="sm" variant="danger" onClick={() => setTarget(t.name)}>
                        Deprecate
                      </Button>
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
