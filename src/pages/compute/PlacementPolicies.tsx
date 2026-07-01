import { useState } from "react";
import { usePlacementPolicies, useCreatePlacementPolicy, useDeletePlacementPolicy } from "@/api/placementpolicies";
import { PageHeader, Button, Card, StatusBadge } from "@/components/common/ui";

export function PlacementPolicies() {
  const { data: policies, isLoading } = usePlacementPolicies();
  const createMutation = useCreatePlacementPolicy();
  const deleteMutation = useDeletePlacementPolicy("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "spread" as "cluster" | "spread" | "partition", description: "" });

  const handleCreate = async () => {
    if (!form.name || !form.type) {
      alert("Name and type required");
      return;
    }
    try {
      await createMutation.mutateAsync(form);
      setShowCreateForm(false);
      setForm({ name: "", type: "spread", description: "" });
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete policy?")) {
      try {
        const { mutateAsync } = useDeletePlacementPolicy(id);
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
        title="Placement Policies"
        description="Define compute placement rules and constraints"
        actions={
          <Button variant="primary" onClick={() => setShowCreateForm(true)}>
            Create Policy
          </Button>
        }
      />

      {showCreateForm && (
        <Card className="mb-4 p-4 space-y-4">
          <input
            type="text"
            placeholder="Policy name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as any })}
            className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
          >
            <option value="cluster">Cluster (same AZ)</option>
            <option value="spread">Spread (distributed)</option>
            <option value="partition">Partition (grouped)</option>
          </select>
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm h-20"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="default" onClick={() => setShowCreateForm(false)}>
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
          <p className="text-muted">No placement policies.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-semibold">Name</th>
                <th className="px-4 py-2 text-left font-semibold">Type</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-left font-semibold">Created</th>
                <th className="px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.id} className="border-b border-border/50">
                  <td className="px-4 py-3">{policy.name}</td>
                  <td className="px-4 py-3 text-xs capitalize">{policy.type}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={policy.status === "active" ? "running" : "stopped"} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{policy.createdAt?.split("T")[0] || "—"}</td>
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
