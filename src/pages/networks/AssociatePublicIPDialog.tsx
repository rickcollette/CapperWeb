import { useState } from "react";
import { useAssociatePublicIP } from "@/api/publicip";
import { useInstances } from "@/api/instances";
import { useNetworkInterfaces } from "@/api/eni";
import { Button } from "@/components/common/ui";
import type { PublicIP, AssociatePublicIPRequest } from "@/api/publicip";

interface AssociatePublicIPDialogProps {
  open: boolean;
  ip: PublicIP | null;
  onClose: () => void;
}

export function AssociatePublicIPDialog({ open, ip, onClose }: AssociatePublicIPDialogProps) {
  const [resourceType, setResourceType] = useState<"instance" | "eni">("instance");
  const [resourceId, setResourceId] = useState("");
  const { data: instances } = useInstances();
  const { data: enis } = useNetworkInterfaces();
  const associateMutation = useAssociatePublicIP(ip?.allocationId || "");

  const handleSubmit = async () => {
    if (!resourceId) {
      alert("Please select a resource");
      return;
    }
    try {
      const body: AssociatePublicIPRequest = { resourceType, resourceId };
      await associateMutation.mutateAsync(body);
      onClose();
    } catch (err) {
      alert(`Error associating IP: ${err}`);
    }
  };

  if (!open || !ip) return null;

  const instances_list = instances || [];
  const enis_list = enis || [];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-slate-900 rounded-lg border border-border p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Associate {ip.ipAddress}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Resource Type</label>
            <div className="flex gap-2">
              {(["instance", "eni"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setResourceType(type);
                    setResourceId("");
                  }}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
                    resourceType === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-slate-800 text-muted hover:bg-slate-700"
                  }`}
                >
                  {type === "instance" ? "Instance" : "ENI"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">
              {resourceType === "instance" ? "Instance" : "Network Interface"}
            </label>
            <select
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="">Select {resourceType}</option>
              {resourceType === "instance" ? (
                instances_list.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.id})
                  </option>
                ))
              ) : (
                enis_list.map((eni) => (
                  <option key={eni.id} value={eni.id}>
                    {eni.id} ({eni.privateIpAddress})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="pt-4 flex gap-2 justify-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={associateMutation.isPending || !resourceId}
            >
              {associateMutation.isPending ? "Associating..." : "Associate"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
