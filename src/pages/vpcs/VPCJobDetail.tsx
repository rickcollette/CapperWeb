import { useParams } from "react-router-dom";
import {
  useMobilityJob,
  useMobilityJobSteps,
  useMobilityJobMappings,
  useCancelMobilityJob,
  useRollbackMobilityJob,
} from "@/api/topology";
import { apiFetch } from "@/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/common/ui";
import { useState } from "react";

function stepIcon(status: string) {
  switch (status) {
    case "completed":
      return "✅";
    case "running":
      return "🔄";
    case "failed":
      return "❌";
    default:
      return "⏳";
  }
}

export function VPCJobDetail() {
  const { vpcId = "", jobId = "" } = useParams<{ vpcId: string; jobId: string }>();
  const qc = useQueryClient();

  const { data: job, isLoading } = useMobilityJob(vpcId, jobId);
  const { data: steps = [] } = useMobilityJobSteps(vpcId, jobId);
  const { data: mappings = [] } = useMobilityJobMappings(vpcId, jobId);

  const cancel = useCancelMobilityJob(vpcId);
  const rollback = useRollbackMobilityJob(vpcId);
  const cutover = useMutation({
    mutationFn: () => apiFetch(`/vpcs/${vpcId}/mobility/jobs/${jobId}/cutover`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vpcs", vpcId, "mobility", "jobs", jobId] }),
  });

  const [cancelOpen, setCancelOpen] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);

  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (!job) return <p className="text-red-400">Job not found.</p>;

  const completedSteps = steps.filter((s: any) => s.status === "completed").length;
  const totalSteps = steps.length || job.totalSteps || 0;
  const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div>
      <PageHeader
        title={`Job ${jobId.slice(0, 12)}…`}
        description={`VPC ${vpcId} · Mobility Job`}
        actions={
          <div className="flex gap-2">
            {job.status === "waiting_for_cutover" && (
              <Button
                variant="primary"
                onClick={() => cutover.mutate()}
                disabled={cutover.isPending}
              >
                Cutover
              </Button>
            )}
            <Button variant="danger" onClick={() => setRollbackOpen(true)}>
              Rollback
            </Button>
            <Button onClick={() => setCancelOpen(true)}>Cancel</Button>
          </div>
        }
      />

      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm">
          <span>Progress</span>
          <span className="text-muted">
            {completedSteps} / {totalSteps} steps
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-700">
          <div
            className="h-3 rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted">
          <StatusBadge status={job.status ?? "running"} />
          <span>{pct}%</span>
        </div>
      </div>

      {/* Steps */}
      {steps.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 font-semibold">Steps</h3>
          <div className="space-y-2">
            {steps.map((step: any, i: number) => (
              <div
                key={step.id ?? i}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <span className="text-lg">{stepIcon(step.status)}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{step.name ?? step.type ?? `Step ${i + 1}`}</p>
                  {step.message && (
                    <p className="text-xs text-muted">{step.message}</p>
                  )}
                </div>
                <StatusBadge status={step.status ?? "pending"} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resource Mappings */}
      {mappings.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold">Resource Mappings</h3>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card text-left text-muted">
                  <th className="p-3">Resource Type</th>
                  <th className="p-3">Source ID</th>
                  <th className="p-3">Destination ID</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m: any, i: number) => (
                  <tr key={m.id ?? i} className="border-b border-border/60">
                    <td className="p-3 capitalize">{m.resourceType || "—"}</td>
                    <td className="p-3 font-mono text-xs">{m.sourceId || "—"}</td>
                    <td className="p-3 font-mono text-xs">{m.destinationId || "—"}</td>
                    <td className="p-3">
                      <StatusBadge status={m.status ?? "pending"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {steps.length === 0 && mappings.length === 0 && (
        <EmptyState title="No details available" description="Step data will appear as the job progresses." />
      )}

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel job?"
        description="Cancel this migration job? Progress may be partially reverted."
        confirmLabel="Cancel Job"
        variant="danger"
        onConfirm={() => {
          cancel.mutate(jobId);
          setCancelOpen(false);
        }}
        onCancel={() => setCancelOpen(false)}
      />

      <ConfirmDialog
        open={rollbackOpen}
        title="Rollback job?"
        description="Rollback this migration job? All changes will be reverted."
        confirmLabel="Rollback"
        variant="danger"
        onConfirm={() => {
          rollback.mutate(jobId);
          setRollbackOpen(false);
        }}
        onCancel={() => setRollbackOpen(false)}
      />
    </div>
  );
}
