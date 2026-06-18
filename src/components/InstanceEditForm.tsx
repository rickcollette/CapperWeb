import { useState } from "react";
import { useUpdateInstance } from "@/api/instances";
import { Button, Card } from "@/components/common/ui";
import type { CapperInstance } from "@/types/capper";

// InstanceEditForm edits an instance's mutable properties: resource limits and
// restart policy. Memory/process limits apply live to a running instance; CPU
// time and file-size limits take effect on next start.
export function InstanceEditForm({ instance }: { instance: CapperInstance }) {
  const update = useUpdateInstance(instance.id);
  const r = instance.resources ?? {};
  const [memMB, setMemMB] = useState(r.memoryBytes ? Math.round(r.memoryBytes / 1048576) : 0);
  const [cpuSecs, setCpuSecs] = useState(r.cpuTimeSecs ?? 0);
  const [maxProc, setMaxProc] = useState(r.maxProcesses ?? 0);
  const [fsizeMB, setFsizeMB] = useState(r.fileSizeBytes ? Math.round(r.fileSizeBytes / 1048576) : 0);
  const [restart, setRestart] = useState(instance.restartPolicy ?? "");
  const [msg, setMsg] = useState<string | null>(null);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    update.mutate(
      {
        resources: {
          memoryBytes: memMB > 0 ? memMB * 1048576 : undefined,
          cpuTimeSecs: cpuSecs > 0 ? cpuSecs : undefined,
          maxProcesses: maxProc > 0 ? maxProc : undefined,
          fileSizeBytes: fsizeMB > 0 ? fsizeMB * 1048576 : undefined,
        },
        restartPolicy: restart || undefined,
      },
      {
        onSuccess: (res: any) => {
          setMsg(res?.data?.needsRestart
            ? "Saved. CPU/file-size limits apply on next restart."
            : res?.data?.liveApplied
              ? "Saved and applied live."
              : "Saved. Applies on next start.");
        },
        onError: (e: unknown) => setMsg(e instanceof Error ? e.message : "Failed to save."),
      },
    );
  }

  const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  return (
    <Card className="mt-4">
      <h3 className="mb-3 text-sm font-medium">Edit resources</h3>
      <form className="grid gap-3 md:grid-cols-2" onSubmit={save}>
        <label className="text-sm">Memory (MB)
          <input type="number" min={0} value={memMB} onChange={(e) => setMemMB(+e.target.value)} className={field} />
        </label>
        <label className="text-sm">Max processes
          <input type="number" min={0} value={maxProc} onChange={(e) => setMaxProc(+e.target.value)} className={field} />
        </label>
        <label className="text-sm">CPU time (s)
          <input type="number" min={0} value={cpuSecs} onChange={(e) => setCpuSecs(+e.target.value)} className={field} />
        </label>
        <label className="text-sm">Max file size (MB)
          <input type="number" min={0} value={fsizeMB} onChange={(e) => setFsizeMB(+e.target.value)} className={field} />
        </label>
        <label className="text-sm">Restart policy
          <select value={restart} onChange={(e) => setRestart(e.target.value)} className={field}>
            <option value="">(unchanged)</option>
            <option value="no">no</option>
            <option value="on-failure">on-failure</option>
            <option value="always">always</option>
          </select>
        </label>
        <div className="flex items-end gap-3">
          <Button type="submit" variant="primary" disabled={update.isPending}>Save changes</Button>
          {msg && <span className="text-xs text-muted">{msg}</span>}
        </div>
      </form>
    </Card>
  );
}
