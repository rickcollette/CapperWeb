import { useState } from "react";
import { useAutoscalePolicies, useCreateAutoscalePolicy, useDeleteAutoscalePolicy } from "@/api/autoscale";
import { PageHeader, Button, Card, StatusBadge } from "@/components/common/ui";

export function AutoscalePolicies() {
  const { data: policies, isLoading } = useAutoscalePolicies();
  const createMutation = useCreateAutoscalePolicy();
  const deleteMutation = useDeleteAutoscalePolicy("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    resourceType: "instance",
    minSize: 1,
    maxSize: 10,
    desiredSize: 3,
    scalingType: "metric" as "metric" | "scheduled",
    metricName: "cpu-utilization",
    targetValue: 70,
  });

  const handleCreate = async () => {
    if (!form.name) {
      alert("Name required");
      return;
    }
    try {
      await createMutation.mutateAsync(form as any);
      setShowForm(false);
      setForm({
        name: "",
        resourceType: "instance",
        minSize: 1,
        maxSize: 10,
        desiredSize: 3,
        scalingType: "metric",
        metricName: "cpu-utilization",
        targetValue: 70,
      });
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete policy?")) {
      try {
        const { mutateAsync } = useDeleteAutoscalePolicy(id);
        await mutateAsync();
      } catch (err) {
        alert(`Error: ${err}`);
      }
    }
  };

  if (isLoading) return <p className="text-muted">Loading...</p>;

  return (
    <div>
      <PageHeader
        title="Autoscaling Policies"
        description="Automatically scale compute resources based on metrics or schedules"
        actions={
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Create Policy
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-4 p-4 space-y-4">
          <input
            type="text"
            placeholder="Policy name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
          />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted">Min Size</label>
              <input
                type="number"
                min="1"
                value={form.minSize}
                onChange={(e) => setForm({ ...form, minSize: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Max Size</label>
              <input
                type="number"
                min="1"
                value={form.maxSize}
                onChange={(e) => setForm({ ...form, maxSize: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Desired Size</label>
              <input
                type="number"
                min="1"
                value={form.desiredSize}
                onChange={(e) => setForm({ ...form, desiredSize: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Scaling Type</label>
              <select
                value={form.scalingType}
                onChange={(e) => setForm({ ...form, scalingType: e.target.value as any })}
                className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
              >
                <option value="metric">Metric-based</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          {form.scalingType === "metric" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted">Metric</label>
                <input
                  type="text"
                  placeholder="e.g., cpu-utilization"
                  value={form.metricName || ""}
                  onChange={(e) => setForm({ ...form, metricName: e.target.value })}
                  className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted">Target Value (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.targetValue || 70}
                  onChange={(e) => setForm({ ...form, targetValue: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="default" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} disabled={createMutation.isPending}>
              Create
            </Button>
          </div>
        </Card>
      )}

      {!policies || policies.length === 0 ? (
        <Card>
          <p className="text-muted">No autoscale policies.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-semibold">Name</th>
                <th className="px-4 py-2 text-left font-semibold">Type</th>
                <th className="px-4 py-2 text-left font-semibold">Min-Desired-Max</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.id} className="border-b border-border/50">
                  <td className="px-4 py-3">{policy.name}</td>
                  <td className="px-4 py-3 capitalize text-xs">{policy.scalingType}</td>
                  <td className="px-4 py-3 text-xs font-mono">
                    {policy.minSize}-{policy.desiredSize}-{policy.maxSize}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={policy.status === "active" ? "running" : "stopped"} />
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(policy.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
