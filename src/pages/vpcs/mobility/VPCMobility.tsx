import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Play, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import {
  useMobilityPlans,
  useCreateMobilityPlan,
  useApproveMobilityPlan,
  useExecuteMobilityPlan,
  useCancelMobilityPlan,
} from "../../../api/topology";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    pending_approval: "bg-yellow-100 text-yellow-700",
    approved: "bg-blue-100 text-blue-700",
    executing: "bg-blue-100 text-blue-700 animate-pulse",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
    rolled_back: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function statusIcon(status: string) {
  switch (status) {
    case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "failed": return <XCircle className="w-4 h-4 text-red-500" />;
    case "executing": return <Play className="w-4 h-4 text-blue-500" />;
    case "pending_approval": return <Clock className="w-4 h-4 text-yellow-500" />;
    default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
  }
}

export default function VPCMobility() {
  const { vpcId = "" } = useParams<{ vpcId: string }>();
  const { data: plans = [], isLoading } = useMobilityPlans(vpcId);
  const create = useCreateMobilityPlan(vpcId);
  const approve = useApproveMobilityPlan(vpcId);
  const execute = useExecuteMobilityPlan(vpcId);
  const cancel = useCancelMobilityPlan(vpcId);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ destinationRealmId: "", destinationRegionId: "", note: "" });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      { destinationRealmId: form.destinationRealmId, destinationRegionId: form.destinationRegionId || undefined },
      { onSuccess: () => { setShowCreate(false); setForm({ destinationRealmId: "", destinationRegionId: "", note: "" }); } }
    );
  }

  if (isLoading) return <div className="p-8 text-gray-500">Loading mobility plans…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">VPC Mobility</h1>
          <p className="text-sm text-gray-500 mt-1">Move VPC workloads across realms and regions</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Mobility Plan
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-4"
        >
          <h2 className="text-sm font-semibold text-gray-700">Create Mobility Plan</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination Realm ID</label>
              <input
                required
                value={form.destinationRealmId}
                onChange={(e) => setForm({ ...form, destinationRealmId: e.target.value })}
                placeholder="realm-b"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination Region ID</label>
              <input
                value={form.destinationRegionId}
                onChange={(e) => setForm({ ...form, destinationRegionId: e.target.value })}
                placeholder="us-west-2 (optional)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Strategy</label>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="live-migration (optional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={create.isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {create.isPending ? "Creating…" : "Create Plan"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {plans.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Play className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No mobility plans yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan: any) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {statusIcon(plan.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/vpcs/${vpcId}/mobility/${plan.id}`}
                        className="font-medium text-blue-600 hover:underline text-sm"
                      >
                        Plan {plan.id.slice(-8)}
                      </Link>
                      {statusBadge(plan.status)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      → {plan.destinationRealmId || plan.targetRealm || "—"}
                      {(plan.destinationRegionId || plan.targetRegion) && ` / ${plan.destinationRegionId || plan.targetRegion}`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {plan.status === "draft" && (
                    <button
                      onClick={() => approve.mutate(plan.id)}
                      disabled={approve.isPending}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Approve
                    </button>
                  )}
                  {plan.status === "approved" && (
                    <button
                      onClick={() => execute.mutate(plan.id)}
                      disabled={execute.isPending}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Execute
                    </button>
                  )}
                  {(plan.status === "draft" || plan.status === "approved" || plan.status === "pending_approval") && (
                    <button
                      onClick={() => cancel.mutate(plan.id)}
                      disabled={cancel.isPending}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  )}
                  <Link
                    to={`/vpcs/${vpcId}/mobility/${plan.id}`}
                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Details
                  </Link>
                </div>
              </div>
              {plan.createdAt && (
                <div className="text-xs text-gray-400 mt-2">
                  Created {new Date(plan.createdAt).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
