import { useState } from "react";
import { useVPCEndpoints, useCreateVPCEndpoint, useDeleteVPCEndpoint } from "@/api/vpcendpoints";
import { useVPCs } from "@/api/topology";
import { PageHeader, Button, Card, StatusBadge } from "@/components/common/ui";

const GATEWAY_SERVICES = ["com.amazonaws.s3", "com.amazonaws.dynamodb"];
const INTERFACE_SERVICES = ["ec2", "elasticloadbalancing", "sns", "sqs"];

export function VPCEndpoints() {
  const { data: endpoints, isLoading } = useVPCEndpoints();
  const { data: vpcs } = useVPCs();
  const createMutation = useCreateVPCEndpoint();
  const deleteMutation = useDeleteVPCEndpoint("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    vpcId: "",
    type: "Gateway" as "Gateway" | "Interface",
    serviceName: "",
  });

  const handleCreate = async () => {
    if (!form.vpcId || !form.serviceName) {
      alert("VPC and service required");
      return;
    }
    try {
      await createMutation.mutateAsync(form as any);
      setShowCreateForm(false);
      setForm({ vpcId: "", type: "Gateway", serviceName: "" });
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete endpoint?")) {
      try {
        const { mutateAsync } = useDeleteVPCEndpoint(id);
        await mutateAsync();
      } catch (err) {
        alert(`Error: ${err}`);
      }
    }
  };

  if (isLoading) return <p className="text-muted">Loading...</p>;

  const services = form.type === "Gateway" ? GATEWAY_SERVICES : INTERFACE_SERVICES;

  return (
    <div>
      <PageHeader
        title="VPC Endpoints"
        description="Manage service endpoints and connections"
        actions={
          <Button variant="primary" onClick={() => setShowCreateForm(true)}>
            Create Endpoint
          </Button>
        }
      />

      {showCreateForm && (
        <Card className="mb-4 p-4 space-y-4">
          <select
            value={form.vpcId}
            onChange={(e) => setForm({ ...form, vpcId: e.target.value })}
            className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
          >
            <option value="">Select VPC</option>
            {(vpcs || []).map((vpc) => (
              <option key={vpc.id} value={vpc.id}>
                {vpc.name} ({vpc.id})
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            {(["Gateway", "Interface"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setForm({ ...form, type, serviceName: "" })}
                className={`flex-1 rounded-lg px-3 py-2 text-sm ${
                  form.type === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-slate-800 text-muted"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <select
            value={form.serviceName}
            onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
            className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
          >
            <option value="">Select service</option>
            {services.map((svc) => (
              <option key={svc} value={svc}>
                {svc}
              </option>
            ))}
          </select>

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

      {!endpoints || endpoints.length === 0 ? (
        <Card>
          <p className="text-muted">No endpoints.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-semibold">ID</th>
                <th className="px-4 py-2 text-left font-semibold">Type</th>
                <th className="px-4 py-2 text-left font-semibold">Service</th>
                <th className="px-4 py-2 text-left font-semibold">VPC</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint) => (
                <tr key={endpoint.id} className="border-b border-border/50">
                  <td className="px-4 py-3 font-mono text-xs">{endpoint.id}</td>
                  <td className="px-4 py-3 text-xs">{endpoint.type}</td>
                  <td className="px-4 py-3 text-xs">{endpoint.serviceName}</td>
                  <td className="px-4 py-3 text-xs">{endpoint.vpcId}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={endpoint.status === "available" ? "running" : "pending"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(endpoint.id)}
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
