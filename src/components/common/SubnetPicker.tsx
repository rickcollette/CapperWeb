import { useVPCs, useVPCSubnets } from "@/api/topology";
import type { SubnetPurpose } from "@/lib/subnetKinds";

export interface SubnetSelection {
  vpcId: string;
  subnetId: string;
}

interface SubnetPickerProps {
  vpcId: string;
  subnetId: string;
  onChange: (next: SubnetSelection) => void;
  /** Restrict the subnet list to kinds suitable for this purpose. */
  purpose?: SubnetPurpose;
  /** Mark the subnet select as required (blocks native form submit until chosen). */
  required?: boolean;
  className?: string;
}

const selectClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

/**
 * VPC + subnet picker. Every placement-bound resource (instances, load
 * balancers, managed databases, private DNS zones) must be placed in a VPC
 * subnet; flat networks no longer exist.
 */
export function SubnetPicker({ vpcId, subnetId, onChange, purpose, required, className }: SubnetPickerProps) {
  const { data: vpcs } = useVPCs();
  const activeVpc = vpcId || vpcs?.[0]?.id || "";
  const { data: subnets } = useVPCSubnets(activeVpc, purpose);

  return (
    <div className={className ?? "grid gap-2 sm:grid-cols-2"}>
      <label className="block space-y-1">
        <span className="text-xs text-muted">VPC</span>
        <select
          className={selectClass}
          value={activeVpc}
          onChange={(e) => onChange({ vpcId: e.target.value, subnetId: "" })}
        >
          {!vpcs?.length && <option value="">No VPCs — create one first</option>}
          {(vpcs ?? []).map((v: { id: string; name?: string; slug?: string }) => (
            <option key={v.id} value={v.id}>
              {v.name ?? v.slug ?? v.id}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-muted">Subnet</span>
        <select
          className={selectClass}
          value={subnetId}
          onChange={(e) => onChange({ vpcId: activeVpc, subnetId: e.target.value })}
          required={required}
        >
          <option value="">Select subnet...</option>
          {(subnets ?? []).map((s: { id: string; name?: string; cidr?: string }) => (
            <option key={s.id} value={s.id}>
              {s.name ?? s.id}
              {s.cidr ? ` (${s.cidr})` : ""}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
