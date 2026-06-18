import { useParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Loader, ChevronRight } from "lucide-react";
import {
  useMobilityJob,
  useMobilityJobSteps,
  useMobilityJobMappings,
  useCancelMobilityJob,
  useRollbackMobilityJob,
} from "../../../api/topology";

function stepIcon(status: string) {
  switch (status) {
    case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "failed": return <XCircle className="w-4 h-4 text-red-500" />;
    case "running": return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
    default: return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

export default function VPCJobDetail() {
  const { vpcId = "", jobId = "" } = useParams<{ vpcId: string; jobId: string }>();
  const { data: job, isLoading } = useMobilityJob(vpcId, jobId);
  const { data: steps = [] } = useMobilityJobSteps(vpcId, jobId);
  const { data: mappings = [] } = useMobilityJobMappings(vpcId, jobId);
  const cancelJob = useCancelMobilityJob(vpcId);
  const rollback = useRollbackMobilityJob(vpcId);

  if (isLoading) return <div className="p-8 text-gray-500">Loading job…</div>;
  if (!job) return <div className="p-8 text-red-600">Job not found.</div>;

  const canCancel = job.status === "running" || job.status === "pending";
  const canRollback = job.status === "failed" || job.status === "completed";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to={`/vpcs/${vpcId}/mobility`} className="hover:underline">Mobility Plans</Link>
        <ChevronRight className="w-3 h-3" />
        <span>Job {jobId.slice(-8)}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mobility Job</h1>
          <p className="text-sm text-gray-500 font-mono">{jobId}</p>
        </div>
        <div className="flex gap-2">
          {canCancel && (
            <button
              onClick={() => cancelJob.mutate(jobId)}
              disabled={cancelJob.isPending}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          {canRollback && (
            <button
              onClick={() => rollback.mutate(jobId)}
              disabled={rollback.isPending}
              className="px-4 py-2 text-sm border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50"
            >
              Rollback
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Status", value: <span className="capitalize font-medium">{job.status}</span> },
          { label: "Phase", value: <span className="capitalize">{job.phase || "—"}</span> },
          { label: "Progress", value: `${job.stepsDone ?? 0} / ${job.stepsTotal ?? steps.length}` },
          { label: "Started", value: job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="text-sm">{value}</div>
          </div>
        ))}
      </div>

      {steps.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Execution Steps</h2>
          <div className="space-y-2">
            {steps.map((step: any, idx: number) => (
              <div key={step.id || idx} className="flex items-start gap-3 py-2 border-t border-gray-100 first:border-0">
                {stepIcon(step.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{step.name || step.type}</div>
                  {step.message && <div className="text-xs text-gray-500 truncate">{step.message}</div>}
                </div>
                <div className="text-xs text-gray-400 shrink-0 capitalize">{step.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mappings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Resource Mappings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left border-b border-gray-200">
                <tr>
                  <th className="pb-2 pr-4 font-medium text-gray-600">Type</th>
                  <th className="pb-2 pr-4 font-medium text-gray-600">Source</th>
                  <th className="pb-2 pr-4 font-medium text-gray-600">Target</th>
                  <th className="pb-2 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mappings.map((m: any, idx: number) => (
                  <tr key={m.id || idx}>
                    <td className="py-2 pr-4 text-gray-500 capitalize">{m.resourceType}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-gray-700">{m.sourceId}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-gray-700">{m.targetId || "—"}</td>
                    <td className="py-2 text-xs capitalize">{m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
