import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useNetworkInterface,
  useAttachNetworkInterface,
  useDetachNetworkInterface,
  useAddPrivateIp,
} from "@/api/eni";
import { useInstances } from "@/api/instances";
import { PageHeader, Button, Card, StatusBadge } from "@/components/common/ui";
import { AttachENIDialog } from "@/pages/networks/AttachENIDialog";

const tabs = ["Overview", "Attachments", "Private IPs"] as const;

export function ENIDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: eni, isLoading } = useNetworkInterface(id);
  const { data: instances } = useInstances();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const detachMutation = useDetachNetworkInterface(id);
  const addPrivateIpMutation = useAddPrivateIp(id);

  const handleDetach = async () => {
    if (confirm("Detach this ENI from the instance?")) {
      try {
        await detachMutation.mutateAsync();
      } catch (err) {
        alert(`Error detaching ENI: ${err}`);
      }
    }
  };

  if (isLoading) return <p className="text-muted">Loading...</p>;
  if (!eni) return <p className="text-red-400">ENI not found.</p>;

  return (
    <div>
      <PageHeader
        title={`ENI ${eni.id}`}
        description={eni.description || "Network Interface"}
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAttachDialog(true)}
              disabled={eni.status !== "available"}
            >
              Attach
            </Button>
            <Button
              onClick={handleDetach}
              disabled={!eni.attachedInstanceId || detachMutation.isPending}
            >
              {detachMutation.isPending ? "Detaching..." : "Detach"}
            </Button>
            <Button variant="danger" onClick={() => navigate("/networks/enis")}>
              Back
            </Button>
          </div>
        }
      />

      <AttachENIDialog
        open={showAttachDialog}
        eniId={id}
        onClose={() => setShowAttachDialog(false)}
        instances={instances || []}
      />

      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === t ? "bg-primary/15 text-primary" : "text-muted hover:bg-slate-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <Card className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="text-muted text-xs">Status</span>
            <div className="mt-1">
              <StatusBadge status={eni.status === "available" ? "running" : eni.status} />
            </div>
          </div>
          <div>
            <span className="text-muted text-xs">VPC ID</span>
            <div className="font-mono text-sm">{eni.vpcId}</div>
          </div>
          <div>
            <span className="text-muted text-xs">Subnet ID</span>
            <div className="font-mono text-sm">{eni.subnetId}</div>
          </div>
          <div>
            <span className="text-muted text-xs">MAC Address</span>
            <div className="font-mono text-sm">{eni.macAddress}</div>
          </div>
          <div>
            <span className="text-muted text-xs">Primary Private IP</span>
            <div className="font-mono text-sm">{eni.privateIpAddress}</div>
          </div>
          <div>
            <span className="text-muted text-xs">Created</span>
            <div className="text-sm">{eni.createdAt || "—"}</div>
          </div>
          {eni.attachedInstanceId && (
            <div>
              <span className="text-muted text-xs">Attached Instance</span>
              <div>
                <button
                  onClick={() => navigate(`/instances/${eni.attachedInstanceId}`)}
                  className="text-primary hover:underline text-sm"
                >
                  {eni.attachedInstanceId}
                </button>
              </div>
            </div>
          )}
          {eni.securityGroupIds && eni.securityGroupIds.length > 0 && (
            <div className="md:col-span-2">
              <span className="text-muted text-xs">Security Groups</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {eni.securityGroupIds.map((sgId) => (
                  <span key={sgId} className="rounded-lg bg-slate-800 px-2 py-1 text-xs">
                    {sgId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === "Attachments" && (
        <Card>
          {eni.attachedInstanceId ? (
            <div>
              <div className="mb-3">
                <span className="text-muted text-xs">Attached Instance</span>
                <div>
                  <button
                    onClick={() => navigate(`/instances/${eni.attachedInstanceId}`)}
                    className="text-primary hover:underline"
                  >
                    {eni.attachedInstanceId}
                  </button>
                </div>
              </div>
              <div>
                <span className="text-muted text-xs">Device Index</span>
                <div>{eni.attachedDeviceIndex ?? "—"}</div>
              </div>
            </div>
          ) : (
            <p className="text-muted">This ENI is not attached to any instance.</p>
          )}
        </Card>
      )}

      {tab === "Private IPs" && (
        <Card>
          <div className="space-y-3">
            {eni.privateIpAddresses && eni.privateIpAddresses.length > 0 ? (
              <div className="space-y-2">
                {eni.privateIpAddresses.map((ip) => (
                  <div key={ip.privateIpAddress} className="rounded-lg bg-slate-800 p-3">
                    <div className="flex justify-between">
                      <div className="font-mono text-sm">{ip.privateIpAddress}</div>
                      {ip.primary && (
                        <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    {ip.publicIpAddress && (
                      <div className="text-xs text-muted mt-1">
                        Public: {ip.publicIpAddress}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No private IPs assigned.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
