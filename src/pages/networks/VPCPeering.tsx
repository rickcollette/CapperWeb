import { useState } from "react";
import { useVPCPeerings, useDeleteVPCPeering, useCreateVPCPeering } from "@/api/vpcpeering";
import { useVPCs } from "@/api/topology";
import { PageHeader, Button, Card, StatusBadge } from "@/components/common/ui";

export function VPCPeering() {
  const { data: peerings, isLoading } = useVPCPeerings();
  const { data: vpcs } = useVPCs();
  const createMutation = useCreateVPCPeering();
  const deleteMutation = useDeleteVPCPeering("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ sourceVpcId: "", targetVpcId: "" });

  const handleCreate = async () => {
    if (!form.sourceVpcId || !form.targetVpcId) {
      alert("Both VPCs required");
      return;
    }
    if (form.sourceVpcId === form.targetVpcId) {
      alert("Source and target VPCs must be different");
      return;
    }
    try {
      await createMutation.mutateAsync({
        sourceVpcId: form.sourceVpcId,
        targetVpcId: form.targetVpcId,
      });
      setShowCreateForm(false);
      setForm({ sourceVpcId: "", targetVpcId: "" });
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete peering connection?")) {
      try {
        const { mutateAsync } = useDeleteVPCPeering(id);
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
        title="VPC Peering"
        description="Manage VPC-to-VPC connections"
        actions={
          <Button variant="primary" onClick={() => setShowCreateForm(true)}>
            Create Peering
          </Button>
        }
      />

      {showCreateForm && (
        <Card className="mb-4 p-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <select
              value={form.sourceVpcId}
              onChange={(e) => setForm({ ...form, sourceVpcId: e.target.value })}
              className="rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="">Source VPC</option>
              {(vpcs || []).map((vpc) => (
                <option key={vpc.id} value={vpc.id}>
                  {vpc.name} ({vpc.id})
                </option>
              ))}
            </select>
            <select
              value={form.targetVpcId}
              onChange={(e) => setForm({ ...form, targetVpcId: e.target.value })}
              className="rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="">Target VPC</option>
              {(vpcs || []).map((vpc) => (
                <option key={vpc.id} value={vpc.id}>
                  {vpc.name} ({vpc.id})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="default" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              Create
            </Button>
          </div>
        </Card>
      )}

      {!peerings || peerings.length === 0 ? (
        <Card>
          <p className="text-muted">No peering connections.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-semibold">ID</th>
                <th className="px-4 py-2 text-left font-semibold">Source VPC</th>
                <th className="px-4 py-2 text-left font-semibold">Target VPC</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-left font-semibold">Created</th>
                <th className="px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {peerings.map((peering) => (
                <tr key={peering.id} className="border-b border-border/50">
                  <td className="px-4 py-3 font-mono text-xs">{peering.id}</td>
                  <td className="px-4 py-3 text-xs">{peering.sourceVpcId}</td>
                  <td className="px-4 py-3 text-xs">{peering.targetVpcId}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={
                        peering.status === "active"
                          ? "running"
                          : peering.status === "pending-acceptance"
                            ? "pending"
                            : "stopped"
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {peering.createdAt?.split("T")[0] || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(peering.id)}
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
