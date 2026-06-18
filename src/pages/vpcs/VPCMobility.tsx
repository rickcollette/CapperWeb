import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useMobilityPlans,
  useMobilityJobs,
  useCreateMobilityPlan,
  useApproveMobilityPlan,
  useExecuteMobilityPlan,
  useCancelMobilityPlan,
} from "@/api/topology";
import {
  Button,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/common/ui";
import { Plus } from "lucide-react";

type Tab = "plans" | "jobs";

export function VPCMobility() {
  const { vpcId } = useParams<{ vpcId: string }>();
  const [tab, setTab] = useState<Tab>("plans");

  if (!vpcId) return <p className="text-red-400">No VPC ID provided.</p>;

  return (
    <div>
      <PageHeader
        title="VPC Mobility"
        description="Move or copy VPC resources across regions and realms."
      />

      <div className="mb-6 flex gap-1 border-b border-border">
        {(["plans", "jobs"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "plans" && <PlansTab vpcId={vpcId} />}
      {tab === "jobs" && <JobsTab vpcId={vpcId} />}
    </div>
  );
}

// ── Plans Tab ────────────────────────────────────────────────────────────────

function PlansTab({ vpcId }: { vpcId: string }) {
  const { data, isLoading } = useMobilityPlans(vpcId);
  const create = useCreateMobilityPlan(vpcId);
  const approve = useApproveMobilityPlan(vpcId);
  const execute = useExecuteMobilityPlan(vpcId);
  const cancel = useCancelMobilityPlan(vpcId);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    operation: "copy",
    copyMode: "full",
    strategy: "rolling",
    destinationRegionId: "",
    destinationZoneId: "",
  });

  if (isLoading) return <p className="text-muted">Loading plans…</p>;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Create Plan
        </Button>
      </div>

      {!data?.length && (
        <EmptyState
          title="No mobility plans"
          description="Create a plan to move or copy this VPC."
        />
      )}

      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted">
                <th className="p-3">ID</th>
                <th className="p-3">Operation</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Strategy</th>
                <th className="p-3">Destination</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((plan: any) => (
                <tr key={plan.id} className="border-b border-border/60 hover:bg-slate-800/30">
                  <td className="p-3 font-mono text-xs">{plan.id.slice(0, 12)}…</td>
                  <td className="p-3 capitalize">{plan.operation}</td>
                  <td className="p-3 text-muted">{plan.copyMode || "—"}</td>
                  <td className="p-3 text-muted">{plan.strategy || "—"}</td>
                  <td className="p-3 text-xs text-muted">
                    {[plan.destinationRegionId, plan.destinationZoneId]
                      .filter(Boolean)
                      .join(" / ") || "—"}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={plan.status ?? "pending"} />
                  </td>
                  <td className="p-3 text-xs text-muted">
                    {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {plan.status === "draft" && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => approve.mutate(plan.id)}
                          disabled={approve.isPending}
                        >
                          Approve
                        </Button>
                      )}
                      {plan.status === "approved" && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => execute.mutate(plan.id)}
                          disabled={execute.isPending}
                        >
                          Execute
                        </Button>
                      )}
                      {["draft", "approved"].includes(plan.status) && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => cancel.mutate(plan.id)}
                          disabled={cancel.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Create Mobility Plan</h3>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate(
                  {
                    operation: form.operation,
                    copyMode: form.copyMode,
                    strategy: form.strategy,
                    destinationRegionId: form.destinationRegionId || undefined,
                    destinationZoneId: form.destinationZoneId || undefined,
                  },
                  { onSuccess: () => setShowCreate(false) },
                );
              }}
            >
              <div>
                <label className="mb-1 block text-sm text-muted">Operation</label>
                <select
                  value={form.operation}
                  onChange={(e) => setForm({ ...form, operation: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="copy">Copy</option>
                  <option value="move">Move</option>
                  <option value="sync">Sync</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">Copy Mode</label>
                <select
                  value={form.copyMode}
                  onChange={(e) => setForm({ ...form, copyMode: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="full">Full</option>
                  <option value="incremental">Incremental</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">Strategy</label>
                <select
                  value={form.strategy}
                  onChange={(e) => setForm({ ...form, strategy: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="rolling">Rolling</option>
                  <option value="blue-green">Blue-Green</option>
                  <option value="cutover">Cutover</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">Destination Region ID</label>
                <input
                  value={form.destinationRegionId}
                  onChange={(e) => setForm({ ...form, destinationRegionId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">Destination Zone ID</label>
                <input
                  value={form.destinationZoneId}
                  onChange={(e) => setForm({ ...form, destinationZoneId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={create.isPending}>
                  {create.isPending ? "Creating…" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Jobs Tab ─────────────────────────────────────────────────────────────────

function JobsTab({ vpcId }: { vpcId: string }) {
  const { data, isLoading } = useMobilityJobs(vpcId);

  if (isLoading) return <p className="text-muted">Loading jobs…</p>;
  if (!data?.length)
    return (
      <EmptyState
        title="No mobility jobs"
        description="Execute a plan to create a migration job."
      />
    );

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-card text-left text-muted">
            <th className="p-3">ID</th>
            <th className="p-3">Status</th>
            <th className="p-3">Steps</th>
            <th className="p-3">Started</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((job: any) => {
            const completedSteps = job.completedSteps ?? 0;
            const totalSteps = job.totalSteps ?? 0;
            return (
              <tr key={job.id} className="border-b border-border/60 hover:bg-slate-800/30">
                <td className="p-3">
                  <Link
                    to={`/vpcs/${vpcId}/mobility/jobs/${job.id}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {job.id.slice(0, 12)}…
                  </Link>
                </td>
                <td className="p-3">
                  <StatusBadge status={job.status ?? "running"} />
                </td>
                <td className="p-3 text-xs">
                  {totalSteps > 0 ? (
                    <span>
                      {completedSteps} / {totalSteps}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 text-xs text-muted">
                  {job.createdAt ? new Date(job.createdAt).toLocaleString() : "—"}
                </td>
                <td className="p-3">
                  <Link to={`/vpcs/${vpcId}/mobility/jobs/${job.id}`}>
                    <Button size="sm">View</Button>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
