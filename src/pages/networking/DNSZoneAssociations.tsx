import { useState } from "react";
import { useParams } from "react-router-dom";
import { useDNSZoneVPCAssociations, useAssociateDNSZoneToVPC, useDisassociateDNSZoneFromVPC } from "@/api/dnsassociation";
import { useVPCs } from "@/api/topology";
import { PageHeader, Button, Card, StatusBadge } from "@/components/common/ui";

export function DNSZoneAssociations() {
  const { zoneId = "" } = useParams();
  const { data: associations, isLoading } = useDNSZoneVPCAssociations(zoneId);
  const { data: vpcs } = useVPCs();
  const associateMutation = useAssociateDNSZoneToVPC(zoneId);
  const disassociateMutation = useDisassociateDNSZoneFromVPC(zoneId, "");
  const [showAssociateForm, setShowAssociateForm] = useState(false);
  const [selectedVpcId, setSelectedVpcId] = useState("");

  const associatedVpcIds = new Set(associations?.map((a) => a.vpcId) || []);
  const availableVpcs = (vpcs || []).filter((vpc) => !associatedVpcIds.has(vpc.id));

  const handleAssociate = async () => {
    if (!selectedVpcId) {
      alert("Please select a VPC");
      return;
    }
    try {
      await associateMutation.mutateAsync(selectedVpcId);
      setShowAssociateForm(false);
      setSelectedVpcId("");
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  const handleDisassociate = async (associationId: string, vpcId: string) => {
    if (confirm(`Disassociate ${vpcId}?`)) {
      try {
        const { mutateAsync } = useDisassociateDNSZoneFromVPC(zoneId, associationId);
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
        title={`DNS Zone: ${zoneId}`}
        description="Manage VPC associations for private DNS resolution"
        actions={
          <Button variant="primary" onClick={() => setShowAssociateForm(true)} disabled={availableVpcs.length === 0}>
            Associate VPC
          </Button>
        }
      />

      {showAssociateForm && (
        <Card className="mb-4 p-4 space-y-4">
          <select
            value={selectedVpcId}
            onChange={(e) => setSelectedVpcId(e.target.value)}
            className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
          >
            <option value="">Select VPC to associate</option>
            {availableVpcs.map((vpc) => (
              <option key={vpc.id} value={vpc.id}>
                {vpc.name} ({vpc.id})
              </option>
            ))}
          </select>

          {availableVpcs.length === 0 && (
            <p className="text-xs text-red-400">All VPCs are already associated with this zone.</p>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="default" onClick={() => setShowAssociateForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssociate}
              disabled={associateMutation.isPending || !selectedVpcId}
            >
              {associateMutation.isPending ? "Associating..." : "Associate"}
            </Button>
          </div>
        </Card>
      )}

      {!associations || associations.length === 0 ? (
        <Card>
          <p className="text-muted">No VPCs associated with this zone yet.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-semibold">VPC ID</th>
                <th className="px-4 py-2 text-left font-semibold">Association ID</th>
                <th className="px-4 py-2 text-left font-semibold">Associated</th>
                <th className="px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {associations.map((assoc) => (
                <tr key={assoc.associationId} className="border-b border-border/50 hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-xs">{assoc.vpcId}</td>
                  <td className="px-4 py-3 font-mono text-xs">{assoc.associationId || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {assoc.createdAt?.split("T")[0] || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDisassociate(assoc.associationId || "", assoc.vpcId)}
                      disabled={disassociateMutation.isPending}
                    >
                      Disassociate
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
