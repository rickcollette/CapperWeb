import { useState } from "react";
import { useCreateNetworkInterface } from "@/api/eni";
import { Button, TextInput } from "@/components/common/ui";
import { SubnetPicker } from "@/components/common/SubnetPicker";
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
          <SubnetPicker
            className="space-y-4"
            vpcId={form.vpcId}
            subnetId={form.subnetId}
            onChange={(next) => setForm({ ...form, ...next })}
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
