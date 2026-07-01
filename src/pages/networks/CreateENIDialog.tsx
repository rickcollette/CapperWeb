import { useState } from "react";
import { useCreateNetworkInterface } from "@/api/eni";
import { useVPCs } from "@/api/topology";
import { Button, TextInput } from "@/components/common/ui";
import type { CreateENIRequest } from "@/api/eni";

interface CreateENIDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateENIDialog({ open, onClose }: CreateENIDialogProps) {
  const [form, setForm] = useState<CreateENIRequest>({
    vpcId: "",
    subnetId: "",
    description: "",
  });
  const { data: vpcs } = useVPCs();
  const createMutation = useCreateNetworkInterface();

  const handleSubmit = async () => {
    if (!form.vpcId || !form.subnetId) {
      alert("VPC and Subnet are required");
      return;
    }
    try {
      await createMutation.mutateAsync(form);
      onClose();
      setForm({ vpcId: "", subnetId: "", description: "" });
    } catch (err) {
      alert(`Error creating ENI: ${err}`);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-slate-900 rounded-lg border border-border p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Create Network Interface</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">VPC</label>
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
          </div>

          <TextInput
            label="Subnet ID"
            placeholder="subnet-xxxxxx"
            value={form.subnetId}
            onChange={(e) => setForm({ ...form, subnetId: e.target.value })}
          />

          <TextInput
            label="Description (optional)"
            placeholder="My network interface"
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="pt-4 flex gap-2 justify-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
