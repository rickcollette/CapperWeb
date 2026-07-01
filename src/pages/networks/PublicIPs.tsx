import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  usePublicIPs,
  useAllocatePublicIP,
  useReleasePublicIP,
  useDisassociatePublicIP,
} from "@/api/publicip";
import { PageHeader, Button, Card, StatusBadge, TextInput } from "@/components/common/ui";
import { AssociatePublicIPDialog } from "@/pages/networks/AssociatePublicIPDialog";
import type { PublicIP } from "@/api/publicip";

export function PublicIPs() {
  const { data: ips, isLoading } = usePublicIPs();
  const allocateMutation = useAllocatePublicIP();
  const releaseMutation = useReleasePublicIP("");
  const disassociateMutation = useDisassociatePublicIP("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showAssociateDialog, setShowAssociateDialog] = useState(false);
  const [selectedIP, setSelectedIP] = useState<PublicIP | null>(null);

  const filteredIPs = (ips || []).filter((ip) => {
    if (filterStatus && ip.status !== filterStatus) return false;
    return true;
  });

  const handleAllocate = async () => {
    try {
      await allocateMutation.mutateAsync({});
    } catch (err) {
      alert(`Error allocating IP: ${err}`);
    }
  };

  const handleRelease = async (ip: PublicIP) => {
    if (confirm(`Release ${ip.ipAddress}?`)) {
      try {
        const { mutateAsync } = useReleasePublicIP(ip.allocationId);
        await mutateAsync();
      } catch (err) {
        alert(`Error releasing IP: ${err}`);
      }
    }
  };

  const handleDisassociate = async (ip: PublicIP) => {
    if (!ip.associationId) return;
    if (confirm(`Disassociate ${ip.ipAddress}?`)) {
      try {
        const { mutateAsync } = useDisassociatePublicIP(ip.associationId);
        await mutateAsync();
      } catch (err) {
        alert(`Error disassociating IP: ${err}`);
      }
    }
  };

  if (isLoading) return <p className="text-muted">Loading public IPs...</p>;

  return (
    <div>
      <PageHeader
        title="Public IP Addresses"
        description="Manage elastic public IP allocations"
        actions={
          <Button
            variant="primary"
            onClick={handleAllocate}
            disabled={allocateMutation.isPending}
          >
            {allocateMutation.isPending ? "Allocating..." : "Allocate IP"}
          </Button>
        }
      />

      <AssociatePublicIPDialog
        open={showAssociateDialog}
        ip={selectedIP}
        onClose={() => {
          setShowAssociateDialog(false);
          setSelectedIP(null);
        }}
      />

      <Card className="mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-border bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="associated">Associated</option>
          <option value="released">Released</option>
        </select>
      </Card>

      {filteredIPs.length === 0 ? (
        <Card>
          <p className="text-muted">No public IPs found.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-semibold">IP Address</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-left font-semibold">Associated With</th>
                <th className="px-4 py-2 text-left font-semibold">Created</th>
                <th className="px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIPs.map((ip) => (
                <tr key={ip.allocationId} className="border-b border-border/50 hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-sm font-semibold">{ip.ipAddress}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={
                        ip.status === "available"
                          ? "running"
                          : ip.status === "associated"
                            ? "running"
                            : "stopped"
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {ip.instanceId ? (
                      <span>{ip.instanceId}</span>
                    ) : ip.eniId ? (
                      <span>{ip.eniId}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{ip.createdAt?.split("T")[0] || "—"}</td>
                  <td className="px-4 py-3 space-x-2">
                    {ip.status === "available" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedIP(ip);
                          setShowAssociateDialog(true);
                        }}
                      >
                        Associate
                      </Button>
                    )}
                    {ip.status === "associated" && (
                      <Button
                        size="sm"
                        onClick={() => handleDisassociate(ip)}
                        disabled={disassociateMutation.isPending}
                      >
                        Disassociate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRelease(ip)}
                      disabled={releaseMutation.isPending || ip.status === "associated"}
                    >
                      Release
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
