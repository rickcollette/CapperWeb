import { useState } from "react";
import { useAttachNetworkInterface } from "@/api/eni";
import { Button, TextInput } from "@/components/common/ui";
import type { CapperInstance } from "@/types/capper";
import type { AttachENIRequest } from "@/api/eni";

interface AttachENIDialogProps {
  open: boolean;
  eniId: string;
  onClose: () => void;
  instances: CapperInstance[];
}

export function AttachENIDialog({ open, eniId, onClose, instances }: AttachENIDialogProps) {
  const [form, setForm] = useState<AttachENIRequest>({
    instanceId: "",
    deviceIndex: 1,
  });
  const attachMutation = useAttachNetworkInterface(eniId);

  const handleSubmit = async () => {
    if (!form.instanceId) {
      alert("Instance is required");
      return;
    }
    try {
      await attachMutation.mutateAsync(form);
      onClose();
      setForm({ instanceId: "", deviceIndex: 1 });
    } catch (err) {
      alert(`Error attaching ENI: ${err}`);
    }
  };

  if (!open) return null;

  const runningInstances = instances.filter((inst) => inst.status === "running");

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-slate-900 rounded-lg border border-border p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Attach Network Interface</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Instance</label>
            <select
              value={form.instanceId}
              onChange={(e) => setForm({ ...form, instanceId: e.target.value })}
              className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="">Select running instance</option>
              {runningInstances.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.id})
                </option>
              ))}
            </select>
            {runningInstances.length === 0 && (
              <p className="text-xs text-red-400 mt-1">No running instances available</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Device Index</label>
            <input
              type="number"
              min="0"
              max="10"
              value={form.deviceIndex}
              onChange={(e) => setForm({ ...form, deviceIndex: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-border bg-slate-800 px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted mt-1">
              0 is primary, 1+ for secondary interfaces
            </p>
          </div>

          <div className="pt-4 flex gap-2 justify-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={attachMutation.isPending || !form.instanceId}
            >
              {attachMutation.isPending ? "Attaching..." : "Attach"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
