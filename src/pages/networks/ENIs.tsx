import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNetworkInterfaces, useDeleteNetworkInterface } from "@/api/eni";
import { useVPCs } from "@/api/topology";
import { PageHeader, Button, Card, StatusBadge, TextInput } from "@/components/common/ui";
import { CreateENIDialog } from "@/pages/networks/CreateENIDialog";
import type { NetworkInterface } from "@/api/eni";

export function ENIs() {
  const navigate = useNavigate();
  const { data: enis, isLoading } = useNetworkInterfaces();
  const { data: vpcs } = useVPCs();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterVpc, setFilterVpc] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const deleteENI = useDeleteNetworkInterface("");

  const filteredENIs = (enis || []).filter((eni) => {
    if (filterVpc && eni.vpcId !== filterVpc) return false;
    if (filterStatus && eni.status !== filterStatus) return false;
    return true;
  });

  const handleDelete = async (eni: NetworkInterface) => {
    if (confirm(`Delete ENI ${eni.id}?`)) {
      try {
        const { mutateAsync } = useDeleteNetworkInterface(eni.id);
        await mutateAsync();
      } catch (err) {
        alert(`Error deleting ENI: ${err}`);
      }
    }
  };

  if (isLoading) return <p className="text-muted">Loading ENIs...</p>;

  return (
    <div>
      <PageHeader
        title="Elastic Network Interfaces"
        description="Manage virtual network adapters"
        actions={
          <Button variant="primary" onClick={() => setShowCreateDialog(true)}>
            Create ENI
          </Button>
        }
      />

      <CreateENIDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />

      <Card className="mb-4">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Filter by VPC"
            placeholder="All VPCs"
            value={filterVpc}
            onChange={(e) => setFilterVpc(e.target.value)}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-border bg-slate-900 px-3 py-2 text-sm text-slate-100"
          >
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="in-use">In Use</option>
            <option value="creating">Creating</option>
            <option value="deleting">Deleting</option>
          </select>
        </div>
      </Card>

      {filteredENIs.length === 0 ? (
        <Card>
          <p className="text-muted">No network interfaces found.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-semibold">ID</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-left font-semibold">VPC</th>
                <th className="px-4 py-2 text-left font-semibold">Private IP</th>
                <th className="px-4 py-2 text-left font-semibold">Attached To</th>
                <th className="px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredENIs.map((eni) => (
                <tr key={eni.id} className="border-b border-border/50 hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-xs">{eni.id}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={eni.status === "available" ? "running" : eni.status} />
                  </td>
                  <td className="px-4 py-3 text-xs">{eni.vpcId}</td>
                  <td className="px-4 py-3 font-mono text-xs">{eni.privateIpAddress}</td>
                  <td className="px-4 py-3 text-xs">
                    {eni.attachedInstanceId ? (
                      <button
                        onClick={() => navigate(`/instances/${eni.attachedInstanceId}`)}
                        className="text-primary hover:underline"
                      >
                        {eni.attachedInstanceId}
                      </button>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => navigate(`/networks/enis/${eni.id}`)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={eni.status !== "available"}
                      onClick={() => handleDelete(eni)}
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
